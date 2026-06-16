import XCTest
import CoreLocation
@testable import CoffeeSuppliesApp

/// Unit tests for CheckoutViewModel: order assembly, totals, snapshots, payment-status mapping,
/// Apple Pay / COD paths, geofence gating, and the Firestore write.
@MainActor
final class CheckoutViewModelTests: XCTestCase {
    private var cart: CartStore!
    private var mockFirestore: MockFirestoreService!
    private var mockPayment: MockPaymentService!
    private let fixedDate = Date(timeIntervalSince1970: 1_700_000_000)

    override func setUp() {
        super.setUp()
        cart = CartStore()
        mockFirestore = MockFirestoreService()
        mockPayment = MockPaymentService()
    }

    override func tearDown() {
        cart = nil
        mockFirestore = nil
        mockPayment = nil
        super.tearDown()
    }

    private func makeSUT(customerId: String = "cust-1") -> CheckoutViewModel {
        CheckoutViewModel(
            cart: cart,
            firestoreService: mockFirestore,
            paymentService: mockPayment,
            customerId: customerId,
            now: { self.fixedDate }
        )
    }

    private func seedCart() {
        cart.add(CartItem(product: TestData.paperCupHot, variant: TestData.paperCupHot.variants[1], quantity: 2)) // 8oz @ 48
        cart.add(CartItem(product: TestData.customPrintedCup, variant: nil, quantity: 1)) // @ 450
    }

    private func fillValidDelivery(_ sut: CheckoutViewModel) {
        sut.deliveryCoordinate = JeddahGeofence.center
        sut.selectedDistrict = JeddahDistricts.all.first { $0.id == "al_rawdah" }
        sut.businessName = "Test Cafe"
        sut.phone = "+966500000001"
    }

    // MARK: - Totals

    func testTotals_SumCartLineTotals() {
        seedCart()
        let sut = makeSUT()
        XCTAssertEqual(sut.subtotal, 546) // 48*2 + 450
        XCTAssertEqual(sut.total, 546)    // VAT-inclusive, no separate tax
    }

    // MARK: - canPlaceOrder Gating

    func testCanPlaceOrder_FalseWhenCartEmpty() {
        let sut = makeSUT()
        fillValidDelivery(sut)
        XCTAssertFalse(sut.canPlaceOrder)
    }

    func testCanPlaceOrder_FalseWhenNoLocation() {
        seedCart()
        let sut = makeSUT()
        sut.selectedDistrict = JeddahDistricts.other
        sut.businessName = "Test"
        XCTAssertFalse(sut.canPlaceOrder)
    }

    func testCanPlaceOrder_FalseWhenOutsideJeddah() {
        seedCart()
        let sut = makeSUT()
        sut.deliveryCoordinate = CLLocationCoordinate2D(latitude: 24.7136, longitude: 46.6753) // Riyadh
        sut.selectedDistrict = JeddahDistricts.other
        sut.businessName = "Test"
        XCTAssertFalse(sut.isInJeddah)
        XCTAssertFalse(sut.canPlaceOrder)
    }

    func testCanPlaceOrder_TrueWhenAllValid() {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        XCTAssertTrue(sut.canPlaceOrder)
    }

    // MARK: - Order Assembly

    func testBuildOrder_SnapshotsLineItems() {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)

        let order = sut.buildOrder(paymentStatus: .codUnpaid, id: "order-1")

        XCTAssertEqual(order.items.count, 2)
        // variantLabel is localized and depends on shared LanguageManager state;
        // assert non-nil presence rather than exact content.
        XCTAssertNotNil(order.items[0].variantLabel)
        XCTAssertEqual(order.items[0].unitPrice, 48)
        XCTAssertEqual(order.items[0].quantity, 2)
        XCTAssertEqual(order.items[0].lineTotal, 96)
        XCTAssertEqual(order.items[0].costPrice, 30) // snapshot from variant
        XCTAssertNil(order.items[1].variantLabel)
        XCTAssertEqual(order.subtotal, 546)
        XCTAssertEqual(order.total, 546)
    }

    func testBuildOrder_IncludesCoordinatesAndDistrict() {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.street = "King St"
        sut.notes = "Side entrance"

        let order = sut.buildOrder(paymentStatus: .codUnpaid, id: "order-1")

        XCTAssertEqual(order.deliveryAddress.lat, JeddahGeofence.center.latitude, accuracy: 0.0001)
        XCTAssertEqual(order.deliveryAddress.lng, JeddahGeofence.center.longitude, accuracy: 0.0001)
        XCTAssertEqual(order.deliveryAddress.city, "Jeddah")
        XCTAssertEqual(order.deliveryAddress.street, "King St")
        XCTAssertEqual(order.deliveryAddress.notes, "Side entrance")
        XCTAssertFalse(order.deliveryAddress.district.isEmpty)
    }

    func testBuildOrder_SetsCustomerAndDefaults() {
        seedCart()
        let sut = makeSUT(customerId: "cust-42")
        fillValidDelivery(sut)

        let order = sut.buildOrder(paymentStatus: .codUnpaid, id: "order-1")

        XCTAssertEqual(order.customerId, "cust-42")
        XCTAssertEqual(order.businessName, "Test Cafe")
        XCTAssertEqual(order.status, .pending)
        XCTAssertNil(order.supplierId)
        XCTAssertEqual(order.createdAt, fixedDate)
    }

    // MARK: - Cash on Delivery

    func testPlaceOrder_COD_WritesOrderWithUnpaidStatus() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .cashOnDelivery

        await sut.placeOrder()

        XCTAssertNotNil(sut.placedOrder)
        XCTAssertEqual(sut.placedOrder?.paymentMethod, .cashOnDelivery)
        XCTAssertEqual(sut.placedOrder?.paymentStatus, .codUnpaid)
        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("setDocument(orders") })
        XCTAssertTrue(cart.isEmpty) // cart cleared after success
        XCTAssertFalse(mockPayment.methodCalls.contains { $0.contains("processApplePay") })
    }

    // MARK: - Apple Pay

    func testPlaceOrder_ApplePaySuccess_WritesPaidOrder() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .applePay
        mockPayment.simulatedResult = .success

        await sut.placeOrder()

        XCTAssertEqual(sut.placedOrder?.paymentMethod, .applePay)
        XCTAssertEqual(sut.placedOrder?.paymentStatus, .paid)
        XCTAssertTrue(mockPayment.methodCalls.contains { $0.contains("processApplePay") })
        XCTAssertTrue(cart.isEmpty)
    }

    func testPlaceOrder_ApplePayCancelled_NoOrderWritten() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .applePay
        mockPayment.simulatedResult = .cancelled

        await sut.placeOrder()

        XCTAssertNil(sut.placedOrder)
        XCTAssertFalse(cart.isEmpty)
        XCTAssertFalse(mockFirestore.methodCalls.contains { $0.contains("setDocument(orders") })
        XCTAssertNil(sut.errorMessage) // cancellation is silent
    }

    func testPlaceOrder_ApplePayFailed_ShowsFallback() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .applePay
        mockPayment.simulatedResult = .failed("Card declined")

        await sut.placeOrder()

        XCTAssertNil(sut.placedOrder)
        XCTAssertEqual(sut.errorMessage, "Card declined")
        XCTAssertTrue(sut.showApplePayFallback)
        XCTAssertFalse(cart.isEmpty)
    }

    func testSwitchToCashOnDelivery_ResetsFallback() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .applePay
        mockPayment.simulatedResult = .failed("Card declined")
        await sut.placeOrder()

        sut.switchToCashOnDelivery()

        XCTAssertEqual(sut.selectedPaymentMethod, .cashOnDelivery)
        XCTAssertFalse(sut.showApplePayFallback)
        XCTAssertNil(sut.errorMessage)
    }

    // MARK: - Firestore Failure

    func testPlaceOrder_FirestoreError_SetsErrorMessage() async {
        seedCart()
        let sut = makeSUT()
        fillValidDelivery(sut)
        sut.selectedPaymentMethod = .cashOnDelivery
        mockFirestore.errorToThrow = NSError(domain: "fs", code: 1, userInfo: [NSLocalizedDescriptionKey: "Write failed"])

        await sut.placeOrder()

        XCTAssertNil(sut.placedOrder)
        XCTAssertEqual(sut.errorMessage, "Write failed")
        XCTAssertFalse(cart.isEmpty) // not cleared on failure
    }

    // MARK: - Profile Pre-fill

    func testLoadUserProfile_PrefillsFromSavedUser() async {
        mockFirestore.seedDocument(TestData.sampleUser, collection: "users", documentId: "cust-1")
        let sut = makeSUT(customerId: "cust-1")

        await sut.loadUserProfile()

        XCTAssertEqual(sut.businessName, TestData.sampleUser.businessName)
        XCTAssertEqual(sut.phone, TestData.sampleUser.phone)
        // sampleUser has a saved delivery address → coordinate pre-filled
        XCTAssertNotNil(sut.deliveryCoordinate)
    }

    func testLoadUserProfile_NoUser_LeavesFieldsEmpty() async {
        let sut = makeSUT(customerId: "missing")
        await sut.loadUserProfile()
        XCTAssertTrue(sut.businessName.isEmpty)
    }
}

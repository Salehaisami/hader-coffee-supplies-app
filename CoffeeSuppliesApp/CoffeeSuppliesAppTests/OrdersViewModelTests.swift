import XCTest
@testable import CoffeeSuppliesApp

/// Tests for OrdersViewModel: load, active/past split, cancellation, and empty state.
@MainActor
final class OrdersViewModelTests: XCTestCase {
    private var mockFirestore: MockFirestoreService!

    override func setUp() {
        super.setUp()
        mockFirestore = MockFirestoreService()
    }

    override func tearDown() {
        mockFirestore = nil
        super.tearDown()
    }

    private func makeSUT(customerId: String? = "cust-1") -> OrdersViewModel {
        OrdersViewModel(firestoreService: mockFirestore, customerId: customerId)
    }

    // MARK: - Load

    func testLoadOrders_NoCustomerId_StaysEmpty() async {
        let sut = makeSUT(customerId: nil)
        await sut.loadOrders()
        XCTAssertTrue(sut.isEmpty)
    }

    func testLoadOrders_PopulatesOrders() async {
        mockFirestore.seedDocument(TestData.sampleOrder, collection: "orders", documentId: TestData.sampleOrder.id)
        let sut = makeSUT(customerId: TestData.sampleOrder.customerId)
        await sut.loadOrders()
        // Note: MockFirestoreService.getDocuments(whereField:) returns [] by design,
        // so we test the method-call tracking only here.
        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("getDocuments(orders") })
        XCTAssertFalse(sut.isLoading)
    }

    // MARK: - Active / Past Split

    func testActiveOrders_OnlyPendingAndSent() {
        let sut = makeSUT()
        let pending = makeOrder(status: .pending)
        let sent = makeOrder(status: .sentToSupplier)
        let delivered = makeOrder(status: .delivered)
        let cancelled = makeOrder(status: .cancelled)
        sut.orders = [pending, sent, delivered, cancelled]

        XCTAssertEqual(sut.activeOrders.count, 2)
        XCTAssertTrue(sut.activeOrders.contains { $0.status == .pending })
        XCTAssertTrue(sut.activeOrders.contains { $0.status == .sentToSupplier })
    }

    func testPastOrders_OnlyDeliveredAndCancelled() {
        let sut = makeSUT()
        let pending = makeOrder(status: .pending)
        let delivered = makeOrder(status: .delivered)
        let cancelled = makeOrder(status: .cancelled)
        sut.orders = [pending, delivered, cancelled]

        XCTAssertEqual(sut.pastOrders.count, 2)
        XCTAssertTrue(sut.pastOrders.contains { $0.status == .delivered })
        XCTAssertTrue(sut.pastOrders.contains { $0.status == .cancelled })
    }

    // MARK: - Cancellation

    func testCancelOrder_PendingOrder_UpdatesStatus() async {
        let sut = makeSUT()
        let order = makeOrder(status: .pending)
        sut.orders = [order]

        await sut.cancelOrder(order)

        XCTAssertEqual(sut.orders.first?.status, .cancelled)
        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("updateDocument(orders") })
    }

    func testCancelOrder_NonPendingOrder_DoesNothing() async {
        let sut = makeSUT()
        let order = makeOrder(status: .sentToSupplier)
        sut.orders = [order]

        await sut.cancelOrder(order)

        XCTAssertEqual(sut.orders.first?.status, .sentToSupplier)
        XCTAssertFalse(mockFirestore.methodCalls.contains { $0.contains("updateDocument") })
    }

    // MARK: - Empty

    func testIsEmpty_TrueWhenNoOrders() {
        let sut = makeSUT()
        XCTAssertTrue(sut.isEmpty)
    }

    func testIsEmpty_FalseWhenOrdersExist() {
        let sut = makeSUT()
        sut.orders = [makeOrder(status: .pending)]
        XCTAssertFalse(sut.isEmpty)
    }

    // MARK: - Helpers

    private func makeOrder(status: OrderStatus) -> Order {
        Order(
            id: UUID().uuidString,
            customerId: "cust-1",
            businessName: "Test",
            deliveryAddress: TestData.sampleAddress,
            items: [],
            subtotal: 100,
            total: 100,
            paymentMethod: .cashOnDelivery,
            paymentStatus: .codUnpaid,
            status: status,
            supplierId: nil,
            createdAt: Date(),
            updatedAt: nil
        )
    }
}

/// Tests for OrderTracker: status → step mapping and Google Maps URL construction.
final class OrderTrackerTests: XCTestCase {
    func testCurrentStep_Pending() {
        XCTAssertEqual(OrderTracker.currentStep(for: .pending), 0)
    }

    func testCurrentStep_SentToSupplier() {
        XCTAssertEqual(OrderTracker.currentStep(for: .sentToSupplier), 1)
    }

    func testCurrentStep_Delivered() {
        XCTAssertEqual(OrderTracker.currentStep(for: .delivered), 2)
    }

    func testCurrentStep_Cancelled() {
        XCTAssertEqual(OrderTracker.currentStep(for: .cancelled), 0)
    }

    func testGoogleMapsURL_ConstructedFromCoordinates() {
        let order = Order(
            id: "test",
            customerId: "cust",
            businessName: "Cafe",
            deliveryAddress: DeliveryAddress(district: "Al Rawdah", lat: 21.4858, lng: 39.1925),
            items: [],
            subtotal: 0,
            total: 0,
            paymentMethod: .cashOnDelivery,
            paymentStatus: .codUnpaid,
            status: .pending,
            supplierId: nil,
            createdAt: Date(),
            updatedAt: nil
        )
        XCTAssertEqual(
            order.googleMapsURL?.absoluteString,
            "https://www.google.com/maps/search/?api=1&query=21.4858,39.1925"
        )
    }
}

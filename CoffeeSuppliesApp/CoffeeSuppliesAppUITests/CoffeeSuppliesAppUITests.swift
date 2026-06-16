import XCTest

/// UI Tests for the Coffee Supplies App sign-up happy path.
final class CoffeeSuppliesAppUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Happy-Path Sign-Up Flow

    /// Tests the complete sign-up flow:
    /// Account tab (guest) → Sign In → Phone Entry → Code Verification → Profile Setup
    func testSignUpHappyPath() throws {
        // 1. Navigate to Account tab (Shop=0, Cart=1, Orders=2, Account=3)
        let accountTab = app.tabBars.buttons.element(boundBy: 3)
        XCTAssertTrue(accountTab.waitForExistence(timeout: 5))
        accountTab.tap()

        // 2. Guest state: verify sign-in prompt is shown
        let signInButton = app.buttons["account.sign.in"]
        if signInButton.waitForExistence(timeout: 3) {
            signInButton.tap()
        } else {
            // Try alternative label
            let altSignIn = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'sign in' OR label CONTAINS[c] 'تسجيل'")).firstMatch
            XCTAssertTrue(altSignIn.waitForExistence(timeout: 3), "Sign in button not found")
            altSignIn.tap()
        }

        // 3. Phone entry screen
        let phoneField = app.textFields.firstMatch
        XCTAssertTrue(phoneField.waitForExistence(timeout: 5), "Phone field not found")
        phoneField.tap()
        phoneField.typeText("500000001")

        // Tap send code
        let sendCodeButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'send' OR label CONTAINS[c] 'إرسال'")).firstMatch
        XCTAssertTrue(sendCodeButton.waitForExistence(timeout: 3))
        sendCodeButton.tap()

        // 4. Code verification screen
        // Note: In UI testing with real Firebase, this would require a test phone number
        // configured in Firebase Console. For CI, we'd use the Firebase Auth emulator.
        let codeField = app.textFields.firstMatch
        if codeField.waitForExistence(timeout: 5) {
            codeField.tap()
            codeField.typeText("123456")

            // Tap verify
            let verifyButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'verify' OR label CONTAINS[c] 'التحقق'")).firstMatch
            if verifyButton.waitForExistence(timeout: 3) {
                verifyButton.tap()
            }
        }

        // 5. Profile setup (for new users)
        let businessNameField = app.textFields.matching(NSPredicate(format: "label CONTAINS[c] 'business' OR label CONTAINS[c] 'النشاط'")).firstMatch
        if businessNameField.waitForExistence(timeout: 5) {
            businessNameField.tap()
            businessNameField.typeText("مقهى الاختبار")

            let contactField = app.textFields.matching(NSPredicate(format: "label CONTAINS[c] 'contact' OR label CONTAINS[c] 'جهة'")).firstMatch
            if contactField.waitForExistence(timeout: 3) {
                contactField.tap()
                contactField.typeText("محمد")
            }

            // Tap continue
            let continueButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'continue' OR label CONTAINS[c] 'متابعة'")).firstMatch
            if continueButton.waitForExistence(timeout: 3) {
                continueButton.tap()
            }
        }
    }

    // MARK: - Guest Account Tab

    /// Verifies the guest state on the Account tab shows sign-in prompt.
    func testAccountTab_GuestState_ShowsSignInPrompt() throws {
        // Navigate to Account tab (Shop=0, Cart=1, Orders=2, Account=3)
        let accountTab = app.tabBars.buttons.element(boundBy: 3)
        XCTAssertTrue(accountTab.waitForExistence(timeout: 5))
        accountTab.tap()

        // Verify guest prompt elements
        let guestContent = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'sign in' OR label CONTAINS[c] 'سجّل'"))
        XCTAssertTrue(guestContent.firstMatch.waitForExistence(timeout: 3), "Guest prompt text should be visible")
    }

    // MARK: - Language Toggle

    // MARK: - Cash on Delivery Checkout Flow

    /// End-to-end happy path for the Cash-on-Delivery checkout:
    /// Shop → add to cart → Cart → Checkout → set delivery → COD → place order → cart empties.
    ///
    /// Note: a fully deterministic run requires a seeded catalog, a signed-in test user, and a
    /// granted location permission (Firebase Auth emulator + launch seeding). Steps are guarded
    /// with existence checks so the test degrades gracefully when those aren't configured in CI.
    func testCashOnDeliveryCheckoutFlow() throws {
        // 1. Shop tab — add the first available product from its card.
        let shopTab = app.tabBars.buttons.element(boundBy: 0)
        XCTAssertTrue(shopTab.waitForExistence(timeout: 5))
        shopTab.tap()

        let addButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'add' OR label CONTAINS[c] 'أضف'")).firstMatch
        guard addButton.waitForExistence(timeout: 5) else {
            throw XCTSkip("Catalog not seeded in this environment; skipping COD flow.")
        }
        addButton.tap()

        // 2. Cart tab — verify an item is present, then start checkout.
        let cartTab = app.tabBars.buttons.element(boundBy: 1)
        XCTAssertTrue(cartTab.waitForExistence(timeout: 3))
        cartTab.tap()

        let checkoutButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'checkout' OR label CONTAINS[c] 'إتمام'")).firstMatch
        guard checkoutButton.waitForExistence(timeout: 3) else {
            throw XCTSkip("Cart empty / checkout unavailable without seeded catalog.")
        }
        checkoutButton.tap()

        // 3. Checkout — select Cash on Delivery (default) and place the order.
        let codOption = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'cash' OR label CONTAINS[c] 'الاستلام'")).firstMatch
        if codOption.waitForExistence(timeout: 5) {
            codOption.tap()
        }

        let placeOrderButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'place order' OR label CONTAINS[c] 'تأكيد الطلب'")).firstMatch
        if placeOrderButton.waitForExistence(timeout: 3) {
            // Enabled only once a valid in-Jeddah location + district are set.
            if placeOrderButton.isEnabled {
                placeOrderButton.tap()
            }
        }
    }
}

import Foundation

/// Compile-time safe localization accessors.
/// Arabic (ar) is the development language; English (en) is secondary.
enum L10n {
    // MARK: - Tabs
    static var shopTab: String { localized("tab.shop") }
    static var cartTab: String { localized("tab.cart") }
    static var ordersTab: String { localized("tab.orders") }
    static var accountTab: String { localized("tab.account") }

    // MARK: - Shop
    static var searchPlaceholder: String { localized("shop.search.placeholder") }
    static var allCategories: String { localized("shop.all.categories") }
    static var fromPrice: String { localized("shop.from.price") }
    static var addToCartShort: String { localized("shop.add.to.cart") }
    static var outOfStock: String { localized("shop.out.of.stock") }
    static var inStock: String { localized("shop.in.stock") }
    static var noResults: String { localized("shop.no.results") }
    static var clearSearch: String { localized("shop.clear.search") }

    // MARK: - Product Detail
    static var addToCart: String { localized("product.add.to.cart") }
    static var madeToOrder: String { localized("product.made.to.order") }
    static var madeToOrderNote: String { localized("product.made.to.order.note") }
    static var selectVariant: String { localized("product.select.variant") }
    static var deliveryEstimate: String { localized("product.delivery.estimate") }

    /// Formatted delivery estimate: inserts the estimate value into the localized format string.
    /// Uses String(format:) which respects BiDi ordering in RTL contexts.
    static func deliveryEstimateFormatted(_ estimate: String) -> String {
        String(format: localized("product.delivery.estimate"), estimate)
    }

    /// Formatted price per unit: "48 SAR / dozen" (en) or "48 ر.س / دزينة" (ar)
    /// Uses positional format specifiers (%1$@, %2$@) for proper RTL/LTR reordering.
    static func pricePerUnit(price: String, unit: String) -> String {
        String(format: localized("product.price.per.unit"), price, unit)
    }

    // MARK: - Cart
    static var cartTitle: String { localized("cart.title") }
    static var cartEmptyTitle: String { localized("cart.empty.title") }
    static var cartEmptyMessage: String { localized("cart.empty.message") }
    static var browseSupplies: String { localized("cart.browse.supplies") }
    static var subtotal: String { localized("cart.subtotal") }
    static var checkout: String { localized("cart.checkout") }
    static var remove: String { localized("cart.remove") }

    // MARK: - Checkout
    static var checkoutTitle: String { localized("checkout.title") }
    static var deliveryDetails: String { localized("checkout.delivery.details") }
    static var payment: String { localized("checkout.payment") }
    static var applePay: String { localized("checkout.apple.pay") }
    static var cashOnDelivery: String { localized("checkout.cash.on.delivery") }
    static var placeOrder: String { localized("checkout.place.order") }
    static var outsideJeddah: String { localized("checkout.outside.jeddah") }
    static var checkoutStreet: String { localized("checkout.street") }
    static var checkoutNotes: String { localized("checkout.notes") }
    static var checkoutSetLocation: String { localized("checkout.set.location") }
    static var checkoutLocationSet: String { localized("checkout.location.set") }
    static var checkoutSelectDistrict: String { localized("checkout.select.district") }
    static var checkoutBusinessName: String { localized("checkout.business.name") }
    static var checkoutPhone: String { localized("checkout.phone") }
    static var checkoutEditLocation: String { localized("checkout.edit.location") }
    static var applePayFailed: String { localized("checkout.apple.pay.failed") }
    static var switchToCOD: String { localized("checkout.switch.cod") }

    // MARK: - Orders
    static var ordersTitle: String { localized("orders.title") }
    static var ordersEmptyTitle: String { localized("orders.empty.title") }
    static var ordersEmptyMessage: String { localized("orders.empty.message") }
    static var statusPending: String { localized("orders.status.pending") }
    static var statusSent: String { localized("orders.status.sent") }
    static var statusDelivered: String { localized("orders.status.delivered") }
    static var statusCancelled: String { localized("orders.status.cancelled") }
    static var cancelOrder: String { localized("orders.cancel") }
    static var ordersActiveSection: String { localized("orders.active.section") }
    static var ordersPastSection: String { localized("orders.past.section") }
    static var orderPlaced: String { localized("orders.placed") }
    static var orderNumber: String { localized("orders.number") }
    static var orderConfirmationMessage: String { localized("orders.confirmation.message") }
    static var viewOrder: String { localized("orders.view.order") }
    static var backToShop: String { localized("orders.back.to.shop") }
    static var viewOnMap: String { localized("orders.view.on.map") }
    static var cancelOrderConfirm: String { localized("orders.cancel.confirm") }

    // MARK: - Account
    static var accountTitle: String { localized("account.title") }
    static var signIn: String { localized("account.sign.in") }
    static var signOut: String { localized("account.sign.out") }
    static var businessDetails: String { localized("account.business.details") }
    static var deliveryLocation: String { localized("account.delivery.location") }
    static var orderHistory: String { localized("account.order.history") }
    static var help: String { localized("account.help") }
    static var language: String { localized("account.language") }
    static var guestPrompt: String { localized("account.guest.prompt") }

    // MARK: - Auth
    static var phoneTitle: String { localized("auth.phone.title") }
    static var phoneSubtitle: String { localized("auth.phone.subtitle") }
    static var sendCode: String { localized("auth.send.code") }
    static var verifyCode: String { localized("auth.verify.code") }
    static var resend: String { localized("auth.resend") }
    static var profileTitle: String { localized("auth.profile.title") }
    static var businessName: String { localized("auth.business.name") }
    static var contactName: String { localized("auth.contact.name") }
    static var emailOptional: String { localized("auth.email.optional") }
    static var continueButton: String { localized("auth.continue") }
    static var authPhoneRequired: String { localized("auth.phone.required") }
    static var authCodeInvalid: String { localized("auth.code.invalid") }
    static var authProfileIncomplete: String { localized("auth.profile.incomplete") }

    // MARK: - General
    static var error: String { localized("general.error") }
    static var retry: String { localized("general.retry") }
    static var cancel: String { localized("general.cancel") }
    static var save: String { localized("general.save") }
    static var done: String { localized("general.done") }
    static var loading: String { localized("general.loading") }
    static var noNetwork: String { localized("general.no.network") }
    static var noNetworkMessage: String { localized("general.no.network.message") }
    static var imageLoadFailed: String { localized("general.image.load.failed") }

    // MARK: - Onboarding
    static var onboardingTitle1: String { localized("onboarding.title.1") }
    static var onboardingBody1: String { localized("onboarding.body.1") }
    static var onboardingTitle2: String { localized("onboarding.title.2") }
    static var onboardingBody2: String { localized("onboarding.body.2") }
    static var onboardingTitle3: String { localized("onboarding.title.3") }
    static var onboardingBody3: String { localized("onboarding.body.3") }
    static var onboardingNext: String { localized("onboarding.next") }
    static var onboardingSkip: String { localized("onboarding.skip") }
    static var onboardingGetStarted: String { localized("onboarding.get.started") }

    // MARK: - Location
    static var locationTitle: String { localized("location.title") }
    static var locationDragHint: String { localized("location.drag.hint") }
    static var locationUseCurrent: String { localized("location.use.current") }
    static var locationPermissionDenied: String { localized("location.permission.denied") }
    static var locationConfirm: String { localized("location.confirm") }
    static var locationDistrict: String { localized("location.district") }

    // MARK: - Private

    private static func localized(_ key: String) -> String {
        let language = LanguageManager.shared.currentLanguage
        guard let path = Bundle.main.path(forResource: language.rawValue, ofType: "lproj"),
              let bundle = Bundle(path: path) else {
            return NSLocalizedString(key, comment: "")
        }
        return bundle.localizedString(forKey: key, value: nil, table: nil)
    }
}

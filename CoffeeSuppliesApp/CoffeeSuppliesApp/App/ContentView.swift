import SwiftUI

enum AppTab: Int {
    case shop = 0
    case cart = 1
    case orders = 2
    case account = 3
}

struct ContentView: View {
    @State private var cart = CartStore()
    @State private var selectedTab: AppTab = .shop

    private let authService: AuthServiceProtocol
    private let firestoreService: FirestoreServiceProtocol

    init(
        authService: AuthServiceProtocol = FirebaseAuthService(),
        firestoreService: FirestoreServiceProtocol = FirebaseFirestoreService()
    ) {
        self.authService = authService
        self.firestoreService = firestoreService
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ShopView(firestoreService: firestoreService)
                .tabItem {
                    Label(L10n.shopTab, systemImage: "storefront")
                }
                .tag(AppTab.shop)

            CartView(authService: authService, firestoreService: firestoreService, switchToShop: { selectedTab = .shop }, switchToOrders: { selectedTab = .orders })
                .tabItem {
                    Label(L10n.cartTab, systemImage: "cart")
                }
                .tag(AppTab.cart)
                .badge(cart.itemCount)

            OrdersView(firestoreService: firestoreService, customerId: currentCustomerId)
                .tabItem {
                    Label(L10n.ordersTab, systemImage: "list.clipboard")
                }
                .tag(AppTab.orders)

            AccountView(authService: authService, firestoreService: firestoreService)
                .tabItem {
                    Label(L10n.accountTab, systemImage: "person")
                }
                .tag(AppTab.account)
        }
        .tint(.appAccent)
        .environment(cart)
    }

    private var currentCustomerId: String? {
        if case .signedIn(let id) = authService.currentState { return id }
        return nil
    }
}

#Preview {
    ContentView()
        .environment(LanguageManager.shared)
}

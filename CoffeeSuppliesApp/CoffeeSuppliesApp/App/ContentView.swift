import SwiftUI

struct ContentView: View {
    @State private var cart = CartStore()

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
        TabView {
            ShopView(firestoreService: firestoreService)
                .tabItem {
                    Label(L10n.shopTab, systemImage: "storefront")
                }

            CartView(authService: authService, firestoreService: firestoreService)
                .tabItem {
                    Label(L10n.cartTab, systemImage: "cart")
                }
                .badge(cart.itemCount)

            OrdersView(firestoreService: firestoreService, customerId: currentCustomerId)
                .tabItem {
                    Label(L10n.ordersTab, systemImage: "list.clipboard")
                }

            AccountView(authService: authService, firestoreService: firestoreService)
                .tabItem {
                    Label(L10n.accountTab, systemImage: "person")
                }
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

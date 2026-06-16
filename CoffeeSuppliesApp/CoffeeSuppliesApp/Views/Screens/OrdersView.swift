import SwiftUI

/// Orders tab: active + past orders with status pills. Tap a row → Order Detail.
/// Guest/empty state shows the directional "no orders yet" prompt.
struct OrdersView: View {
    @State private var viewModel: OrdersViewModel

    init(firestoreService: FirestoreServiceProtocol, customerId: String?) {
        _viewModel = State(wrappedValue: OrdersViewModel(firestoreService: firestoreService, customerId: customerId))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.isEmpty {
                    emptyState
                } else {
                    ordersList
                }
            }
            .navigationTitle(L10n.ordersTitle)
            .background(Color.appBackground)
        }
        .task { await viewModel.loadOrders() }
    }

    private var ordersList: some View {
        List {
            if !viewModel.activeOrders.isEmpty {
                Section(L10n.ordersActiveSection) {
                    ForEach(viewModel.activeOrders) { order in
                        NavigationLink {
                            OrderDetailView(order: order, onCancel: {
                                Task { await viewModel.cancelOrder(order) }
                            })
                        } label: {
                            OrderRow(order: order)
                        }
                    }
                }
            }

            if !viewModel.pastOrders.isEmpty {
                Section(L10n.ordersPastSection) {
                    ForEach(viewModel.pastOrders) { order in
                        NavigationLink {
                            OrderDetailView(order: order, onCancel: nil)
                        } label: {
                            OrderRow(order: order)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var emptyState: some View {
        EmptyStateView(
            icon: "list.clipboard",
            title: L10n.ordersEmptyTitle,
            message: L10n.ordersEmptyMessage
        )
    }
}

// MARK: - Order Row

private struct OrderRow: View {
    let order: Order

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xxxs) {
                Text("#\(order.id.prefix(8))")
                    .font(.appMonoSmall)
                    .foregroundStyle(Color.primaryText)
                Text("\(order.itemCount) \(itemsLabel) · \(NumberFormatting.priceWithCurrency(order.total))")
                    .font(.appCaption)
                    .foregroundStyle(Color.secondaryText)
            }
            Spacer()
            StatusPill(status: order.status)
        }
        .padding(.vertical, Spacing.xxxs)
        .accessibilityElement(children: .combine)
    }

    private var itemsLabel: String {
        LanguageManager.shared.resolve(ar: "منتجات", en: "items")
    }
}

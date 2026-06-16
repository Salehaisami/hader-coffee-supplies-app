import SwiftUI

/// Shop / catalog home screen.
/// Category chips, product grid with "from" pricing, search, and empty/no-results states.
struct ShopView: View {
    @State private var viewModel: ShopViewModel
    @Environment(LanguageManager.self) private var languageManager
    @Environment(CartStore.self) private var cart

    private let columns = [
        GridItem(.flexible(), spacing: Spacing.xs),
        GridItem(.flexible(), spacing: Spacing.xs),
    ]

    init(firestoreService: FirestoreServiceProtocol) {
        _viewModel = State(wrappedValue: ShopViewModel(firestoreService: firestoreService))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    loadFailureState(error)
                } else if viewModel.isEmpty {
                    emptyCatalogState
                } else {
                    catalogContent
                }
            }
            .navigationTitle(L10n.shopTab)
            .background(Color.appBackground)
            .searchable(text: Bindable(viewModel).searchText, prompt: L10n.searchPlaceholder)
        }
        .task {
            await viewModel.loadCatalog()
        }
    }

    // MARK: - Catalog Content

    private var catalogContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                // Category chips
                categoryChips

                // Product grid or no-results
                if viewModel.hasNoResults {
                    noResultsState
                } else {
                    productGrid
                }
            }
            .padding(.vertical, Spacing.sm)
        }
    }

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.xxs) {
                CategoryChip(
                    title: L10n.allCategories,
                    isSelected: viewModel.selectedCategoryId == nil,
                    action: { viewModel.selectCategory(nil) }
                )

                ForEach(viewModel.categories) { category in
                    CategoryChip(
                        title: category.localizedName,
                        isSelected: viewModel.selectedCategoryId == category.id,
                        action: { viewModel.selectCategory(category.id) }
                    )
                }
            }
            .padding(.horizontal, Spacing.sm)
        }
    }

    private var productGrid: some View {
        LazyVGrid(columns: columns, spacing: Spacing.xs) {
            ForEach(viewModel.filteredProducts) { product in
                NavigationLink {
                    ProductDetailView(viewModel: ProductDetailViewModel(
                        product: product,
                        onAddToCart: { cart.add($0) }
                    ))
                } label: {
                    ProductCard(
                        name: product.localizedName,
                        imageURL: product.imageUrl,
                        categoryIcon: nil,
                        price: product.displayPrice,
                        pricingUnitLabel: product.localizedPricingUnitLabel,
                        hasVariants: product.hasVariants,
                        inStock: product.isAvailable,
                        onAddToCart: {
                            cart.add(CartItem(product: product, variant: product.defaultVariant))
                        }
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Spacing.sm)
    }

    // MARK: - Empty / Error States

    private var emptyCatalogState: some View {
        EmptyStateView(
            icon: "tray",
            title: L10n.noResults,
            message: nil,
            actionTitle: L10n.retry,
            action: { Task { await viewModel.loadCatalog() } }
        )
    }

    private var noResultsState: some View {
        EmptyStateView(
            icon: "magnifyingglass",
            title: L10n.noResults,
            message: nil,
            actionTitle: L10n.clearSearch,
            action: {
                viewModel.clearSearch()
                viewModel.selectCategory(nil)
            }
        )
        .frame(minHeight: 300)
    }

    private func loadFailureState(_ error: String) -> some View {
        EmptyStateView(
            icon: "wifi.slash",
            title: L10n.noNetwork,
            message: L10n.noNetworkMessage,
            actionTitle: L10n.retry,
            action: { Task { await viewModel.loadCatalog() } }
        )
    }
}

#Preview {
    ShopView(firestoreService: FirebaseFirestoreService())
        .environment(LanguageManager.shared)
        .environment(CartStore())
}

import SwiftUI

/// Shop / catalog home screen.
/// Category chips, product grid with "from" pricing, search, and empty/no-results states.
struct ShopView: View {
    @State private var viewModel: ShopViewModel
    @State private var navigationPath = NavigationPath()
    @Environment(LanguageManager.self) private var languageManager
    @Environment(CartStore.self) private var cart
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    private var columns: [GridItem] {
        let count = horizontalSizeClass == .regular ? 3 : 2
        return Array(repeating: GridItem(.flexible(), spacing: Spacing.xs), count: count)
    }

    init(firestoreService: FirestoreServiceProtocol) {
        _viewModel = State(wrappedValue: ShopViewModel(firestoreService: firestoreService))
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
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
            .navigationDestination(for: String.self) { productId in
                if let product = viewModel.filteredProducts.first(where: { $0.id == productId })
                    ?? viewModel.products.first(where: { $0.id == productId }) {
                    ProductDetailView(viewModel: ProductDetailViewModel(
                        product: product,
                        onAddToCart: { cart.add($0) }
                    ))
                }
            }
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
        .refreshable {
            await viewModel.loadCatalog()
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
                    },
                    onTapCard: {
                        navigationPath.append(product.id)
                    }
                )
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

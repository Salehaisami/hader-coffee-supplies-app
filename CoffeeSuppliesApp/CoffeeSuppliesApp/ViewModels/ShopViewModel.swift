import Foundation
import Observation

/// ViewModel for the Shop/Catalog tab.
/// Manages categories, products, search, and filtering.
@MainActor
@Observable
final class ShopViewModel {
    // MARK: - Published State

    var categories: [Category] = []
    var products: [Product] = []
    var filteredProducts: [Product] = []
    var selectedCategoryId: String?
    var searchText: String = "" {
        didSet {
            guard searchText != oldValue else { return }
            scheduleSearch()
        }
    }
    var isLoading: Bool = false
    var errorMessage: String?

    // MARK: - Dependencies

    @ObservationIgnored private let firestoreService: FirestoreServiceProtocol
    @ObservationIgnored private let searchDebounce: Duration

    /// The in-flight debounced search task. Exposed so tests can await it deterministically.
    @ObservationIgnored private(set) var searchTask: Task<Void, Never>?

    // MARK: - Init

    init(firestoreService: FirestoreServiceProtocol, searchDebounce: Duration = .milliseconds(300)) {
        self.firestoreService = firestoreService
        self.searchDebounce = searchDebounce
    }

    // MARK: - Data Loading

    func loadCatalog() async {
        isLoading = true
        errorMessage = nil

        do {
            async let fetchedCategories: [Category] = firestoreService.getDocuments(collection: "categories")
            async let fetchedProducts: [Product] = firestoreService.getDocuments(collection: "products")

            let (cats, prods) = try await (fetchedCategories, fetchedProducts)
            categories = cats.sorted { $0.sortOrder < $1.sortOrder }
            products = prods
            applyFilters()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Filtering

    func selectCategory(_ categoryId: String?) {
        if selectedCategoryId == categoryId {
            selectedCategoryId = nil
        } else {
            selectedCategoryId = categoryId
        }
        applyFilters()
    }

    func clearSearch() {
        searchTask?.cancel()
        searchText = ""
        applyFilters()
    }

    /// Debounce search input using a cancellable task. A new keystroke cancels the
    /// previous pending task, so filters only apply once typing settles.
    private func scheduleSearch() {
        searchTask?.cancel()
        searchTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(for: self.searchDebounce)
            guard !Task.isCancelled else { return }
            self.applyFilters()
        }
    }

    private func applyFilters() {
        var result = products

        // Filter by category
        if let categoryId = selectedCategoryId {
            result = result.filter { $0.categoryId == categoryId }
        }

        // Filter by search text
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !query.isEmpty {
            result = result.filter { product in
                product.nameAr.lowercased().contains(query) ||
                product.nameEn.lowercased().contains(query) ||
                product.descriptionAr.lowercased().contains(query) ||
                product.descriptionEn.lowercased().contains(query)
            }
        }

        filteredProducts = result
    }

    // MARK: - Computed

    var hasNoResults: Bool {
        !isLoading && filteredProducts.isEmpty && (!searchText.isEmpty || selectedCategoryId != nil)
    }

    var isEmpty: Bool {
        !isLoading && products.isEmpty && errorMessage == nil
    }

    var selectedCategoryName: String? {
        guard let id = selectedCategoryId else { return nil }
        return categories.first { $0.id == id }?.localizedName
    }
}

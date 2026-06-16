import XCTest
@testable import CoffeeSuppliesApp

/// Unit tests for ShopViewModel: catalog loading, category filtering, search, empty/no-results states.
@MainActor
final class ShopViewModelTests: XCTestCase {
    private var mockFirestore: MockFirestoreService!
    private var sut: ShopViewModel!

    override func setUp() {
        super.setUp()
        mockFirestore = MockFirestoreService()
        // Zero debounce keeps search deterministic; tests await `searchTask` directly.
        sut = ShopViewModel(firestoreService: mockFirestore, searchDebounce: .zero)
    }

    override func tearDown() {
        sut = nil
        mockFirestore = nil
        super.tearDown()
    }

    // MARK: - Helpers

    /// Seed the mock with the standard catalog fixtures.
    private func seedCatalog() {
        mockFirestore.seedDocument(TestData.cupsCategory, collection: "categories", documentId: TestData.cupsCategory.id)
        mockFirestore.seedDocument(TestData.suppliesCategory, collection: "categories", documentId: TestData.suppliesCategory.id)
        mockFirestore.seedDocument(TestData.paperCupHot, collection: "products", documentId: TestData.paperCupHot.id)
        mockFirestore.seedDocument(TestData.customPrintedCup, collection: "products", documentId: TestData.customPrintedCup.id)
        mockFirestore.seedDocument(TestData.napkin, collection: "products", documentId: TestData.napkin.id)
    }

    // MARK: - Initial State

    func testInitialState() {
        XCTAssertTrue(sut.categories.isEmpty)
        XCTAssertTrue(sut.products.isEmpty)
        XCTAssertTrue(sut.filteredProducts.isEmpty)
        XCTAssertNil(sut.selectedCategoryId)
        XCTAssertTrue(sut.searchText.isEmpty)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    // MARK: - Loading

    func testLoadCatalog_Success_PopulatesCategoriesAndProducts() async {
        seedCatalog()

        await sut.loadCatalog()

        XCTAssertEqual(sut.categories.count, 2)
        XCTAssertEqual(sut.products.count, 3)
        XCTAssertEqual(sut.filteredProducts.count, 3)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    func testLoadCatalog_SortsCategoriesBySortOrder() async {
        seedCatalog()

        await sut.loadCatalog()

        // cupsCategory has sortOrder 0, suppliesCategory has sortOrder 1
        XCTAssertEqual(sut.categories.first?.id, TestData.cupsCategory.id)
        XCTAssertEqual(sut.categories.last?.id, TestData.suppliesCategory.id)
    }

    func testLoadCatalog_Error_SetsErrorMessage() async {
        mockFirestore.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Load failed"])

        await sut.loadCatalog()

        XCTAssertEqual(sut.errorMessage, "Load failed")
        XCTAssertFalse(sut.isLoading)
    }

    func testLoadCatalog_EmptyCollections_IsEmptyTrue() async {
        // No documents seeded
        await sut.loadCatalog()

        XCTAssertTrue(sut.products.isEmpty)
        XCTAssertTrue(sut.isEmpty)
    }

    // MARK: - Category Filtering

    func testSelectCategory_FiltersProducts() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.selectCategory(TestData.suppliesCategory.id)

        // Only napkin is in the supplies category
        XCTAssertEqual(sut.filteredProducts.count, 1)
        XCTAssertEqual(sut.filteredProducts.first?.id, TestData.napkin.id)
        XCTAssertEqual(sut.selectedCategoryId, TestData.suppliesCategory.id)
    }

    func testSelectCategory_Toggle_DeselectsWhenSameCategory() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.selectCategory(TestData.cupsCategory.id)
        XCTAssertEqual(sut.selectedCategoryId, TestData.cupsCategory.id)

        // Selecting again deselects
        sut.selectCategory(TestData.cupsCategory.id)
        XCTAssertNil(sut.selectedCategoryId)
        XCTAssertEqual(sut.filteredProducts.count, 3)
    }

    func testSelectCategory_CupsCategory_ReturnsTwoProducts() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.selectCategory(TestData.cupsCategory.id)

        // paperCupHot and customPrintedCup are both in cups
        XCTAssertEqual(sut.filteredProducts.count, 2)
    }

    // MARK: - Search

    func testSearch_FiltersByEnglishName() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.searchText = "napkin"
        await sut.searchTask?.value

        XCTAssertEqual(sut.filteredProducts.count, 1)
        XCTAssertEqual(sut.filteredProducts.first?.id, TestData.napkin.id)
    }

    func testSearch_FiltersByArabicName() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.searchText = "مناديل"
        await sut.searchTask?.value

        XCTAssertEqual(sut.filteredProducts.count, 1)
        XCTAssertEqual(sut.filteredProducts.first?.id, TestData.napkin.id)
    }

    func testClearSearch_RestoresAllProducts() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.searchText = "napkin"
        await sut.searchTask?.value
        XCTAssertEqual(sut.filteredProducts.count, 1)

        sut.clearSearch()

        XCTAssertTrue(sut.searchText.isEmpty)
        XCTAssertEqual(sut.filteredProducts.count, 3)
    }

    // MARK: - No Results / Empty States

    func testHasNoResults_TrueWhenSearchYieldsNothing() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.searchText = "nonexistent product xyz"
        await sut.searchTask?.value

        XCTAssertTrue(sut.hasNoResults)
        XCTAssertTrue(sut.filteredProducts.isEmpty)
    }

    func testHasNoResults_FalseWhenNoFilterApplied() async {
        seedCatalog()
        await sut.loadCatalog()

        XCTAssertFalse(sut.hasNoResults)
    }

    func testIsEmpty_FalseWhenProductsExist() async {
        seedCatalog()
        await sut.loadCatalog()

        XCTAssertFalse(sut.isEmpty)
    }

    // MARK: - Combined Filters

    func testCategoryAndSearch_BothApplied() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.selectCategory(TestData.cupsCategory.id)
        sut.searchText = "printed"
        await sut.searchTask?.value

        // Only customPrintedCup matches both cups category and "printed"
        XCTAssertEqual(sut.filteredProducts.count, 1)
        XCTAssertEqual(sut.filteredProducts.first?.id, TestData.customPrintedCup.id)
    }

    // MARK: - Selected Category Name

    func testSelectedCategoryName_ReturnsLocalizedName() async {
        seedCatalog()
        await sut.loadCatalog()

        sut.selectCategory(TestData.cupsCategory.id)

        XCTAssertNotNil(sut.selectedCategoryName)
    }
}

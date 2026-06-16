import Testing
@testable import CoffeeSuppliesApp

@Suite("Number Formatting Tests")
struct NumberFormattingTests {

    @Test("Price formatting uses Western digits")
    func priceWesternDigits() {
        let result = NumberFormatting.price(48.5)
        #expect(result == "48.5")
        // Ensure no Arabic-Indic digits
        #expect(!result.contains("٤"))
        #expect(!result.contains("٨"))
    }

    @Test("Price formatting drops trailing zeros")
    func priceNoTrailingZeros() {
        #expect(NumberFormatting.price(48) == "48")
        #expect(NumberFormatting.price(48.0) == "48")
    }

    @Test("Price formatting handles decimal values")
    func priceDecimals() {
        #expect(NumberFormatting.price(48.75) == "48.75")
        #expect(NumberFormatting.price(0.5) == "0.5")
    }

    @Test("Quantity formatting uses Western digits")
    func quantityWesternDigits() {
        #expect(NumberFormatting.quantity(5) == "5")
        #expect(NumberFormatting.quantity(100) == "100")
    }

    @Test("Price with currency includes SAR")
    func priceWithCurrency() {
        let result = NumberFormatting.priceWithCurrency(48)
        #expect(result == "48 SAR")
    }
}

import SwiftUI

/// Quantity stepper: decrement/increment buttons with quantity in monoPrice style.
/// Minimum value is 1.
struct QuantityStepper: View {
    @Binding var quantity: Int
    let minimum: Int

    init(quantity: Binding<Int>, minimum: Int = 1) {
        self._quantity = quantity
        self.minimum = minimum
    }

    var body: some View {
        HStack(spacing: Spacing.xs) {
            // Decrement
            Button {
                if quantity > minimum {
                    quantity -= 1
                }
            } label: {
                Image(systemName: "minus")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(quantity > minimum ? Color.primaryText : Color.placeholder)
                    .frame(width: 32, height: 32)
                    .background(Color.stone100)
                    .clipShape(Circle())
            }
            .disabled(quantity <= minimum)
            .accessibilityLabel(LanguageManager.shared.resolve(ar: "إنقاص الكمية", en: "Decrease quantity"))

            // Quantity display
            Text(NumberFormatting.quantity(quantity))
                .font(.appMonoPrice)
                .foregroundStyle(Color.primaryText)
                .frame(minWidth: 28)
                .accessibilityLabel(LanguageManager.shared.resolve(ar: "الكمية: \(quantity)", en: "Quantity: \(quantity)"))

            // Increment
            Button {
                quantity += 1
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.primaryText)
                    .frame(width: 32, height: 32)
                    .background(Color.stone100)
                    .clipShape(Circle())
            }
            .accessibilityLabel(LanguageManager.shared.resolve(ar: "زيادة الكمية", en: "Increase quantity"))
        }
    }
}

#Preview {
    struct StepperPreview: View {
        @State private var qty = 1
        var body: some View {
            QuantityStepper(quantity: $qty)
                .padding()
                .background(Color.appBackground)
        }
    }
    return StepperPreview()
}

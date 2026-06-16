import SwiftUI

/// Category filter chip — pill shape with selected/unselected states.
/// Selected: Ink fill with Stone text. Unselected: Stone 100 + Ink Soft text.
struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.appSubheadline)
                .foregroundStyle(isSelected ? Color.stone50 : Color.inkSoft)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xxs)
                .background(isSelected ? Color.ink : Color.stone100)
                .clipShape(Capsule())
        }
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

#Preview {
    HStack {
        CategoryChip(title: "الكل", isSelected: true, action: {})
        CategoryChip(title: "أكواب", isSelected: false, action: {})
        CategoryChip(title: "أغطية", isSelected: false, action: {})
    }
    .padding()
    .background(Color.appBackground)
}

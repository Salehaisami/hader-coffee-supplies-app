# Coffee Supplies App — iOS

A SwiftUI iOS app for independent specialty cafes in Jeddah to order bulk supplies. Arabic-native, RTL by default.

## Requirements

- Xcode 15.4+
- iOS 17.0+ deployment target
- Swift 5.9+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for project generation)

## Setup

1. **Install XcodeGen** (if not already installed):
   ```bash
   brew install xcodegen
   ```

2. **Generate the Xcode project:**
   ```bash
   cd CoffeeSuppliesApp
   xcodegen generate
   ```

3. **Configure Firebase:**
   - Download your `GoogleService-Info.plist` from the Firebase Console
   - For development: replace contents of `Resources/GoogleService-Info-Dev.plist`
   - For production: replace contents of `Resources/GoogleService-Info-Prod.plist`
   - The active plist is selected by build configuration (Debug → Dev, Release → Prod)

4. **Install fonts:**
   - Download [Fraunces](https://fonts.google.com/specimen/Fraunces), [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic), and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
   - Place `.ttf` files in `CoffeeSuppliesApp/Resources/Fonts/`

5. **Open and build:**
   ```bash
   open CoffeeSuppliesApp.xcodeproj
   ```

## Project Structure

```
CoffeeSuppliesApp/
├── App/              # App entry point, ContentView, Info.plist
├── Models/           # Data models (User, Product, Order, etc.)
├── Views/
│   ├── Components/   # Reusable UI components
│   └── Screens/      # Full-screen views
├── ViewModels/       # View models (MVVM)
├── Services/         # Firebase service implementations
├── Protocols/        # Service protocols for testability
├── Resources/
│   ├── Fonts/        # Custom typefaces
│   └── Localization/ # Strings files (ar + en)
├── Utilities/        # L10n, LanguageManager, NumberFormatting
└── Extensions/       # Color, Font, Spacing tokens
```

## Design System

- **Colors:** Stone/Ink/Clay palette (warm neutrals + single clay accent)
- **Typography:** Fraunces (headings), IBM Plex Sans Arabic (body), IBM Plex Mono (prices)
- **Signature element:** Ledger-line pricing (monospace above hairline rule)
- **Language:** Arabic (RTL) default, English (LTR) secondary
- **Digits:** Western (0–9) in all locales

## Testing

```bash
# Run unit tests
xcodebuild test -scheme CoffeeSuppliesApp -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild test -scheme CoffeeSuppliesAppUITests -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Architecture

- **Pattern:** MVVM with SwiftUI
- **DI:** Protocol-based dependency injection (all Firebase services behind protocols)
- **State:** Observable objects + @StateObject / @EnvironmentObject
- **Persistence:** Firestore with offline cache enabled
- **Auth:** Phone OTP via Firebase Auth
- **Notifications:** Firebase Cloud Messaging (FCM)

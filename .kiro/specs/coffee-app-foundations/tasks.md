# Tasks — Coffee App Foundations (M0)

## Task Dependency Graph

```
T0.1 (Project & Firebase setup)
├── T0.2 (Design tokens & typography)
├── T0.3 (Localization & RTL scaffolding)
├── T0.5 (Test infrastructure & CI)
│
T0.2 + T0.3 + T0.5
└── T0.4 (Reusable UI components)
```

## Tasks

### Task 1: Project & Firebase Setup
- [x] Create Xcode project (SwiftUI, iOS 17+, MVVM folder structure: Models, Views, ViewModels, Services)
- [x] Add Firebase SDK via SPM (Firestore, Auth, Storage, Cloud Functions, Cloud Messaging)
- [x] Configure two GoogleService-Info.plist files (dev/prod), selected by build configuration
- [x] Initialize Firebase on app launch with offline persistence enabled
- [x] Wrap each Firebase service behind a Swift protocol (FirestoreService, AuthService, StorageService, MessagingService)
- [x] Configure APNs entitlements for push notification readiness
- [x] Verify: app launches, connects to Firebase dev, and a trivial Firestore read/write round-trips

### Task 2: Design Tokens & Typography
- [x] Encode color tokens as SwiftUI Color extensions: Stone 50/100/200/400, Ink, Ink Soft, Clay, Clay Deep, Sage
- [x] Add semantic aliases (e.g. Color.appBackground = Stone 50, Color.primaryText = Ink, Color.accent = Clay)
- [x] Bundle Fraunces, IBM Plex Sans Arabic, IBM Plex Mono fonts (SIL OFL); register in Info.plist
- [x] Define text style scale: largeTitle, title, headline, subheadline, body, caption, monoPrice
- [x] Define spacing scale (base-4: 4, 8, 12, 16, 20, 24, 32, 40, 48) and shape constants (cardRadius: 14, hairline: 0.5)
- [x] Verify: a sample screen renders all tokens and three font families correctly

### Task 3: Localization & RTL Scaffolding
- [x] Set up Localizable.strings with Arabic (ar) as development language, English (en) as secondary
- [x] Create compile-time-safe string accessors (enum/struct with static properties)
- [x] Implement language toggle hook (stored in UserDefaults, observable, switches without restart)
- [x] Enforce RTL layout when Arabic is active, LTR when English is active
- [x] Create number formatter pinned to Western digits (0–9) for both locales
- [x] Create helper for bilingual catalog field resolution (name_ar/name_en based on active language)
- [x] Verify: app launches Arabic/RTL by default; toggling to English flips to LTR; numbers always 0–9

### Task 4: Reusable UI Components
- [x] ProductCard: image (with category placeholder fallback), name, unit, ledger-line price (IBM Plex Mono above 0.5pt hairline), "from" prefix for variant pricing, Clay "Add to cart" button
- [x] CategoryChip: pill shape, selected (Clay) / unselected (Stone 100 + Ink Soft) states
- [x] PrimaryButton (Clay fill, white text, 14pt radius) and SecondaryButton (Stone 100, Ink text)
- [x] Both buttons: disabled state (0.4 opacity), loading state (activity indicator)
- [x] QuantityStepper: decrement/increment buttons, quantity in monoPrice style, min=1 enforcement
- [x] InStockTag: Sage background, white text pill
- [x] StatusPill: accepts status enum, renders colored pill (pending=Stone400, sent=Clay, delivered=Sage, cancelled=Stone200+InkSoft)
- [x] EmptyState: centered icon (SF Symbol), message, single action button
- [x] All components render correctly in RTL and LTR
- [x] Snapshot tests for each component in RTL + LTR + large Dynamic Type

### Task 5: Test Infrastructure & CI
- [x] Create unit test target using Swift Testing framework (@Test, #expect)
- [x] Create UI test target using XCUITest
- [x] Add snapshot testing dependency (swift-snapshot-testing) and configure reference image storage
- [x] Create shared test-support target with protocol fakes: MockFirestoreService, MockAuthService, MockLocationService, MockPaymentService
- [x] Ensure all fakes conform to production protocols
- [x] Write sample tests: one view-model unit test, one snapshot test (RTL variant), one XCUITest
- [x] Set up CI workflow (GitHub Actions or Xcode Cloud): build + run all tests on push/PR, fail on red
- [x] Verify: all sample tests pass green in CI

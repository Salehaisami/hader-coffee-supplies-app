# Coffee App Foundations (M0) — Requirements Reference

## Source Documents

This spec's requirements are defined in the existing planning documents located in `~/Documents/Coffee-Supplies-App-Phase1/`:

- **Phase1-Requirements.md** — Features, flows, localization, empty states
- **Phase1-Architecture.md** — Firebase data models, security rules, Cloud Functions
- **Phase1-Design-Language.md** — Color tokens, typography, components, signature element
- **Phase1-Build-Plan.md** — Task breakdown with acceptance criteria (M0: T0.1–T0.5)
- **Phase1-Resolved-Decisions.md** — Geofence, districts, Apple Pay, and all gap closures

## Scope (Milestone 0)

This milestone establishes the technical foundation. No user-facing features ship — it produces the substrate for all subsequent milestones:

1. Xcode project + Firebase SDK integration (dev/prod environments)
2. Design tokens (colors, typography, spacing, shape) encoded as SwiftUI constants
3. Localization/RTL scaffolding (Arabic default, English secondary, Western numerals)
4. Reusable UI components (product card, category chip, buttons, stepper, status pill, empty state)
5. Test infrastructure (Swift Testing, XCUITest, snapshot tests, shared fakes/mocks, CI)

## Key Decisions

- iOS 17+, Swift/SwiftUI, MVVM
- Firebase: Firestore (offline persistence enabled), Auth (phone OTP), Storage, Cloud Functions, FCM
- Arabic-native RTL by default; English LTR secondary
- Western numerals (0–9) everywhere
- Fonts: Fraunces (headings), IBM Plex Sans Arabic (body), IBM Plex Mono (prices)
- All dependencies behind protocols for testability

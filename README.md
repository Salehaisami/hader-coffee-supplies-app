# Coffee Shop Supplies Ordering App — Phase One Documentation

*B2B supplies ordering app for independent specialty cafes in Jeddah. Arabic-native, iOS, manual fulfillment. This folder is the complete Phase One planning set.*

## Start here
1. **Phase1-Project-Brief.md** — read first. The one-page overview that ties everything together.

## Then, by purpose
| Document | Purpose |
|---|---|
| Phase1-Requirements.md | Features, customer + admin flows, localization, empty states, scope |
| Phase1-Architecture.md | Firestore data models, security rules, Cloud Functions, location & payments |
| Phase1-Seed-Catalog.md | Coffee-shop catalog content + variant structure |
| Phase1-Wireframes.md | All 10 app screens — structure and flow |
| Phase1-Design-Language.md | Visual identity spec (colors, type, components, signature) |
| Phase1-Design-Language.html | Live, viewable design reference — open in a browser |
| Phase1-Build-Plan.md | Test-first, per-agent task breakdown for Kiro |
| Phase1-Risks-and-Watchouts.md | Open decisions, business/technical/legal risks, watch-outs |

## Build order (from the build plan)
M0 Foundations → M1 Data → M2 Auth → M3 Catalog & Cart → M4 Location/Checkout/Orders → M5 Cloud Functions, with M6 Admin in parallel after M1, and M7 Hardening last.

## Before building — needs a human decision
Jeddah geofence boundary + district list; final supplier list/contacts; whether customer confirmation messages are in scope; Apple Pay limit check; product imagery. See Phase1-Risks-and-Watchouts.md §A.

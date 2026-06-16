# Design Language — Coffee Supplies App (Phase One)

*Approved direction: calm, editorial, premium-minimal for independent specialty cafes in Jeddah. Arabic-native / RTL by default. See the live reference: Phase1-Design-Language.html.*

---

## Direction in one line
Warm stone neutrals + espresso ink + a single restrained clay accent, with a refined editorial serif — deliberately cooler and quieter than the "cream + terracotta" template, so it feels art-directed rather than generic.

## Color Tokens
| Token | Hex | Use |
|---|---|---|
| Stone 50 | `#F6F4F1` | App background (warm grey, **not** cream) |
| Stone 100 | `#ECE8E3` | Cards / surfaces |
| Stone 200 | `#DAD3CB` | Hairlines, dividers, borders |
| Stone 400 | `#A89E92` | Muted captions / placeholders |
| Ink | `#2B2724` | Primary text (espresso near-black) |
| Ink Soft | `#5C554E` | Secondary text |
| Clay | `#9C5B3B` | **The accent** — buttons, links, active states (used sparingly) |
| Clay Deep | `#7E4730` | Pressed / active accent |
| Sage | `#6E7257` | Positive signals only (in stock, success) — kept rare so it stays special |

**Discipline:** one accent (clay), used sparingly. Sage appears only on positive states. Everything else is stone + ink.

## Typography
| Role | Typeface | Notes |
|---|---|---|
| Display / headings | **Fraunces** | Editorial serif; used with restraint, for titles only |
| Body (Arabic + Latin) | **IBM Plex Sans Arabic** | Clean, readable, full Arabic support |
| Prices / codes / data | **IBM Plex Mono** | Gives figures a "ledger" character |

**Decided & resolved:** these three are the official typefaces. All are open-source under the **SIL Open Font License**, which permits app embedding at no cost — so there is no licensing cost or risk. (System SF Arabic was considered but is too utilitarian to carry the editorial character; the chosen serif pairing is what gives the brand its premium feel.)

## Shape & Spacing
- Card corner radius ~14px; pills fully rounded; inputs softly rounded.
- Hairline borders (Stone 200), not heavy shadows. Shadows are very soft and used minimally.
- Generous whitespace — the premium feel comes from restraint and precise spacing, not decoration.

## Signature Element — the "ledger line"
- Prices render in **monospace, above a thin hairline rule**, like an accountant's ledger.
- It evokes ordering/invoicing honestly (no coffee-bean clip art), and makes the **price-per-unit unmistakable** — directly serving the "obvious pricing units" priority.
- This is the one memorable detail; keep everything around it quiet.

## RTL / Arabic Notes
- Arabic default, full RTL mirroring (nav, steppers, status tracker, back button, card internals).
- Latin terms (e.g. "12oz") sit naturally within RTL lines.
- Digit style: **Western/English numerals (0–9)** throughout, including in the Arabic interface — pairs with the monospace ledger prices and the modern feel.

## Component Patterns (from the reference)
- **Product card:** image, name, short variant note ("hot · 4 sizes"), then the ledger price line ("from 48 / dozen"), then a clay "Add to cart" button. For variant items, show "from <lowest price>".
- **Category chips:** rounded; selected chip uses Ink fill with Stone text.
- **In-stock tag:** small mono label in Sage on a white pill.
- **Buttons:** primary = clay fill, white text; pressed = clay deep.

## How to use this
Every screen in Phase1-Wireframes.md should be built from these tokens. Boldness lives only in the signature (ledger line) and the serif headings; everything else stays disciplined and quiet.

## Scope note — hospitality-broad by design
This visual identity is intentionally **not** coffee-specific. The stone/ink/clay palette, editorial serif, whitespace, and ledger-line treatment read as "premium hospitality procurement," not "coffee shop." If the product later expands to **hotels and restaurants**, the design language, components, and structure carry over **without a redesign** — only the *content* changes: the catalog grows (housekeeping, larger food packaging, table service) and a few cafe-worded strings broaden (e.g. "supplies for your coffee shop" → "hospitality supplies"). The open decision for expansion is **positioning and catalog scope**, a business call, not an aesthetic one. Starting narrow with specialty cafes remains the recommended launch strategy.

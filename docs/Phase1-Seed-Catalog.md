# Seed Catalog — Coffee Shop Supplies, Jeddah (Draft for Review)

*First-pass catalog to seed the app, focused on cafes / coffee shops in Jeddah. Prices are placeholders (SAR) — you'll set real numbers. Pricing units are suggestions; adjust to how your suppliers actually sell.*

**Variant approach (decided):** Items that come in sizes/options use **one product with a variant selector** (the familiar Amazon/Shopify pattern — simpler for the customer, keeps the catalog clean). This applies to the items marked ⚑ below — primarily **cups, lids, and straws**. All other items are plain single products with no selector. Every item shares one base schema; variants are an optional layer (see architecture doc §2.3).

Below, ⚑ marks items modeled as a single product with size/option variants.

---

## Category: Cups ⚑ (single products with size variants)
| Item | Variants | Suggested unit | Notes |
|---|---|---|---|
| Paper Cup (hot) | 4oz, 8oz, 12oz, 16oz | per sleeve / per 1000 | espresso → large |
| Double-Wall Cup (hot) | 8oz, 12oz | per sleeve | premium hot |
| Cold / Plastic Cup | 12oz, 16oz, 20oz | per sleeve / per 1000 | cold drinks |

## Category: Lids ⚑ (single products with variants)
| Item | Variants | Suggested unit | Notes |
|---|---|---|---|
| Hot Cup Lid | 8oz, 12/16oz | per sleeve / per 1000 | match cup diameter |
| Cold Cup Lid | Dome, Flat (straw slot) | per sleeve / per 1000 | dome for blended/whipped |
| Sip Lid (no straw) | 8oz, 12/16oz | per sleeve / per 1000 | |

## Category: Straws & Stirrers ⚑
| Item | Variants | Suggested unit | Notes |
|---|---|---|---|
| Paper Straw | Standard, Jumbo | per box / per 1000 | jumbo for smoothies |
| Plastic Straw (where allowed) | Standard, Jumbo | per box / per 1000 | |
| Wooden Coffee Stirrer | — | per box / per 1000 | |
| Spoon Straw | — | per box | |

## Category: Cup Holders & Carriers
| Item | Suggested unit | Notes |
|---|---|---|
| Cup Sleeve / Jacket | per box / per 1000 | heat protection |
| 2-Cup Carrier Tray | per pack | |
| 4-Cup Carrier Tray | per pack | |
| Drink Carrier Bag | per pack | |

## Category: Napkins & Tissues
| Item | Suggested unit | Notes |
|---|---|---|
| Beverage Napkin (small) | per pack / per case | |
| Dinner Napkin (large) | per pack / per case | |
| Dispenser Napkin | per pack / per case | |
| Wet Wipes (sachet) | per box | |

## Category: Food Packaging (light food / pastries)
| Item | Suggested unit | Notes |
|---|---|---|
| Kraft Food Box (small) | per pack | pastries/sandwiches |
| Sandwich Wrap Paper | per ream / per kg | |
| Pastry / Cake Box | per pack | |
| Deli Paper Sheets | per ream | under pastries / lining |

## Category: Coffee Bar Consumables
| Item | Suggested unit | Notes |
|---|---|---|
| Sugar Sticks / Sachets | per box | white/brown |
| Sweetener Sachets | per box | |
| Honey Sachets | per box | |
| Syrup Pump Bottles | per bottle | flavored syrups (if you stock) |
| Milk Alternative (UHT cartons) | per case | oat/almond — confirm if in scope |
| Coffee Filter Papers | per pack | by brewer type ⚑ |
| Cleaning Tablets (espresso machine) | per pack | machine maintenance |
| Group Head Brush | per piece | |

## Category: Cutlery
| Item | Suggested unit | Notes |
|---|---|---|
| Wooden Fork | per box / per 1000 | |
| Wooden Knife | per box / per 1000 | |
| Wooden Spoon | per box / per 1000 | |
| Cutlery Set (fork+knife+napkin) | per box | convenience |

## Category: Bags
| Item | Suggested unit | Notes |
|---|---|---|
| Paper Carry Bag (small) | per pack / per 100 | |
| Paper Carry Bag (large) | per pack / per 100 | |
| Kraft Handle Bag | per pack / per 100 | |

## Category: Printing & Branding
| Item | Suggested unit | Notes |
|---|---|---|
| Custom Printed Cups | per 1000 (MOQ likely) | lead time + setup; flag as made-to-order |
| Custom Printed Napkins | per case | |
| Custom Printed Bags | per 1000 | |
| Custom Stickers / Labels | per roll / per 1000 | |
| Loyalty / Stamp Cards | per pack | |
| Receipt Roll Paper | per box | thermal, for POS |

## Category: Cleaning & Misc (optional — confirm if in scope)
| Item | Suggested unit | Notes |
|---|---|---|
| Trash Bags (roll) | per roll / per pack | |
| Disposable Gloves | per box | |
| Surface Cleaner | per bottle / per case | |
| Hand Soap Refill | per bottle | |

---

## Notes & Decisions to Confirm
1. **Variants:** decided — single product with a size/option selector for cups, lids, and straws (⚑). All other items are simple single products. One shared base schema (see architecture §2.3).
2. **Pricing units:** standardize the unit vocabulary you'll actually use (sleeve, box, case, per-1000, pack, ream, roll). The app's `pricingUnit` list should match this. Note variants can carry their own unit/price.
3. **Printing items are made-to-order** — likely have minimum order quantities (MOQ) and longer lead times. The `madeToOrder` flag gives them a longer delivery estimate and a note; no special build needed.
4. **Consumables & light food packaging are in scope** (confirmed) — syrups, milk alternatives, sachets, pastry/sandwich packaging all included.
5. **Scope is coffee shops in Jeddah** — categories lean toward drinks service and light food.
6. **Images:** each item (and ideally each variant) needs a clean product image for the polished card design — sourcing these is a launch task.
7. This list is meant to be trimmed and corrected by you — it's deliberately broad so you can cut rather than try to remember everything.

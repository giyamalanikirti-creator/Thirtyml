# ThirtyML design system

Mood: the city at 1 a.m. seen from a moving car. Deep ink-blue and aubergine
night tones (never flat black), a warm sodium-streetlamp amber for live prices
and primary actions, a cool dusk blue for maps and information. The live price
board is the signature element — spend the boldness there, keep everything
else calm.

## Colours

| Token | Hex | Role |
|---|---|---|
| `night` | `#0D1120` | Page background. Deep ink-blue, not black. |
| `night-raised` | `#161B2E` | Cards, header, raised surfaces. |
| `aubergine` | `#241A33` | Alternate surface tint (hero bands, partner chrome, hover washes). |
| `sodium` | `#F7A521` | Primary accent: live prices, primary buttons, active states. Warm streetlamp amber. |
| `dusk` | `#6FA8C9` | Cool secondary: map pins’ chrome, informational badges, links in body copy. |
| `moon` | `#F2EFE6` | Primary text. Warm off-white. |
| `moon-dim` | `#9CA1B5` | Secondary text, placeholders, captions. |
| `line` | `#2A3048` | Borders and dividers on night surfaces. |
| `rise` | `#FF7A6B` | Price went up (direction only, always paired with ▲/text). |
| `drop` | `#5BD592` | Price went down / success (always paired with ▼/text). |
| `danger` | `#F0564A` | Errors, destructive actions. |

Light surfaces (checkout, invoices, partner tables) use `moon` as background
with `night` text — checkout is deliberately calmer and lighter than discovery.

Never rely on colour alone: price direction always carries a glyph, table
states carry a label/pattern.

## Type

- **Display: Bricolage Grotesque** — club names, headlines, big prices on the
  price board. Weights 500–800. Expressive, condensed-ish, confident.
- **Text: Inter** — everything else. Weights 400–600.
- **All prices use tabular numerals** (`font-variant-numeric: tabular-nums`)
  in Indian formatting: ₹2,500 · ₹1,20,000. Formatting lives in one helper
  (`formatPaise`), never inline.

Type scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4.
Body 1rem/1.55. Headlines tighten to 1.05–1.15 line-height, letter-spacing
-0.01em to -0.03em as size grows.

## Spacing & radius

- Spacing: 4px base scale (Tailwind default). Section rhythm on marketing
  pages: 64–96px between bands; inside cards 16–24px.
- Radius: `sm` 6px (inputs, chips) · `md` 10px (cards, buttons) · `lg` 16px
  (modals, hero panels) · `full` for pills (price pills on the map).
- Shadows: avoid the identical-soft-shadow-on-every-card look. Cards on
  `night` separate by surface colour + 1px `line` border; shadow is reserved
  for overlays (drawers, popovers).

## Motion

- The split-flap price flip is the one loud animation (~350ms, staggered per
  digit). Everything else: 120–180ms opacity/transform, no fade-up on every
  section. `prefers-reduced-motion`: prices swap instantly with a brief
  background pulse instead.

## Copy

Plain, specific, sentence case. Buttons say exactly what happens: “Add to
cart”, “Pay ₹4,720”, “Save prices”, “Admit 2 guests”. Confirmations reuse the
verb: “Prices saved”. No arrows appended to labels, no all-caps eyebrows.

## Layout sketches (ASCII)

### Home `/`
```
┌────────────────────────────────────────────────────────────┐
│ THIRTYML   [Mumbai ▾]   ( search clubs, events… )  ♡ 🛒 👤 │
├────────────────────────────────────────────────────────────┤
│  TONIGHT IN MUMBAI                       Sat 20 Sep        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  LIVE PRICE BOARD          updated live ●        │      │
│  │  Kitty Su        Stag  ₹2,500 ▲   Couple ₹3,500  │      │
│  │  AntiSocial      Stag  ₹1,500 ▼   Ladies  free   │      │
│  │  Matahari        Stag  ₹2,000 —   Couple ₹3,000  │      │
│  └──────────────────────────────────────────────────┘      │
│  Tonight ▸        [club card][club card][club card] →      │
│  This weekend ▸   [event card][event card][event] →        │
│  Collections ▸    [Rooftops in Pune][Under ₹1,000] →       │
│  ── offers strip ──────────────────────────────────        │
│  How it works · Run a club? Partner with us  [Apply]       │
└────────────────────────────────────────────────────────────┘
```

### Club page `/[city]/clubs/[slug]`
```
┌ gallery ───────────────────────────────┐┌ sticky panel ───┐
│ [photo][photo][photo]                  ││ TONIGHT’S PRICES│
│ KITTY SU            ★4.2 · Andheri E   ││ Stag    ₹2,500 ▲│
│ Open tonight 9pm–1:30am · 21+ · Smart  ││  upd 2m  [− 1 +]│
│ [♡ Save][Share][Directions][Website]   ││ Couple  ₹3,500 —│
├────────────────────────────────────────┤│  [− 0 +]        │
│ ‹ Fri 19 · SAT 20 · Sun 21 · Mon … ›   ││ Early bird ends │
│ About · amenities · house rules        ││  10pm   ₹1,750  │
│ [Book a table → floor plan]            ││─────────────────│
│ Upcoming events here: [card][card]     ││ [Add to cart]   │
│ Map + address                          │└─────────────────┘
│ Reviews ★★★★☆ (music/crowd/value bars) │  mobile: sticky
└────────────────────────────────────────┘  bottom bar
```

### Cart `/cart`
```
┌ Your cart ─────────────────────────────────────────┐
│ KITTY SU · Sat 20 Sep                              │
│  Stag entry ×2            ₹2,500 each     ₹5,000   │
│  ⚠ price changed ₹2,200 → ₹2,500  [Okay, got it]   │
│  Table T4 (4 guests, min spend ₹15,000)  deposit…  │
│ AREA 51 · Sat 20 Sep                               │
│  Couple entry ×1                          ₹2,800   │
│────────────────────────────────────────────────────│
│ Estimated total                           ₹9,300   │
│                       [Proceed to checkout]        │
└────────────────────────────────────────────────────┘
```

### Checkout `/checkout` (light surface, calm)
```
┌ Checkout            ⏱ 09:42 price lock ────────────┐
│ 1 Review   2 Guests   3 Offers   4 Pay             │
│ ┌ items (read-only, locked prices) ┐ ┌ summary ──┐ │
│ │ Kitty Su · Sat · Stag ×2  ₹5,000 │ │ Subtotal  │ │
│ │ …                                │ │ Discount  │ │
│ └──────────────────────────────────┘ │ Conv. fee │ │
│ Lead guest: [name][phone][email]     │ GST       │ │
│ Coupon: [FIRSTNIGHT] [Apply]         │ ───────── │ │
│ Wallet credit ₹120  [use ◉]          │ Total     │ │
│ ☐ I agree to the terms & refund pol. │ [Pay ₹…]  │ │
└────────────────────────────────────────────────────┘
```

### Table picker `/[city]/clubs/[slug]/tables`
```
┌ Sat 20 Sep · floor plan ───────────────────────────┐
│   ┌────────── stage ──────────┐                    │
│   [T1 ▨held] [T2 ◻avail] [T3 ◼booked]              │
│      dance floor                                   │
│   [B1 VIP ◻] [B2 VIP ◻]      bar ────────          │
│ legend: ◻ available ▨ held ◼ booked (label+pattern)│
│ T2 · seats 4 · min spend ₹15,000 · [Select T2]     │
└────────────────────────────────────────────────────┘
```

### Partner pricing `/partner/pricing`
```
┌ Pricing — Kitty Su          [Customer view] [Save prices] ┐
│ Product      Base     Tonight   Cap   Active   Updated    │
│ Stag         ₹2,000   [₹2,500]  150   [on]     2m ago     │
│ Couple       ₹3,000   [₹3,500]  80    [on]     1h ago     │
│ Ladies       ₹0       [₹0]      100   [on]     —          │
│ [+₹500 all] [Reset to base]                               │
│ Calendar ▸ date overrides · Rules ▸ “Sat 11pm → ₹2,500”   │
│ History ▸ who changed what, when                          │
└───────────────────────────────────────────────────────────┘
```

## Component notes

- `PriceTag`: tabular display numerals, direction glyph + colour, “Updated Xm
  ago” caption; flips via `SplitFlap` on change.
- Map pins: small `sodium` pills with the lowest live price, dark tiles.
- Check-in screen: `night` background, `moon` 24px+ text, 64px touch targets,
  full-screen state colours with words (“ADMITTED”, “ALREADY USED”).
- Skeletons: surface-coloured shimmer blocks, no spinners on page loads.
- Focus: 2px `sodium` outline offset 2px, visible on all interactive elements.
- Quality floor: WCAG AA contrast, works from 360px, reduced motion respected,
  meaningful empty/error states everywhere.

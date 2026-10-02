# ThirtyML design system

Mood: a club at 1 a.m. — purple light bleeding across black velvet. Deep
night surfaces with a purple undertone, violet as the primary accent, grey
for the structural rhythm. The live price board is still the signature
element: spend the boldness there, keep the rest calm.

## Colours

| Token | Hex | Role |
|---|---|---|
| `night` | `#0a0812` | Page background. True deep night with a hint of plum. |
| `night-raised` | `#14101e` | Cards, header, raised surfaces. |
| `aubergine` | `#1d1630` | Alternate surface tint (hero bands, partner chrome). |
| `plum-wash` | `#2a1f3f` | Soft purple wash used in gradients and hero bands. |
| `plum` | `#8b5cf6` | Primary accent: live prices, primary buttons, active states. |
| `plum-deep` | `#6d28d9` | Hover / pressed state for `plum`. |
| `plum-bright` | `#a78bfa` | Hover text, links in headings, highlight accents. |
| `dusk` | `#c4b5fd` | Muted lilac for inline links and info chips. |
| `moon` | `#f3f0fa` | Primary text, with a slight purple cast. |
| `moon-dim` | `#9b96ae` | Secondary text, placeholders, captions. |
| `moon-faint` | `#635e78` | Hints, keyboard shortcut chips. |
| `line` | `#2a2338` | Borders and dividers. |
| `line-strong` | `#3b3250` | Hovered borders, stronger separators. |
| `rise` | `#ff5c93` | Price went up (direction only, always paired with ▲/text). |
| `drop` | `#6ee7b7` | Price went down / success (always paired with ▼/text). |
| `danger` | `#f43f5e` | Errors, destructive actions. |
| `warn` | `#fbbf24` | Warning banners (expiry, caps). |

Page background uses two subtle plum radial washes over `night` so the dark
surfaces breathe. Light surfaces (checkout, invoice) still use `moon` with
`night` text — checkout is deliberately calmer and lighter than discovery.

Never rely on colour alone: price direction always carries a glyph, table
states carry a label/pattern/line.

## Type

- **Display:** Bricolage Grotesque — club names, headlines, big prices.
- **Text:** Inter — everything else.
- **All prices use tabular numerals** (`.tnum`) in Indian formatting:
  ₹2,500 · ₹1,20,000. Formatting lives in `formatPaise`, never inline.

Type scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4.

## Spacing & radius

- 4px base scale (Tailwind default). Marketing bands 56–96px apart; inside
  cards 16–24px.
- Radius: `sm` 8px (inputs, chips) · `md` 12px (cards, buttons) · `lg` 20px
  (hero panels, modals) · `full` for pills (price pills on the map).
- Cards separate by surface colour + 1px `line`; soft `card-lift` shadow
  (purple-tinted) on hover only.

## Motion

- Split-flap price flip stays the one loud animation (~350ms per digit).
- Cards use `card-lift` for a 2px rise on hover with a plum-tinted shadow.
- Live indicator dots pulse at 1.8s with `.live-dot`.
- `prefers-reduced-motion`: all animations collapse to instant.

## Reference feel

- BookMyShow for layout rhythm (card grids, sticky purchase panels, clear
  booking funnel).
- Sort My Scene for the night-first visual language (dark surfaces, bold
  photography, confident colour accents).

## Imagery

Club and event cards use real photos (Unsplash for demo; club-uploaded in
production via Supabase Storage). Dark gradient overlays on every photo so
overlaid chips stay readable. If a club has no image the gradient
placeholder (`clubGradient(slug)`) stands in — plum-biased hues.

## Copy

Plain, specific, sentence case. Buttons say exactly what happens: "Add to
cart", "Pay ₹4,720", "Save prices", "Admit 2 guests". Confirmations reuse
the verb: "Prices saved". No arrows appended to labels, no all-caps
eyebrows (use `badge` variants for emphasis instead).

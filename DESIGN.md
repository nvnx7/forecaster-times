---
name: Forecaster Times
colors:
  surface: '#fff8f2'
  surface-dim: '#e7d8bf'
  surface-bright: '#fff8f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff2dd'
  surface-container: '#fbecd2'
  surface-container-high: '#f5e6cd'
  surface-container-highest: '#efe1c7'
  on-surface: '#221b0b'
  on-surface-variant: '#444748'
  inverse-surface: '#372f1e'
  inverse-on-surface: '#feefd5'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#ae301f'
  on-secondary: '#ffffff'
  secondary-container: '#fd6951'
  on-secondary-container: '#680500'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e1b17'
  on-tertiary-container: '#88837d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a7'
  on-secondary-fixed: '#400200'
  on-secondary-fixed-variant: '#8c1709'
  tertiary-fixed: '#e8e1da'
  tertiary-fixed-dim: '#cbc6bf'
  on-tertiary-fixed: '#1e1b17'
  on-tertiary-fixed-variant: '#4a4641'
  background: '#fff8f2'
  on-background: '#221b0b'
  surface-variant: '#efe1c7'
typography:
  headline-xxl:
    fontFamily: Libre Caslon Display
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-xxl-mobile:
    fontFamily: Libre Caslon Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Libre Caslon Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Libre Caslon Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Libre Caslon Display
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Libre Caslon Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Libre Caslon Display
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Source Serif 4
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Source Serif 4
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.12em
  ticker-number:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.02em
  ticker-number-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system channels an authoritative, slightly surreal broadsheet aesthetic: *The Financial Times* re-imagined as a 1920s speculative intelligence journal from an alternate timeline. The system synthesizes historical print gravitas with rigorous quantitative rigor. It rejects contemporary software conventions—no pill buttons, no blurred glassmorphism, no vibrant neo-fintech neons, and zero surface corner radiuses.

The emotional impression is one of tactile permanence, intellectual wit, and obsessive financial precision. Readers are positioned as high-stakes decision-makers examining an ink-and-paper morning issue where probabilities, event horizons, and market contracts are documented with the formal sobriety of Victorian maritime insurance and Gilded Age exchange bulletins. Visual hierarchy relies on mechanical rule lines, dense typographic tension, small-caps sub-headers, and deliberate editorial spacing.

## Colors

The palette reproduces the physical properties of heavy wood-pulp rag paper and thick printer's oil ink:

- **Canvas & Paper (`#FFF0D6` & `#F4EFE6`):** The primary backdrop simulates unbleached, aged rag newsprint. Deep reading surfaces use `#FFF0D6`, while tabular cards, sidebars, and structural fills step down to `#F4EFE6` for tactile contrast.
- **Printer's Ink Black (`#111111` & `#1C1B19`):** Primary display headers, rules, solid action blocks, and heavy borders use deep carbon-black.
- **Aged Charcoal (`#3D3A35` & `#59554F`):** Secondary text, bylines, volume indicators, and analytical descriptions. Maintains effortless legibility without the harshness of pure black.
- **Vintage Vermilion (`#A82C1B`):** A single, urgent brick-red derived from historic editorial ledger stamps and red wax seals. Reserved for market alerts, short probabilities, high-conviction delta shifts, and key editorial markers.
- **Parchment Borders (`#D8D0C3` & `#222222`):** Structural rule lines toggle strictly between hairline paper-grain separation (`#D8D0C3`) and heavy authoritative ink rules (`#222222`).
- **Verdigris Olive (`#2C5E43`):** Subdued historic green used exclusively for positive probability deltas and long market swings.

## Typography

Typographic hierarchy draws directly from historic broadsheet composition:

- **Display & Headlines (`Libre Caslon Display`):** High-contrast transitional/didone serif with pronounced vertical stress and razor-sharp serifs. Headlines convey breaking financial stakes.
- **Editorial Body Text (`Source Serif 4`):** Crafted for sustained readability, set with genuine optical features, generous proportions, and warm editorial cadence. Supports dropped capitals (spanning 3 lines) at the initiation of feature market essays.
- **Metadata & Section Headers (`Source Serif 4 Small Caps`):** Used with wide tracking (`0.12em`) for date lines, edition marks, desk stamps, and categorical taxonomy (e.g., `DEPT. OF SPECULATIVE FUTURES`).
- **Tabular Market Data & Financial Indicators (`JetBrains Mono`):** Fixed-pitch, monospaced numerals with tabular lining to ensure absolute decimal alignment across quotation tables, order books, and ticker tapes.

## Layout & Spacing

The layout is anchored to a traditional broadsheet grid system:

- **Desktop Layout:** A 12-column architecture organized into traditional newspaper sections: a 2-column left intelligence rail (market indexes, odds summary), a 7-column lead center well (major narrative probability and analytical thesis), and a 3-column right ledger (quotation cards, active trades, rapid wire).
- **Mechanical Double & Single Rules:** Spatial separation is established using ink hairline borders rather than empty whitespace padding. Section breaks feature an editorial double-rule: a 3px heavy black rule stacked over a 1px hairline rule separated by a 2px gap.
- **Adaptive Reflow:** On tablet devices, the layout consolidates to an 8-column format with columns folding vertically beneath the lead headline. On mobile, elements stack into a single column with full-width section headers, horizontal edge-to-edge quotation tickers, and dense card layouts preserving editorial rules.
- **Rhythm:** Spacing follows compact print logic. Information density is prioritized over expansive empty space.

## Elevation & Depth

Visual hierarchy is executed through print plate mechanics rather than drop shadows or z-plane diffusion:

- **Strict Zero-Shadow Philosophy:** Soft, modern ambient blurs and drop shadows are prohibited. The interface mimics physical ink and pressboard.
- **Mechanical Enclosures:** Depth is achieved exclusively by nestling sections inside single-pixel `#222222` or `#D8D0C3` bounding boxes, tinting secondary containers with `#F4EFE6`, or applying solid 1px hard-edge offset shadows (`box-shadow: 2px 2px 0px #111111`) for actionable interactive states.
- **The Masthead Ribbon:** The primary header floats as an authoritative print banner across the full width, framed by horizontal double-rules, displaying the edition stamp, issue number, weather, and Latin maxim: *"Alea Iacta Est, Pretio Demonstrato"* ("The die is cast, price demonstrated").

## Shapes

Every element across this design system has a strict corner radius of zero.

Buttons, quotation cards, ticker badges, input boxes, dropdown menus, and tabular tags are razor-edged. This non-rounded aesthetic preserves the feel of cut paper, linotype slugs, and metal stock-quotation matrices. Corner accents on premium callout cards may feature inset 45-degree inverted mechanical notches (2px) or corner printer crosses (`+`) positioned at border intersections.

## Components

### Masthead & Broadsheet Ticker
- **The Masthead:** Spans top edge. Ornate hand-engraved sensibility centered with bold display serif typography, flanked by issue metadata: volume number, date formatted with Roman numerals, and market status. Anchored by the classic double-rule divider.
- **Ticker Tape:** Continuous horizontal ticker bounded by two single-pixel rules. Contains currency pairs, commodities, and event odds (e.g., `FED.RATE.CUT 68.2% ▲ +1.4% // LUNAR.MINING.TREATY 12.0% ▼ -3.2%`) using tabular monospaced numbers.

### Market Quote Cards (Vintage Stock Exchange Quotation Cards)
- **Container:** Structured rectangular enclosure with a 1px border (`#222222`), padded with `space-md`, set over `#F4EFE6` background.
- **Header:** Market title in `Libre Caslon Display` small headline, accompanied by a small-caps category stamp.
- **Odds & Percentages:** Stamped display numbers in `JetBrains Mono` with large probability indicators.
- **Trade Actions:** Dual split trade triggers:
  - **YES:** Sharp 1px bordered button, antique black text on parchment, hovering to solid black with cream text.
  - **NO:** Vintage vermilion outline (`#A82C1B`), hovering to solid vermilion with white text.

### Buttons & Call-to-Actions
- **Primary Action:** Solid ink black background (`#111111`), razor-sharp corners, off-white text (`#FFF0D6`), uppercase monospace label (`letterSpacing: 0.1em`). Pressed state triggers a 1px interior inset hairline.
- **Secondary Action:** Transparent background with 1px ink rule, black uppercase text, shifting to parchment tint (`#D8D0C3`) on hover.
- **Alert / Conviction Action:** Rich vermilion (`#A82C1B`) background with crisp white typography.

### Input Fields & Selectors
- **Input Fields:** Unfilled rectangular boxes with 1px borders in `#3D3A35`, crisp monospace text, and small-caps labels seated directly within the top border line break. No drop shadows. Active focus turns border into 2px solid `#111111`.
- **Checkboxes & Radios:** Sharp square check boxes (0px radius). Checked state displays a solid black square inset with a mechanical cross (`✕`) rather than an organic vector checkmark.

### Editorial Lists & Tables
- **Financial Ledger Tables:** Alternating rows using subtle parchment shift (`#FFF0D6` to `#F4EFE6`), hairline cell dividers, right-aligned tabular numerals with explicit decimal points, and column headers styled in small caps with a continuous underline.
- **Dispatch List:** Narrative bullet list using diamond-shaped printer bullets (`◆`), headline in `Source Serif 4` italic, and source stamp in small-caps charcoal.

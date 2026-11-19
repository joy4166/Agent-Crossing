---
name: Agent Crossing (에이전트의 숲)
description: Stylized 2.5D Animal Crossing diorama & NookPhone multi-agent supervision design system for Antigravity, Claude Code, Cursor, and Codex
colors:
  leaf-green: "#1e6b40"
  leaf-dark: "#154e2e"
  leaf-tint: "#e4f5eb"
  ocean-deep: "#2d99aa"
  ocean-light: "#4ac8d4"
  cream: "#fffbf0"
  cream-soft: "#f7eed6"
  passport-tint: "#f3e8cb"
  wood-dark: "#4f2f15"
  wood-mid: "#784b26"
  wood-border: "#966d3b"
  ink: "#2c1c0f"
  ink-muted: "#563920"
  grass-base: "#79cf5b"
  cliff-front: "#935c33"
  sand-top: "#fae8b2"
typography:
  headline:
    fontFamily: "'NanumSquareRound', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'NanumSquareRound', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'NanumSquareRound', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'NanumSquareRound', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1.2
rounded:
  sm: "10px"
  md: "12px"
  lg: "18px"
  pill: "999px"
spacing:
  xs: "5px"
  sm: "8px"
  md: "12px"
  lg: "18px"
components:
  button-wood:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  button-wood-hover:
    backgroundColor: "{colors.cream-soft}"
    textColor: "{colors.ink}"
  button-accent:
    backgroundColor: "#fff2c6"
    textColor: "#543600"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  pill-action:
    backgroundColor: "{colors.leaf-tint}"
    textColor: "{colors.leaf-dark}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  card-passport:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "13px 14px"
  field-search:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "7px 10px 7px 31px"
---

# Design System: Agent Crossing (에이전트의 숲)

## Overview

**Creative North Star: "Handheld NookPhone & 2.5D Cozy Island Diorama"**

Agent Crossing V2 translates parallel multi-agent activity across **Google Antigravity**, **Claude Code**, **Cursor**, and **OpenAI Codex CLI** into a calm, read-only *Animal Crossing: New Horizons* archipelago. Whether docked inside a `390px` IDE sidecar pane or floated in a `960x640` companion window, over 88% of the first viewport stays dedicated to the 2.5D island diorama canvas framed by a single `44px` NookPhone toolbar.

All surfaces reject cold grey developer dashboards and system emojis in favor of self-hosted `NanumSquareRound` (`400`/`700`/`800`, stabilized across Latin/Korean scripts via `font-size-adjust: from-font`), Cream Papyrus (`#fffbf0`) cards with subtle tonal dot-paper grain, unified `2.1px` rounded-stroke vector SVGs, and pre-baked `2x` 2.5D island terrains responding to Auto, Day, Sunset, and Night palettes.

**Key Characteristics:**
- **Bilingual Live Architecture (`EN` Default + Instant `KO`)**: Full English experience by default with a 1-click `KO`/`EN` toggle in both HUD and Guide sheet (`localStorage` persisted, `document.documentElement.lang` synced).
- **Spatial Persona vs. Task Separation**: Canvas nameplates hold compact villager identities (`Mayor Biscuit`, `Curator Mochi` / `촌장 보리`, `학예 모카`); doorplates show cleaned short task topics (`<= 15` Latin / `<= 9` CJK chars); Nook Passport displays untruncated conversation titles, tool provenance badges, and footprints.
- **4-Stage Container-Aware Density (`#app-shell`)**:
  - `< 560px`: compact `44px` icon toolbar (retaining explicit `KO`/`EN` code + `27–28px` fine-pointer icon pills), bottom-docking inspector.
  - `560px–719px`: reveals `.hud-stats`.
  - `720px–879px`: docks `#inspectorCard` right (`316px`) and reveals `.badge-zero` + `.passport-footer`.
  - `>= 880px`: reveals text `.btn-label` across all 6 HUD buttons.

## Colors

### Primary
- **Sage Leaf Green** (`#1e6b40`): Brand pill, selected filter/language pills, and primary status framing.
- **Deep Forest Leaf** (`#154e2e`): Focus rings (`outline`), active badges, current-conversation nameplates.
- **Mint Leaf Tint** (`#e4f5eb`): Live connection pill, active filter indicator, primary `.action-pill` buttons.

### Secondary & 2.5D Environment
- **Day Ocean & Meadow**: `--ocean-light: #4ac8d4` -> `--ocean-deep: #2d99aa`, Meadow `#79cf5b`, Upper Turf `#8ce26a`, Sculpted Cliff `#935c33` / `#6c4020`, Sand `#fae8b2` / wet lip `#dfc27c`.
- **Sunset Horizon**: `#5fa4b8` -> `#3c748c`, amber window glow, warm wash.
- **Night Archipelago**: `#225072` -> `#143651`, `#4b9862` grass, amber cottage windows, twinkling horizon stars, streetlamp halos, drifting fireflies.
- **Agent Tool Provenance Chips**:
  - **Antigravity (`AGY`)**: `#e4f5eb` fill / `#154e2e` ink
  - **Claude Code (`Claude`)**: `#fff3db` fill / `#92400e` ink
  - **Cursor (`Cursor`)**: `#e0f2fe` fill / `#075985` ink
  - **Codex CLI (`Codex`)**: `#f3e8ff` fill / `#5b21b6` ink

### Neutral
- **Cream Papyrus** (`#fffbf0`), **Warm Parchment** (`#f7eed6`), **Passport Tint** (`#f3e8cb`), **Oak Wood** (`#966d3b`), **Mid Timber** (`#784b26`), **Deep Bark** (`#4f2f15`), **Espresso Ink** (`#2c1c0f`), **Cocoa Muted** (`#563920`).

### Named Rules
**The Zero-Gray Ink Rule.** All borders, icons, scrollbars, and muted text use warm cocoa/wood derivatives (`#563920`, `#966d3b`) rather than flat grey.

**The Action-Oriented Filter Rule.** `#filterBtn` displays what clicking *will show* next (`Active Only` while viewing all islands; `Show All` while filtered to active islands).

## Typography

**Font Stack:** `'NanumSquareRound', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif`
**Mixed-Script Normalization:** `font-size-adjust: from-font` on `#app-shell`, with `@supports not (font-size-adjust: from-font)` line-height fallback (`1.44`).
**Minimum Floor:** Every UI text element obeys the `11px` floor (`11px` badges/pills up to `15px` headlines), with `tabular-nums`, `text-wrap: balance` on `h1–h3`, `text-wrap: pretty` on `p, li`, and `word-break: keep-all` on wrapping labels.

## Layout, Elevation & Interactive Surfaces

- **Single-Row HUD (`44px`)**: `.hud-left` truncates gracefully on ultra-narrow viewports while `.hud-actions` fits cleanly on 1 row.
- **Stage Floating Controls**:
  - Top-left `#stageBanners` for `#focusBanner` (Single-Island Focus `Z`) and `#sourceFilterBanner`.
  - Top-right `#stopDemoBtn` (`End Demo`) & `#retryBtn`.
  - Bottom-left `.toast` (`z-index: 28`, clears top headers and bottom-right `#zoomControls`).
  - Bottom-right `#zoomControls` (`+`, `−`, `Fit`).
- **Directory Overlay (`#directoryDrawer`)**: Source filter pills (`All`, `AGY`, `Claude`, `Cursor`, `Codex`), search input, flexible scrolling list (`max-height: min(340px, 52vh)`), per-island Focus & Hide buttons, and native `<details id="hiddenIslandsAccordion">` disclosure (`::before` rotating chevron, smooth `::details-content` reveal) to restore excluded islands.
- **Nook Passport (`#inspectorCard`)**: Features unified `--wood-border` custom scrollbars, species portrait medallion, tool badge, dashed Quest box, Focus/Hide/Folder/Chat actions, and recent activity feed.

## Do's and Don'ts

### Do:
- **Do** keep all canvas and DOM icons strictly rendered via `VillageSprites.renderIconSvg`, `renderProviderIconSvg`, and `drawCanvasIcon` (`2.1px` stroke).
- **Do** resolve collisions across BOTH full bubbles and `24x24` shoulder badges (`compactIconOnly`) against other bubbles, villager heads, and plaza station labels.
- **Do** place plaza streetlamps flanking the Resident Services courtyard clear above all 5 station label pills (`plazaY - 51`).

### Don't:
- **Don't** include OS Unicode emojis anywhere in UI, Canvas, or backend responses.
- **Don't** render functional UI copy below `11px` or cover headings/close buttons with `.toast`.
- **Don't** modify or lock IDE SQLite files (strictly `{ readOnly: true }`).

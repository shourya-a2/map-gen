# WayArena Design Review

A UI/UX and design principles audit of the current codebase. Written to guide future design and engineering decisions.

---

## 1. Typography

### Problem: 9 Google Font families, no shared font system

Each CSS file independently `@import`s its own fonts. There is no single font file or shared import.

| Route/Component | Font(s) |
|---|---|
| Student Lobby, Home, Create Map Modal/SideSheet | Nunito |
| Mystery Lobby (LobbyScreenMystery) | Quicksand |
| Mystery Side Sheet, Teacher Dashboard, Map Carousel | Geist Mono + Press Start 2P |
| Teacher Lobby v2 | Press Start 2P |
| Competition Side Sheet timer | Courier New |
| Legacy ControlsScreenToy | Fredoka |
| Legacy ControlsScreenFull | Orbitron |

**`LobbyScreenTeacher.css` uses Press Start 2P, Geist Mono, and Quicksand without importing any of them** -- it silently relies on other stylesheets loading first.

### Problem: 3 conflicting CSS variable systems for the same fonts

- `LobbyScreen.css` defines `--lobby-*` variables
- `TeacherDashboard.css` defines `--teacher-font-pixel`, `--teacher-font-mono`
- `MysteryMapChallenge.css` / `MapCarousel.css` define `--wa-font-display`, `--wa-font-body`

All three resolve to the same two fonts (Press Start 2P and Geist Mono) but use different variable names.

### Recommendation

Create one shared `tokens.css` file imported in `index.css` that declares all font imports and CSS variables once. The WayArena tokens (`--wa-*`) in `MysteryMapChallenge.css` are the most complete -- promote them to global scope.

---

## 2. Color System

### Problem: No canonical brand color

The primary pink appears as 5 different hex values across files:

| Value | Usage |
|---|---|
| `#e91e8c` | LobbyScreen.css (CSS var `--lobby-pink`) |
| `#ec4899` | Most common -- buttons, borders, accents across 6+ files |
| `#f472b6` | Tab indicator gradient |
| `#db2777` | Button gradient end |
| `#be185d` | Competition button gradient |

`#ec4899` is the de facto primary but is never defined as a variable outside `LobbyScreen.css`.

### Problem: Background darks are inconsistent

Student screens use warm purple-dark (`#2d0a4e`), teacher screens use cool slate-dark (`#0f172a`), and Mystery uses `#1a120a` (warm brown). This may be intentional for role differentiation but is undocumented.

### What works

Semantic status colors are consistent everywhere: green `#10b981`/`#059669`, red `#ef4444`/`#dc2626`, yellow `#fbbf24`/`#f59e0b`.

### Recommendation

Document the color intent. If student = purple, teacher = slate, mystery = brown is deliberate, codify it. If not, unify. Either way, move all shared colors into CSS custom properties.

---

## 3. Animation & Motion

### Problem: Duplicated keyframes

| Animation | Duplicated In |
|---|---|
| `crownFloat` | LobbyScreenCompetition.css, WinnerCelebration.css, TeacherDashboard.css (different translateY values: -8px vs -10px) |
| `floatUp`, `twinkle`, `emberFloat` | CreateMapModal.css and CreateMapSideSheet.css (identical copies) |
| `badgePulse` | HomePage.css declares 4 identical copies under different names (`badgePulse`, `mysteryBadgePulse`, `teacherBadgePulse`, `teacher2BadgePulse`) |

The `crownFloat` duplication is the most dangerous -- the browser uses whichever was last parsed, so the animation behavior depends on stylesheet load order.

### Problem: 35+ named keyframes, no inventory

The codebase has extensive animation work but no pattern library. Each component invents its own pulse, float, shimmer, and glow effects independently.

### What works

- Standard transition is `all 0.2s ease` used consistently across most components
- Framer Motion spring transitions use a shared `springTransition` constant in the components that use them
- `MysteryMapChallenge` has the cleanest animation architecture: all motion is framer-motion based with CSS only for ambient effects

### Problem: Inconsistent transition durations

Most of the codebase uses `0.2s ease`, but exceptions include:
- `0.4s ease` on prompt input (CreateMapSideSheet)
- `0.8s ease` on background-color (same file)
- `0.3s cubic-bezier(0.4, 0, 0.2, 1)` on tab indicator (Material Design easing -- inconsistent with rest of codebase)

### Recommendation

Extract shared keyframes into a `shared-animations.css` file. Standardize on 2-3 duration tiers (fast: 0.15s, normal: 0.25s, slow: 0.5s).

---

## 4. Responsive Design

### Problem: 12 different breakpoints with no system

| Breakpoint | Files Using It |
|---|---|
| `768px` | 8 files (de facto standard) |
| `480px` | 3 files |
| `500px` | 2 files |
| `1200px`, `1100px`, `1024px`, `900px`, `640px`, `600px`, `520px`, `400px` | 1 file each |

### Problem: Height queries only in MysteryMapChallenge

`MysteryMapChallenge.css` is the only file with `max-height` media queries (700px, 600px, 550px). This is smart for Chromebooks but no other component does it -- so the side sheet adapts to short screens but the lobby behind it does not.

### What works

`768px` as the tablet breakpoint is used consistently in 8/17 CSS files.

### Recommendation

Standardize on 3 breakpoints: `768px` (tablet), `500px` (mobile), and optionally `1024px` (wide). Add `max-height` queries to lobby screens since the target devices are Chromebooks with limited vertical space.

---

## 5. Z-Index Layering

### Current stack (undocumented)

| z-index | Element |
|---|---|
| `99999` | WinnerCelebration |
| `9000` | Demo panel (dev tool) |
| `2000` | Confirm dialogs inside side sheets |
| `1001-1002` | Side sheets, teacher navbar, MapCarousel overlay |
| `1000` | Modal/sheet backdrops |
| `100-200` | Map panels, confirm overlays |
| `10-25` | Headers, tabs |
| `0-2` | Background layers |

### Problem

Values are scattered across files with no documentation. The demo panel at `9000` sits above the teacher navbar at `1001` which may cause issues during testing. The confirm dialog inside a side sheet at `2000` is inside a `1001` stacking context, so it correctly stays within its parent -- but if another side sheet opens, it could clash.

### Recommendation

Add a z-index scale to the shared tokens file:

```css
--z-base: 0;
--z-header: 10;
--z-panel: 100;
--z-overlay: 1000;
--z-sheet: 1001;
--z-modal: 1100;
--z-toast: 1200;
--z-winner: 99999;
```

---

## 6. Accessibility

### Critical: Zero ARIA attributes in the entire codebase

No `aria-label`, `aria-live`, `aria-hidden`, `aria-modal`, or `role` attributes were found in any `.js` file.

**Highest-impact gaps:**

| Element | Missing | Impact |
|---|---|---|
| Competition timer | `aria-live="assertive"` | Screen readers never announce countdown |
| Modal/side sheet overlays | `role="dialog"`, `aria-modal="true"` | Not announced as dialogs |
| Icon-only buttons (close, shuffle, etc.) | `aria-label` | No accessible name |
| Winner celebration | `aria-live="assertive"` | Winner announcement not conveyed |
| Decorative icons (icons.js) | `aria-hidden="true"` | Read aloud unnecessarily |

### Critical: No focus management

- Only one keyboard handler in the codebase (`onKeyPress` in CompetitionSideSheet -- and `onKeyPress` is deprecated in React)
- No focus trapping in modals or side sheets -- Tab key escapes to content behind overlays
- No `tabIndex` management anywhere

### Problem: Focus outlines removed without replacement

Every `:focus` style uses `outline: none` and replaces it with `box-shadow`. None use `:focus-visible`, so:
- Keyboard users see the glow on form inputs (acceptable)
- Keyboard users see nothing on buttons and custom elements (broken)
- Mouse users see the glow on click (unnecessary visual noise)

### Problem: Low contrast text

`rgba(255, 255, 255, 0.5)` over dark backgrounds fails WCAG AA (4.5:1 required for normal text). Used in:
- `.hero-map-card__label` (LobbyScreenMystery.css)
- `.shuffles-remaining` at 13px font size (LobbyScreen.css)
- Various secondary text elements

### Problem: `prefers-reduced-motion` coverage

Only 4 of 17 animation-using CSS files respect `prefers-reduced-motion`. Missing from all lobby screens, HomePage, and teacher screens.

### Recommendation

This is the single biggest area for improvement. At minimum:
1. Add `role="dialog"` and `aria-modal="true"` to all overlays
2. Add `aria-label` to icon-only buttons
3. Add `aria-live="polite"` to the competition timer
4. Replace `outline: none` with `:focus-visible` styling
5. Add `prefers-reduced-motion: reduce` blocks to all CSS files with animations

---

## 7. Layout Patterns

### What works

- Side sheets consistently slide from the left edge with framer-motion spring transitions
- The upper/lower region pattern in MysteryMapChallenge prevents layout shift during generation
- Video backgrounds use `mask-image` gradient fade -- visually polished
- Teacher screens correctly separate from student screens visually (different background hues, different density)

### Problem: Inconsistent overflow handling

- `MysteryMapChallenge.css` uses `overflow: hidden` on `.aura-phase-content` (correct for no-shift generation)
- `CreateMapSideSheet.css` uses `overflow-y: auto` on `.sheet-content`
- No consistent pattern for when scrolling should or shouldn't be allowed

### Problem: Inconsistent spacing scale

No shared spacing tokens. Padding values range from `4px` to `48px` with no obvious scale. Common values: `8px`, `12px`, `16px`, `20px`, `24px`, `32px` -- which is close to a 4px base grid but not strictly followed.

---

## 8. Component Design Patterns

### What works

- CSS class prefixes per component (`aura-`, `sheet-`, `wa-btn-`) prevent collisions effectively
- WayArena design tokens in MysteryMapChallenge.css are well-structured with shadows, transitions, and semantic names
- Shared components (CharacterSprite, PlayerAvatar, icons) eliminated ~270 lines of duplication
- Sound managers use a consistent pattern (lazy AudioContext init, Web Audio API synthesis)

### Problem: `.demo-panel` defined in two files

`LobbyScreenCompetition.css` and `CompetitionDemoPage.css` both define `.demo-panel` with ~22 conflicting rules (different `min-width`: 280px vs 300px). Whichever loads last wins.

### Problem: Button styling is fragmented

| Button Class | File | Style |
|---|---|---|
| `.wa-btn-primary` | MysteryMapChallenge.css | Neon yellow pixel button with glow |
| `.aura-btn-primary` | MysteryMapChallenge.css | Gold gradient with pixel shadow |
| `.wa-btn-secondary` | MysteryMapChallenge.css | Yellow ghost border |
| `.generate-btn` | CreateMapSideSheet.css | Pink gradient |
| `.create-map-btn` | LobbyScreen.css | Pink with glow |
| `.test-button` | HomePage.css | Dark with border |
| `.competition-btn`, `.mystery-btn`, etc. | HomePage.css | Override `.test-button` per route |

There is no shared button component or button CSS. Each screen invents its own button style.

---

## 9. Design System Maturity Assessment

| Aspect | Status | Score |
|---|---|---|
| Typography | Fragmented -- 9 fonts, 3 variable systems | 2/10 |
| Color | Mostly consistent semantics, no shared tokens | 4/10 |
| Animation | Rich but duplicated, no shared library | 5/10 |
| Responsive | De facto 768px standard, many outliers | 4/10 |
| Z-index | Functional but undocumented | 3/10 |
| Accessibility | Critical gaps across the board | 1/10 |
| Component reuse | Good start with shared/ folder | 6/10 |
| Spacing | Near 4px grid but not codified | 4/10 |
| Overall cohesion | Individual screens look great; cross-screen consistency is low | 4/10 |

---

## 10. Priority Actions

**Immediate (before next feature work):**
1. Create `src/styles/tokens.css` with shared font imports, color variables, z-index scale, and breakpoint comments
2. Add `aria-label` to all icon-only buttons and `role="dialog"` to overlays
3. Replace `outline: none` with `:focus-visible` in all files

**Short-term (next sprint):**
4. Extract duplicated keyframes into `src/styles/shared-animations.css`
5. Deduplicate `.demo-panel` -- keep one definition
6. Add `prefers-reduced-motion` to all remaining CSS files
7. Standardize breakpoints to 768px + 500px

**Medium-term (design system):**
8. Build a shared button component with 2-3 variants (primary, secondary, ghost)
9. Reduce font families to 3 max (display: Press Start 2P, body: Geist Mono, fallback: system)
10. Document the student-purple / teacher-slate / mystery-brown color intent

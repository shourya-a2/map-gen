# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm start          # Dev server on localhost:3000
npm run build      # Production build to build/
```

No test runner, linter, or formatter is configured.

## What This Project Is

WayArena is a **frontend-only prototype** for a classroom game where students create maps and compete. There is **no backend** — all data is mocked (`src/data/mockData.js`) and persisted to localStorage via `useMapStore`. Target devices are Chromebooks.

## Tech Stack

- React 18 (CRA with react-scripts 5.0.1), plain JavaScript (no TypeScript)
- react-router-dom v7 for routing
- framer-motion v11 for all animations (AnimatePresence, motion.div, spring transitions)
- Plain co-located CSS files (no modules, no Tailwind, no preprocessors)
- Web Audio API for synthesized sounds (two separate managers + inline audio helpers)

## Routes

| Path | Screen | Description |
|------|--------|-------------|
| `/` | HomePage | Landing page with route links |
| `/modal` | LobbyModal | Student lobby with modal map creator |
| `/side-sheet` | LobbySideSheet | Student lobby with side-sheet map creator |
| `/competition` | LobbyCompetition | Timed competition mode with leaderboard |
| `/mystery` | LobbyMystery | Mystery map challenge with coin economy |
| `/teacher` | TeacherLobby | Teacher dashboard v1 |
| `/teacher2` | TeacherLobbyV2 | Teacher dashboard v2 |

## Architecture

**Screens** (`src/screens/`) are route-level pages that compose components. They own layout CSS and render the lobby background + side panels, then mount their corresponding component.

**Components** (`src/components/`) contain the actual interactive UI:
- `student/` — Map creators (CreateMapModal, CreateMapSideSheet, MysteryMapChallenge, CompetitionSideSheet). Each has its own CSS file with a distinct class prefix (`aura-` for Mystery, `sheet-` for SideSheet, etc.)
- `teacher/` — TeacherDashboard, MapCarousel
- `shared/` — CharacterSprite, PlayerAvatar, icons (extracted from duplicated code across lobbies)

**Hooks** (`src/hooks/`):
- `useMapStore` — localStorage CRUD for custom maps (key: `wayarena-custom-maps`, max 20 maps)
- `useCompetition` — State machine (idle → active → review → ended) with timer and generation limits

**Utils** (`src/utils/`):
- `mapCreatorUtils.js` — Keyword-based theme detection, color palettes, rarity calculation, animated input component
- `competitionSounds.js` — CompetitionSoundManager class using Web Audio API

**Data** (`src/data/mockData.js`) — Mock thumbnails, players, prompts. Everything is fake/randomized.

## Key Patterns

- **CSS prefix per component**: Each major component uses a unique CSS class prefix to avoid collisions (e.g., `aura-` for MysteryMapChallenge, `sheet-` for CreateMapSideSheet). Follow the existing prefix when editing a component.
- **WayArena design tokens**: MysteryMapChallenge.css defines CSS custom properties (`--wa-gold-primary`, `--wa-font-display`, `--wa-shadow-pixel`, etc.) used throughout the `/mystery` route. Use these tokens rather than hardcoding colors.
- **Sound via Web Audio API**: Components create AudioContext lazily and synthesize tones directly (no audio files). MysteryMapChallenge has inline `playArpeggioSound`/`playLevelUpSound` functions. CompetitionSideSheet uses the `CompetitionSoundManager` class.
- **Framer Motion everywhere**: All transitions use framer-motion. Prefer `AnimatePresence mode="wait"` for crossfades and `springTransition` objects for interactive elements.
- **No backend calls**: All "generation" is simulated with `setTimeout`. Map data is constructed client-side with random thumbnails from `mockData.js`.

## Legacy Files

`src/ControlsScreen.js`, `ControlsScreenFull.js`, `ControlsScreenToy.js`, and `src/LobbyScreenCompetition.js` are older files at the src root that predate the folder restructure. They are not imported anywhere but haven't been deleted yet.

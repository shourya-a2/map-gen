# Wayarena - Game Controls UI

A beautiful React component that displays game controls with pixel art sprites and smooth animations.

## Features

- **Clean, minimal design** - White background with dark maroon-purple keys (#2D1B3D)
- **Three control sections:**
  - Movement (WASD / Arrow Keys)
  - Cast Spell (Mouse Click / Spacebar)
  - Change Spell (Number Keys 1, 2, 3)
- **Pixel art sprites** - Custom SVG sprites with authentic pixel look
- **Smooth animations powered by Framer Motion:**
  - Staggered fade-in on page load
  - Floating keys with subtle 2px bob animation
  - Press-down effect on key hover
  - Idle bob animation on sprites
  - Energetic animation on section hover

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── index.js           # App entry point
├── ControlsScreen.js  # Main component with sprites and animations
└── ControlsScreen.css # Styling
```

## Technologies Used

- **React 18** - UI framework
- **Framer Motion** - Animation library
- **Nunito Font** - Clean sans-serif from Google Fonts

## Customization

### Colors

The key color can be changed in `ControlsScreen.css`:

```css
.key-cap {
  background-color: #2D1B3D; /* Dark maroon-purple */
}
```

### Animations

Animation timing can be adjusted in `ControlsScreen.js`:

- `floatAnimation` - Key floating effect
- `spriteIdleAnimation` - Sprite idle bob
- `spriteHoverAnimation` - Sprite hover effect

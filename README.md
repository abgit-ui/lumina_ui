# Lumina: The Whispers of Aethelgard

An immersive, scroll-driven storytelling experience set in the mystical realm of Aethelgard. Follow the legend of Princess Elara, Guardian of the Ancient Pines, through a cinematic web experience powered by React, Three.js, and Google's Gemini AI.

## Features

- Scroll-driven narrative with GSAP ScrollTrigger animations
- Three.js WebGL particle system for ambient magical atmosphere
- AI-generated ambient music via Google Gemini's Lyria model
- Parallax imagery, firefly animations, and custom cursor effects
- Fully responsive layout with a dark fantasy aesthetic

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Three.js — WebGL particle background
- GSAP + ScrollTrigger — scroll animations
- Framer Motion — entrance/exit transitions
- Tailwind CSS v4
- Google GenAI SDK (`@google/genai`) — Lyria music generation
- Lucide React — icons

## Getting Started

### Prerequisites

- Node.js 18+


### Setup

```bash
npm install
```

Copy the example env file and add your API key:

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY=your_api_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check |

## AI Music Generation

Click the music note icon in the top-right corner to generate a 30-second ethereal ambient track using Gemini's Lyria model. The app will prompt you to select an API key if one isn't already configured. Generated audio plays on loop and can be toggled with the volume button.

## Project Structure

```
src/
├── App.tsx              # Main app, all sections and scroll logic
├── components/
│   └── ForestWebGL.tsx  # Three.js particle background
├── index.css            # Global styles and custom utilities
└── main.tsx             # Entry point
```

## License

Apache-2.0

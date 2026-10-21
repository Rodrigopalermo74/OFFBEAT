# HOUSEGAME

Teoría musical para productores de house. Minijuegos con step sequencer y piano roll para aprender ritmo, groove, escalas, acordes y oído con material de Minimal House, Deep House y Deep Tech.

- Diseño de juego y propuesta técnica: [`docs/diseno.md`](docs/diseno.md)
- Fases: [`ROADMAP.md`](ROADMAP.md)
- Guía para trabajar con Claude Code: [`CLAUDE.md`](CLAUDE.md)

## Empezar

Requiere Node 22+ y pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # tests unitarios
pnpm test:e2e     # Playwright (la primera vez: pnpm exec playwright install chromium)
```

## Estructura

```
apps/web               app web (Vite + React)
packages/theory        teoría musical pura
packages/game-core     puntuación y reglas de juego
packages/content       esquemas y niveles JSON
packages/audio-engine  motor de audio (Tone.js detrás de una interfaz propia)
packages/ui-grid       piano roll y step sequencer
tools/content-validate validación de niveles
.claude/               hooks, skills y subagentes de Claude Code
```

# Roadmap

Detalle de cada fase en `docs/diseno.md` §5. La fase marcada con "(actual)" la lee el hook de inicio de sesión.

## F0. Fundaciones (actual)

- [x] Monorepo pnpm + Turborepo, TypeScript estricto, Biome
- [x] `packages/theory` con tests (voice leading, key finding, escalas, acordes)
- [x] `packages/game-core`: puntuación de groove y swing
- [x] `packages/content`: esquema de niveles + validador con verificación musical
- [x] Spike: transporte Tone.js con swing, step sequencer, piano roll en Canvas con playhead y modo estrés de 512 notas
- [x] CLAUDE.md, hooks, skills y subagentes de Claude Code
- [x] CI: lint, typecheck, unit, validación de contenido, build, e2e
- [ ] Probar latencia y jitter en dispositivos reales (Android/iOS) con la página del spike
- [ ] Decidir React vs Svelte de forma definitiva (por ahora React)

Criterio de salida: el loop 4/4 corre sin jitter audible y el piano roll se mantiene a 60 fps con 512 notas en un navegador real.

## F1. Vertical slice

Groove Lab completo (Recreate + Fix the Groove), crowd energy, 10 niveles de los capítulos 0–1, progreso local.

## F2. Núcleo didáctico

Deep Chords, Key Shift, Bassline Duel, lecciones, repetición espaciada, tarjetas DAW, exportación MIDI.

## F3. Meta-juego · F4. Mobile y online · F5. Contenido avanzado · F6. Lanzamiento

Ver `docs/diseno.md`.

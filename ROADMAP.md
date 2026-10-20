# Roadmap

Detalle de cada fase en `docs/diseno.md` §5. La fase marcada con "(actual)" la lee el hook de inicio de sesión.

## F0. Fundaciones

- [x] Monorepo pnpm + Turborepo, TypeScript estricto, Biome
- [x] `packages/theory` con tests (voice leading, key finding, escalas, acordes)
- [x] `packages/game-core`: puntuación de groove y swing
- [x] `packages/content`: esquema de niveles + validador con verificación musical
- [x] Spike: transporte Tone.js con swing, step sequencer, piano roll en Canvas con playhead y modo estrés de 512 notas
- [x] CLAUDE.md, hooks, skills y subagentes de Claude Code
- [x] CI: lint, typecheck, unit, validación de contenido, build, e2e
- [x] Plataforma: solo PC (navegador de escritorio, teclado y mouse)
- [x] React como framework de UI

Criterio de salida: el loop 4/4 corre sin jitter audible y el piano roll se mantiene a 60 fps con 512 notas en un navegador real.

## F1. Vertical slice

- [x] Groove Lab: modos Recreate (dictado rítmico) y Fix the Groove (swing y velocities)
- [x] Crowd energy en vivo en Fix the Groove, estrellas y resultado con marcas de error en Recreate
- [x] 10 niveles de los capítulos 0–1, validados por esquema y teoría
- [x] Mapa de niveles con mastery gating y progreso local (localStorage)
- [x] Atajos de teclado: Espacio (play), R (referencia/tu versión), Enter (drop), Esc (mapa)
- [ ] Test de juego con 5 productores
- [ ] Probar latencia y jitter en Chrome, Edge, Firefox y Safari de escritorio

Criterio de salida: los testers terminan el capítulo 1 y quieren repetir.

## F2. Núcleo didáctico (actual)

- [x] Deep Chords: Stack the Chord y Voice Leading, con análisis por compás (qué falta, qué sobra) y meta de movimiento
- [x] 6 niveles del capítulo 4 (Am7, Am9, Fmaj7; Am7→Dm7, i–iv–VI–v, Am9→Dm9)
- [x] Mapa con un recorrido de desbloqueo por minijuego
- [x] Deep Chords: Mood Board con pads de acordes, cifrado romano, función armónica, medidor de tensión, bajo automático y brief evaluado en vivo
- [x] 5 niveles del capítulo 5 (vamp i9–iv9, IV7 dórico, i–VII–VI–VII, tensión y resolución, progresión libre)
- [ ] Deep Chords: One-Chord Stab (capítulo 6)
- [x] Key Shift: Find the Root (grados sobre el drone de la tónica) y Mode Swap (eólico → dórico, frigio o mixolidio), con la respuesta explicada en grados
- [x] 8 niveles: 5 del capítulo 3 (de 1 y 5 a la menor completa) y 3 del capítulo 6 (en La y en Re)
- [ ] Key Shift: Modulation Run y Harmonic Mixing (capítulo 7)
- [x] Bassline Duel: Call & Response con sinte de bajo propio, duelo llamada/respuesta y aviso de octava o nota equivocada
- [x] 8 niveles: 4 del capítulo 2 (offbeat y octavas) y 4 del capítulo 3 (quinta, ♭3, pentatónica menor)
- [ ] Lecciones, repetición espaciada, tarjetas DAW y exportación MIDI

## F3. Meta-juego · F4. Desktop y online · F5. Contenido avanzado · F6. Lanzamiento

Ver `docs/diseno.md`.

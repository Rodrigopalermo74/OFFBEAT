# OFFBEAT

App lúdico-didáctica de teoría musical para productores de Minimal House, Deep House y Deep Tech.
Diseño completo en `docs/diseno.md`; fases y estado en `ROADMAP.md`; identidad visual (tipografías, tokens, reglas de pantalla) en `docs/identidad-visual.md`.

**Plataforma: solo PC.** Navegador de escritorio, pensado para teclado, mouse y controladores MIDI. No agregues soporte ni layouts para mobile; cada pantalla nueva tiene atajos de teclado.

## Mapa del repo

- `packages/theory`: teoría pura (notas, acordes, escalas, voice leading, detección de tonalidad). Sin audio, sin DOM.
- `packages/game-core`: reglas de juego y puntuación (groove, crowd energy, dificultad). Depende solo de `theory`.
- `packages/content`: esquemas Zod, niveles en `levels/*.json` y tarjetas "Hacelo en tu DAW" en `daw-cards/*.md`.
- `packages/audio-engine`: interfaz `AudioEngine` + implementación Web Audio con Tone.js.
- `packages/ui-grid`: piano roll (Canvas) y step sequencer (React).
- `packages/midi`: escritor de archivos MIDI (SMF) y ZIP sin compresión, sin dependencias.
- `apps/web`: app Vite + React: mapa de niveles, minijuegos en `src/games/<juego>` (Groove Lab, Bassline Duel, Deep Chords con Mood Board y One-Chord Stab, Key Shift) y Studio (sandbox del spike de F0). Cada minijuego tiene su propio recorrido de desbloqueo (`TRACKS` en `src/levels.ts`).
- `tools/content-validate`: valida esquema y teoría de los niveles.

Los paquetes exportan su `src/index.ts` directamente (sin build intermedio); los imports internos llevan extensión `.ts`.

## Reglas de arquitectura

- `theory` y `game-core` son funciones puras con tests. Para propiedades musicales (transposición, simetría) usá fast-check.
- Nunca temporizar audio con `setTimeout`/`setInterval`/`requestAnimationFrame`. El audio se programa en el Transport con el `time` del callback; la UI solo lee la posición y dibuja.
- La UI no importa `tone`: habla con la interfaz `AudioEngine`, para poder cambiar la implementación (por ejemplo react-native-audio-api en mobile).
- En AudioWorklets: sin asignaciones dentro de `process()`, buffers preasignados.
- Grids grandes en Canvas, no en DOM por nota.
- Contenido nuevo va en `packages/content/levels` como JSON y debe pasar `pnpm content:validate` (el nombre del archivo es el `id`).
- Samples solo con licencia compatible (CC0, CC BY con atribución, propios). Cada pack en `assets/samples/<pack>/` tiene `LICENSE.md`. Preferí síntesis antes que samples.
- Las dependencias AGPL (Strudel, Essentia.js) no entran al bundle.

## Comandos

```
pnpm dev                # app web en http://localhost:5173
pnpm test               # Vitest (theory, game-core, tools)
pnpm test:e2e           # Playwright
pnpm typecheck          # tsc en todos los paquetes
pnpm lint               # Biome
pnpm content:validate   # esquema + teoría de los niveles
pnpm build:single       # OFFBEAT en un solo HTML para el link jugable (presupuesto 1,5 MB)
pnpm smoke:single       # prueba ese HTML con Playwright
```

## Hooks activos (`.claude/settings.json`)

- SessionStart instala dependencias, recuerda la fase y lista los PRs abiertos (avisa si la pila pasa de 4).
- PreToolUse bloquea timers en `audio-engine`, imports de `tone` en la UI, colores sueltos en componentes, samples sin `LICENSE.md`, comandos git/rm destructivos y `pkill -f vite`.
- PostToolUse formatea con Biome, valida cada nivel y cada tarjeta DAW que edites y frena texto de UI en inglés.
- Stop corre typecheck y `vitest related` si cambiaste `.ts`/`.tsx`, y exige atajos de teclado en las pantallas de juego: si falla, seguí corrigiendo.

## Convenciones

- UI y textos didácticos en español rioplatense; términos de producción en inglés (swing, groove, stab, drop).
- Acordes en cifrado americano (`Am9`, `Fmaj7`), notas con octava científica (`C4` = MIDI 60).
- Commits y PRs en español, describiendo qué cambia para el jugador.
- Flujo: rama por feature, PR con CI verde. Nunca push directo a `main`.

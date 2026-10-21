---
name: nuevo-minijuego
description: Crea el andamiaje de un minijuego o modo nuevo de OFFBEAT (scoring en game-core con tests, esquema de target en content, niveles, pantalla en apps/web con la identidad visual, tarjeta DAW, exportación MIDI y e2e). Usar al empezar un minijuego o un modo nuevo de uno existente.
---

# Nuevo minijuego o modo

Leé primero la sección del minijuego en `docs/diseno.md` §2 y confirmá el modo (por ejemplo `deep-chords/one-chord-stab`). Si el modo es parte de un juego existente, vive en el mismo recorrido (`TRACKS`).

1. **Teoría (`packages/theory`)**, si el modo necesita cálculos musicales nuevos: funciones puras con tests y al menos una propiedad con fast-check (transposición, notas dentro de la escala).
2. **Puntuación (`packages/game-core/src/<modo>.ts`)**
   - Función pura que devuelve `{ score: 0–1, ...detalle }` con el detalle que la pantalla va a mostrar (qué estuvo bien y qué no).
   - Tests: referencia exacta = 1, los errores típicos quedan debajo del umbral que van a usar los niveles.
   - Exportala desde `src/index.ts`.
3. **Esquema (`packages/content/src/schema.ts`)**: `<Modo>Target` con Zod, conectado en el `superRefine` de `Level` (por `game` y, si hace falta, por `mode`). Exportalo desde el index del paquete.
4. **Validador (`tools/content-validate/check.ts`)**: que la respuesta esté entre las opciones que ve el jugador, que la teoría sea correcta y que el nivel se pueda pasar. Sumá tests en `check.test.ts`.
5. **Niveles** en `packages/content/levels/<venue>-<capítulo>-<modo>-<nn>.json`, con `nn` siguiendo la numeración del recorrido. Curva: el primero sale en un intento y cada nivel cambia una sola variable. Corré `pnpm content:validate`.
6. **Tarjeta DAW** con la skill `tarjeta-daw` y `dawCard` en cada nivel.
7. **Pantalla (`apps/web/src/games/<juego>/<Modo>.tsx`)**, siguiendo `docs/identidad-visual.md`:
   - `GameHeader` arriba, módulos `section`, bloque `.result` con `Stars`, `ExportMidi` y `DawCard` al final;
   - solo `AudioEngine`, nunca `tone`; colores solo con tokens (`--venue`, `--ok`, `--fn-t`…);
   - atajos de teclado para todo (Espacio, Enter, Esc y los propios del modo), visibles con `kbd`.
8. **Registro**: `MODE_LABELS` en `apps/web/src/levels.ts`, la ruta en `App.tsx` y, si es un juego nuevo, su entrada en `TRACKS` con `accent` y `tagline`.
9. **E2E** en `e2e/<modo>.spec.ts`: jugar el primer nivel de punta a punta solo con teclado y verificar que no haya `pageerror`.
10. Cerrá con `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`, ROADMAP y la skill `publicar-link-jugable`. Si hay dudas de diseño, pedí revisión a los agentes `game-designer` y `director-de-arte`.

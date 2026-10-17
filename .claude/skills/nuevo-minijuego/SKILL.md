---
name: nuevo-minijuego
description: Crea el andamiaje de un minijuego o modo nuevo de OFFBEAT (scoring en game-core con tests, esquema de target en content, nivel de ejemplo y pantalla en apps/web). Usar al empezar Groove Lab, Deep Chords, Key Shift, Bassline Duel o un modo nuevo de alguno.
---

# Nuevo minijuego o modo

Leé primero la sección del minijuego en `docs/diseno.md` §2 y confirmá el modo (por ejemplo `deep-chords/voice-leading`).

1. **Puntuación (`packages/game-core/src/<juego>.ts`)**
   - Función pura `score<Modo>(target, jugada, opciones)` que devuelve `{ score: 0–1, ...detalle }`.
   - Tests primero en `<juego>.test.ts`: referencia exacta = 1, casos de error típicos, y al menos una propiedad con fast-check (por ejemplo invariancia a transposición).
   - Exportala desde `src/index.ts`.
2. **Esquema (`packages/content/src/schema.ts`)**
   - Agregá `<Juego>Target` con Zod y conectalo en el `superRefine` de `Level`.
   - Si el target tiene datos musicales verificables, sumá la verificación en `tools/content-validate/check.ts` con su test.
3. **Nivel de ejemplo** en `packages/content/levels/<id>.json` (el nombre del archivo es el `id`). El hook PostToolUse lo valida al guardarlo.
4. **Pantalla (`apps/web/src/games/<juego>/`)**
   - Usá los componentes de `@offbeat/ui-grid` y la interfaz `AudioEngine`; nunca `tone` directo.
   - Estado del flujo (intro → jugando → resultado) explícito; feedback inmediato sobre el beat.
5. **E2E**: un test en `e2e/` que juegue el nivel de ejemplo de punta a punta.
6. Revisá contra los pilares de diseño (§1): ¿suena bien desde el segundo uno?, ¿el feedback es inmediato?, ¿deja algo exportable? Si hay dudas, pedile revisión al subagente `game-designer`.

# OFFBEAT: teoría musical para productores de house

> Documento de diseño de juego y propuesta técnica. Versión 1 (17/10/2026).
> Público objetivo: productores principiantes e intermedios de Minimal House, Deep House y Deep Tech que trabajan en un DAW (Ableton Live, FL Studio, Logic, Bitwig) y nunca estudiaron teoría "de conservatorio".
>
> **Plataforma (decisión del 17/10/2026): solo PC.** La app corre en el navegador de escritorio y se diseña para teclado, mouse y controladores MIDI. Lo que este documento dice sobre mobile (§4.3, F4) queda solo como referencia.

**Índice**

1. [Visión general y core loop](#1-visión-general-y-core-loop)
2. [Minijuegos](#2-minijuegos)
3. [Progresión didáctica](#3-progresión-didáctica)
4. [Arquitectura y stack tecnológico](#4-arquitectura-y-stack-tecnológico)
5. [Fases del proyecto](#5-fases-del-proyecto)
6. [Desarrollo con Claude Code: CLAUDE.md, skills, subagentes, hooks y automatizaciones](#6-desarrollo-con-claude-code)
7. [Referencias: código abierto, material libre y datasets](#7-referencias)
8. [Riesgos y decisiones abiertas](#8-riesgos-y-decisiones-abiertas)

---

## 1. Visión general y core loop

### Título

**OFFBEAT** (el hi-hat abierto en el contratiempo es el ADN del house; también juega con "aprender fuera del camino clásico").

Alternativas: *Deep Theory*, *Groove School*, *Minimal Key*, *After Hours Academy*.

### Pilares de diseño

1. **Sonido antes que símbolo.** Nunca se muestra un pentagrama por defecto. La notación principal es el **piano roll** y el **step sequencer**, exactamente lo que el productor ve en su DAW. El pentagrama es un "skin" opcional desbloqueable.
2. **Todo suena bien desde el segundo uno.** Cada ejercicio corre sobre un loop de house real (kick 4/4, hats, bajo, pad) a 120–126 BPM. Jugar es producir.
3. **Lo que aprendés se exporta.** Cada logro deja un artefacto utilizable: un clip MIDI, un patrón de groove, una progresión. El jugador termina con una "carpeta de ideas" para su DAW.
4. **Feedback de pista de baile, no de examen.** En lugar de "correcto/incorrecto" hay un **medidor de energía de la pista** (crowd energy) que sube o baja con la calidad del groove, la tensión armónica y la coherencia con la tonalidad.
5. **Sesiones cortas, profundidad infinita.** Una "sesión" dura 5 a 10 minutos (un *set* de 3 tracks); el modo sandbox no tiene techo.

### Fantasía del jugador

Sos un productor que empieza en su habitación y termina tocando el *closing set* de un club. La progresión del mundo es una **carrera de productor**: Bedroom → Warehouse → Club → Label → Festival. Cada "venue" es un capítulo didáctico con su propia paleta sonora (bedroom: 808 y Rhodes lo-fi; warehouse: 909 crudo y stabs; club: pads de Juno, bajos sub; label: deep tech con FM y percusión minimal).

### Core loop (por sesión)

```
   ┌──────────────────────────────────────────────────────────────┐
   │  1. DIG   → elegís un "track" del crate (reto del día / mapa) │
   │  2. PLAY  → minijuego (groove, acordes, escalas, bajo)        │
   │  3. MIX   → el resultado entra a tu Studio como stem          │
   │  4. DROP  → el set suena entero; la pista reacciona (energía) │
   │  5. EARN  → vinilos (moneda), XP de concepto, samples nuevos  │
   │  6. EXPORT→ el clip MIDI va a tu carpeta de ideas / DAW       │
   └───────────────────────────── vuelve a 1 ─────────────────────┘
```

- **Micro-loop (segundos):** escuchar → actuar en el grid → oír el resultado inmediatamente sobre el beat → ajustar. Es el mismo loop que hacer música en un DAW, por eso engancha.
- **Loop de sesión (minutos):** 3 retos forman un *set*. Al terminarlo se reproduce un mini-arreglo con todo lo que construiste (tu groove + tus acordes + tu bajo). Ese "drop" final es la recompensa emocional.
- **Meta-loop (días/semanas):** subir de venue, desbloquear sound packs, escalas y modos; repaso espaciado de lo aprendido; reto diario compartido ("Daily Dig") con semilla común para comparar resultados.

### Economía y desbloqueos

| Recurso | Cómo se gana | Para qué sirve |
|---|---|---|
| **XP de concepto** (por tema: ritmo, intervalos, escalas, acordes, función, arreglo) | Completar retos de ese tema | Abre niveles del árbol didáctico (mastery gating, ver §3) |
| **Vinilos** (moneda blanda) | Retos, rachas, Daily Dig | Sound packs, skins de UI (estética Juno, TR, MPC), pentagrama opcional |
| **Stems** | Cada reto completado | Material para el Studio (sandbox) y exportación MIDI |
| **Crowd energy récord** | Rejugar con más precisión/creatividad | Rankings por track, "remixes" de otros jugadores |

Nada didáctico se desbloquea con dinero: la monetización (si la hay) es cosmética o de contenido sonoro.

### Estética e interfaz

- UI oscura tipo DAW, tipografía monoespaciada en datos, colores que codifican **función armónica** (tónica, subdominante, dominante, notas de color) de forma consistente en todos los minijuegos.
- El piano roll resalta las filas "dentro de la escala" (como el *Scale Mode* de Ableton Live 12 o el *scale highlighting* de FL Studio), así el jugador aprende la misma pista visual que usará después.
- Luces del club reactivas al audio (análisis FFT en tiempo real) que suben con la energía.
- Háptica en mobile en cada golpe de kick durante los retos de ritmo.
- Accesibilidad: paleta apta para daltonismo (formas además de colores), modo sin animaciones, todos los retos auditivos con alternativa visual opcional para aprendizaje inicial.

---

## 2. Minijuegos

Los cuatro minijuegos comparten el mismo motor (transporte, grid, banco de sonidos) y el mismo sistema de puntuación por **crowd energy**. Cada uno tiene modos que se desbloquean con la progresión.

### 2.1 GROOVE LAB: ritmo, swing y micro-timing

**Concepto.** Un step sequencer de 16 pasos (expandible a 32/64 y a resolución de 1/32 o *ticks*) con kick, clap, hat cerrado, hat abierto, shaker, rim y perc. El jugador no "aprende figuras", aprende **por qué un groove se mueve**.

**Modos:**

1. **Recreate (dictado rítmico).** Suena un loop de 1 o 2 compases. Hay que reconstruirlo en el grid. Empieza con kick + hat offbeat; termina con percusiones minimal sincopadas en 3 contra 4.
2. **Fix the Groove.** El loop está "rígido" (todo cuantizado, velocidades iguales). El jugador tiene tres perillas y un grid de velocidades: **swing %** (50–75, estilo MPC), **nudge** de microtiming por voz (±20 ms) y **velocity** por paso. El objetivo es igualar un groove de referencia humanizado. Se enseña: swing en 1/16, *ghost notes*, acentos, empujar el hat medio *tick* adelante, "laid back" del clap.
3. **Polymeter Puzzle (exclusivo minimal).** Cada pista puede tener largo distinto (16, 12, 7, 5 pasos). El jugador debe encontrar combinaciones que realineen en N compases y generen la "evolución sin cambiar nada" típica del minimal (Ricardo Villalobos, Raresh, etc.). Puntuación por variedad percibida y por resolución en el compás 4/8/16.
4. **Tap Battle.** Ritmo en vivo con pads (pantalla táctil, teclado o controlador MIDI). Previa **calibración de latencia** (ver §4.4).

**Puntuación.**

- Por cada nota esperada: `precisión = max(0, 1 − |Δt| / ventana)`, con ventana de 30 ms (fácil) a 10 ms (experto).
- Velocity: error cuadrático medio normalizado contra la referencia.
- Penalización por notas extra, bonificación por "variación válida" en modo libre (si el patrón mantiene la densidad y la sincopa dentro del estilo).
- El crowd energy integra precisión + "groove-feel" (índice de sincopa y microtiming medio).

**Material de referencia.** El [Groove MIDI Dataset](https://magenta.tensorflow.org/datasets/groove) (13,6 h de batería humana con microtiming, licencia CC BY 4.0) sirve para extraer plantillas de humanización reales; [GrooVAE](https://magenta.tensorflow.org/groovae) muestra cómo "humanizar" un patrón cuantizado, útil para generar referencias infinitas.

**Transferencia al DAW.** Cada reto termina con una tarjeta "Hacelo en tu DAW": Groove Pool de Ableton, swing del channel rack en FL, Groove Templates en Logic, "groove" de Bitwig.

### 2.2 DEEP CHORDS: progresiones de Deep House

**Concepto.** Un piano roll de acordes con "chord pads" (8 pads, como un Akai MPK o el modo acordes de Push). Debajo, un bajo automático que sigue la raíz y un groove de house fijo. El jugador construye progresiones de 2 a 4 acordes de 1–2 compases cada uno.

**Modos:**

1. **Stack the Chord.** Se pide un acorde por sonido y nombre ("Am9 cálido, tipo Larry Heard"). El jugador apila notas en el piano roll. El juego muestra en vivo qué acorde formó (tríada → 7ª → 9ª → 11ª) y cómo cambia el color. Enseña construcción por terceras, extensiones, *omit 5*.
2. **Voice Leading Puzzle.** Dada una progresión (p. ej. `Am9 → Dm9 → Fmaj7 → Em7`), cada voz es un "carril". El jugador debe elegir inversiones para que el movimiento total sea mínimo y todo quede en la **zona de pads** (C3–C5). Puntuación = suma de semitonos movidos (óptimo calculado por fuerza bruta de permutaciones, ≤ 5 voces) + bonus por notas comunes retenidas. Es el truco que separa un pad "amateur" de uno profesional.
3. **Mood Board.** Se da un *brief* ("melancólico pero bailable, 4 compases, en La menor dórico") y el jugador arma la progresión con libertad. Un evaluador puntúa coherencia funcional, tensión/resolución y si encaja en el modo. Progresiones típicas que el juego enseña y reconoce: vamp de 2 acordes `i9 → iv9`, dórico `i7 → IV7`, `i → VII → VI → VII`, `ii9 → V9sus → Imaj9`, préstamo modal `iv` menor en mayor.
4. **One-Chord Stab (Detroit / deep tech).** El jugador elige UN acorde (m7, m9, m11, sus) y lo transpone en paralelo por el teclado, como se hace al samplear un stab. El juego explica la diferencia entre **movimiento diatónico** (las notas cambian de calidad) y **movimiento paralelo** (todo el acorde se transpone, cromatismos incluidos) y por qué este último es tan house. Se juega con un rítmico de stab en offbeat.

**Feedback visual.** Cada acorde se colorea por función (tónica / predominante / dominante / color). Un "medidor de tensión" muestra cuánto pide resolver el compás siguiente.

**Transferencia al DAW.** Exportar la progresión como `.mid` (4 u 8 compases, con inversiones elegidas); tarjeta sobre MIDI effects de acordes (Chord en Live, Scaler, Cthulhu) y cuándo NO usarlos.

### 2.3 KEY SHIFT: escalas y oído dinámico

**Concepto.** El reto realista: en producción la tonalidad cambia (un breakdown en el relativo mayor, un mode swap de eólico a dórico para levantar, un DJ que mezcla a otra tonalidad). KEY SHIFT entrena el **oído funcional** (sentir el centro tonal) y la **conciencia de escala** en el piano roll, con cambios en tiempo real.

**Mecánica central: el "Scale Lock".** Suena un loop. Abajo hay un piano roll vacío. El jugador "pinta" filas para marcar la escala que cree que suena. Las notas del bajo y del lead que caen fuera de su marcado **chocan visualmente** (vibran y se tiñen). Cuando acierta la escala, el piano roll se ilumina y desbloquea un lead para tocar encima.

**Modos:**

1. **Find the Root (oído funcional).** Drone o pad en la tónica + notas sueltas; el jugador indica el grado (1–7) con su "sensación" (método funcional, similar al *Functional Ear Trainer*). Es la base de todo.
2. **Mode Swap.** El loop cambia de modo sin cambiar de tónica (La eólico → La dórico → La frigio). El jugador debe detectar el cambio en el momento (ventana de 2 compases) y marcar qué nota cambió (la 6ª en dórico, la 2ª en frigio). Esto es directamente aplicable a deep tech, donde el frigio y el dórico son muy comunes.
3. **Modulation Run (modo arcade).** Un track de 3 minutos con 4–8 cambios de centro tonal y modo. El jugador va "repintando" la escala sobre la marcha; el combo multiplica puntos. La dificultad sube con modulaciones menos obvias (relativo, paralelo, por acorde pivote, por tono).
4. **Harmonic Mixing (DJ).** Dos tracks en cubiertas; el jugador elige qué track siguiente "mezcla en tonalidad" usando la rueda de Camelot y luego tiene que verificarlo de oído (hacer el blend con el crossfader y juzgar choque). Enseña relativos, quintas y por qué 8A → 9A funciona.

**Motor de evaluación.** La escala "verdadera" se conoce porque el contenido está etiquetado; para modos libres o loops subidos por el usuario se usa el algoritmo de perfiles de Krumhansl–Schmuckler sobre un histograma de *pitch classes* ponderado por duración.

**Dinamismo.** La dificultad es adaptativa: un modelo tipo Elo (o IRT de 1 parámetro) por concepto ajusta qué modos, qué distancia de modulación y qué densidad de notas aparecen.

**Transferencia al DAW.** Activar Scale Mode en Live 12, "Scale" en el piano roll de FL o el *Scale Quantize* de Logic; tarjeta sobre cómo transponer un proyecto entero para encajar con el vocal.

### 2.4 BASSLINE DUEL: intervalos, melodía y call & response

**Concepto.** Un "duelo" con un sinte: la máquina toca una frase de bajo o un riff de lead de 1 compás (call) y el jugador responde reproduciéndola en el piano roll o en teclado/pads (response). Es dictado melódico, pero con material de house real: bajos de raíz + octava, quintas, notas de paso cromáticas, offbeat bass de Deep House, riffs de *acid* de 303.

**Progresión interna:**

1. Solo raíz y octava (el clásico bajo de house con octavas).
2. Raíz, quinta, octava; luego tercera menor y séptima (pentatónica menor).
3. Notas de aproximación cromática y slides (glide de 303).
4. Riffs de 2 compases con respuesta propia: el jugador debe **contestar** (no copiar) con una frase que resuelva a la tónica; se evalúa con reglas de resolución y coherencia con la escala activa.

**Intervalos "de productor".** En vez de enseñar "segunda menor, tercera mayor..." en abstracto, cada intervalo se asocia a un uso de producción: octava = sub vs mid bass; quinta = power stab; tercera menor = carácter del pad; segunda menor = tensión de deep tech; tritono = sirena/FX.

**Transferencia al DAW.** Exportar el bajo como MIDI con glide/slide (portamento) y la tarjeta sobre *legato* y *glide* en Operator, Serum, Vital, TB-3 / ABL3.

### 2.5 (Bonus) PHRASE DETECTIVE: arreglo y estructura

Escuchar un track completo e identificar dónde entra o sale cada elemento, ubicar la frase de 8/16/32 compases, marcar breakdown, build y drop. Enseña por qué los cambios ocurren en múltiplos de 8 compases y conecta con el DJing. Ideal como capítulo de "Label" (nivel avanzado).

### 2.6 Modo STUDIO (sandbox)

Todo lo que el jugador gana (grooves, progresiones, bajos) aparece en un arreglador simple de 4 a 8 pistas. Ahí puede combinar, re-armonizar y exportar todo como un paquete MIDI multipista. Es el puente explícito entre "juego" y "DAW".

---

## 3. Progresión didáctica

### Principios pedagógicos

- **Sonido → práctica → nombre.** Primero se escucha y se manipula, recién después se nombra el concepto (inspirado en Orff/Kodály y en *Learning Music* de Ableton).
- **Mastery gating.** Un nodo del árbol se desbloquea cuando el anterior supera un umbral de dominio (p. ej. 80 % de aciertos sostenidos en 2 sesiones), no por tiempo jugado.
- **Repetición espaciada.** Los conceptos dominados vuelven como "repasos" en el Daily Dig, programados con FSRS ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), MIT).
- **Interleaving.** Una sesión mezcla minijuegos de temas distintos para fijar mejor el aprendizaje.
- **Siempre aplicable.** Cada nodo termina con un "Apply" que el jugador hace en su DAW real (checklist, opcionalmente subiendo el MIDI o un audio corto para que el juego lo valide).

### Estructura de cada lección (nodo)

1. **Hook (20 s):** un fragmento de track que muestra el concepto en acción.
2. **Learn (60–90 s):** micro-lección interactiva, sin texto largo; se toca el grid.
3. **Play:** el minijuego con el concepto aislado.
4. **Remix:** el mismo concepto mezclado con lo anterior.
5. **Apply:** tarjeta DAW-específica.
6. **Review:** entra en el sistema de repetición espaciada.

### Árbol de capítulos

| # | Venue | Conceptos | Minijuegos | Aplicación en el DAW |
|---|---|---|---|---|
| 0 | **Bedroom** | Pulso, BPM (120–126), compás 4/4, subdivisiones (1/4, 1/8, 1/16), grid, cuantización | Groove Lab: Recreate | Fijar BPM, grid y quantize; programar el primer 4/4 |
| 1 | **Bedroom** | Offbeat, contratiempo, síncopa, swing, velocity, ghost notes | Groove Lab: Fix the Groove, Tap Battle | Groove Pool / swing global; editar velocities |
| 2 | **Warehouse** | Notas, semitonos, octavas, nombres en el piano roll, número de nota MIDI | Bassline Duel 1 | Escribir el bajo de octavas en el piano roll |
| 3 | **Warehouse** | Intervalos "de productor", pentatónica menor, menor natural | Bassline Duel 2, Key Shift: Find the Root | Activar scale mode; escribir un riff en escala |
| 4 | **Club** | Tríadas, séptimas, novenas, inversiones, voicings en zona de pads | Deep Chords: Stack, Voice Leading | Programar un pad Am9–Dm9 con buen voice leading |
| 5 | **Club** | Funciones (i, iv, v, VI, VII), tensión y resolución, progresiones típicas | Deep Chords: Mood Board | Construir loop de 8 compases con progresión propia |
| 6 | **Label** | Modos (dórico, frigio, mixolidio), mode swap, préstamo modal, acordes paralelos | Key Shift: Mode Swap; Deep Chords: One-Chord Stab | Stab transpuesto en paralelo; breakdown en el relativo |
| 7 | **Label** | Modulación, acorde pivote, armonía para DJ (Camelot) | Key Shift: Modulation Run, Harmonic Mixing | Etiquetar la tonalidad de las propias pistas y armar un set armónico |
| 8 | **Festival** | Polimetría, evolución minimal, frase y arreglo (8/16/32), tensión a largo plazo | Groove Lab: Polymeter, Phrase Detective, Studio | Arreglar un track completo a partir de un loop de 8 compases |

Al final del capítulo 5 el jugador puede escribir loops completos de deep house con teoría consciente; al final del 8 entiende arreglo, modos y mezcla armónica. El pentagrama, el cifrado americano completo y la teoría clásica (cadencias, contrapunto) quedan como **ramas opcionales** para quien quiera profundizar.

### Medición del aprendizaje

- Pre-test y post-test por capítulo (ítems de oído y de grid) para medir ganancia real, no solo engagement.
- Telemetría por ítem para calibrar dificultad (IRT) y detectar ejercicios ambiguos.
- Métrica norte: **% de jugadores que exporta y usa en su DAW al menos un MIDI por semana**.

---

## 4. Arquitectura y stack tecnológico

### 4.1 Requisitos técnicos clave

- **Timing sample-accurate** del transporte (sin jitter perceptible a 125 BPM, 1/16 = 120 ms).
- **Latencia de entrada** baja y compensada (tap, MIDI, pantalla táctil).
- **Reproducción de samples** con pre-decodificación y polifonía de drum machine + pad + bajo + lead.
- **UI a 60 fps** con grids grandes (piano roll de 8 octavas × 64 pasos) mientras suena el audio.
- **Offline-first** (estudiar en el colectivo o el avión) y progresos sincronizables.
- **MIDI in/out** (controladores) y **exportación .mid**.

### 4.2 Recomendación: TypeScript web-first, empaquetado para mobile y desktop

**Por qué web-first:** la Web Audio API con `AudioWorklet` es madura, los mejores proyectos open source de música interactiva son web (Strudel, BeepBox, Signal, Chrome Music Lab), y el ciclo de iteración (y de trabajo con Claude Code + Playwright) es mucho más rápido.

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** estricto | Un solo lenguaje para teoría, motor, juego y UI |
| Monorepo | **pnpm workspaces + Turborepo** | Paquetes compartidos entre web y mobile |
| Web app | **Vite + React** (alternativa: SvelteKit) | Ecosistema, compatibilidad con React Native |
| Transporte y síntesis | **[Tone.js](https://tonejs.github.io/)** (MIT) | Transport con *lookahead scheduling*, Sampler, PolySynth, efectos |
| DSP propio | **AudioWorklet** (TS o Rust → WASM) | Synth de bajo/303, medidores, análisis sin bloquear el main thread |
| Teoría | **[tonal](https://github.com/tonaljs/tonal)** (MIT) | Escalas, acordes, intervalos, detección de acordes, modos |
| Render de grids | **Canvas 2D / [PixiJS](https://pixijs.com/)** (WebGL, MIT) | Piano roll y secuenciador a 60 fps; el DOM no escala |
| Estado | **Zustand** (estado UI) + **XState** (máquinas de estado de cada minijuego) | Flujos de juego explícitos y testeables |
| Persistencia local | **IndexedDB vía Dexie** | Offline-first, progresos y stems |
| MIDI | **Web MIDI API** + [webmidi.js](https://webmidijs.org/) (Apache-2.0); exportación con [@tonejs/midi](https://github.com/Tonejs/Midi) (MIT) | Controladores y `.mid` |
| Repetición espaciada | **ts-fsrs** | Algoritmo moderno de repaso |
| Animación de UI | **Rive** o Framer Motion | Personajes/club/feedback |
| Backend (opcional, fase 4+) | **Supabase** (Auth, Postgres, Storage) | Cuentas, rankings, Daily Dig, sync |
| Analítica | **PostHog** (self-host posible) | Embudos y calibración de dificultad |
| Tests | **Vitest** + **fast-check** (property-based), **Playwright**, `OfflineAudioContext` | Ver §4.6 |

### 4.3 Mobile y desktop: tres caminos (referencia; el proyecto es solo PC)

| Opción | Cómo | Pros | Contras | Cuándo |
|---|---|---|---|---|
| **A. Capacitor** (PWA empaquetada) | Mismo código web dentro de WebView | Un solo código, lo más rápido de lanzar | Latencia de audio en Android WebView más alta e irregular; Web MIDI ausente en iOS | MVP mobile y validación |
| **B. React Native + Expo + [react-native-audio-api](https://docs.swmansion.com/react-native-audio-api/)** (Software Mansion) | UI nativa en RN; el motor de audio usa una API compatible con Web Audio implementada en C++ nativo | Reutiliza `theory`, `game-core` y gran parte del motor; latencia nativa; Skia para grids | Dos capas de UI (web y RN); librería joven, verificar paridad de nodos | **Recomendado** para la app mobile "seria" |
| **C. Flutter + [flutter_soloud](https://pub.dev/packages/flutter_soloud)** | Motor SoLoud en C++ vía FFI | Muy buena latencia, un código para iOS/Android/desktop | Se pierde el código TS; secuenciación y teoría hay que rehacerlas en Dart | Si se prefiere Dart y mobile primero |
| (Desktop) **Tauri** | Web app en ventana nativa | Binario chico, acceso a MIDI del sistema | Webview según SO | Versión para el estudio del productor |

**Alternativa "máximo rendimiento":** un núcleo de audio en **Rust** (o C++ con JUCE) compilado a WASM para web y a nativo para mobile (Oboe en Android, Core Audio / AVAudioEngine en iOS). Es el camino de apps como las de Ableton o Korg, pero multiplica el costo. Solo se justifica si la versión B no alcanza la latencia objetivo.

**Decisión tomada:** solo PC. Web en navegador de escritorio, con empaquetado opcional en Tauri si hace falta una app instalable. Sin mobile. Para que eso funcione, el motor de audio se escribe contra una **interfaz propia** (`AudioEngine`) y no contra Tone.js directamente en la UI.

### 4.4 Audio: decisiones finas que importan

- **Nunca** temporizar audio con `setTimeout`/`setInterval`/`requestAnimationFrame`. Se usa *lookahead scheduling* contra `AudioContext.currentTime` (el patrón de "[A Tale of Two Clocks](https://web.dev/articles/audio-scheduling)"); Tone.Transport ya lo implementa.
- La UI **lee** la posición del transporte (`Tone.getDraw()` / cola de eventos) y dibuja; nunca la dispara.
- **Calibración de latencia** al primer uso: test de tap sobre un clic + lectura de `outputLatency` y `baseLatency`. Se guarda el offset por dispositivo y se aplica a la evaluación de taps.
- **Samples:** pre-decodificados a `AudioBuffer` al entrar a un venue; packs empaquetados por venue y cacheados con Service Worker. Formatos: Opus/WebM con fallback AAC (Safari). Normalización de pico y recorte de silencio en el pipeline de assets.
- **Batería sintetizada siempre que se pueda** (kick, clap, hats estilo 909/808 sintetizados con osciladores y ruido): cero problemas de licencia, cero peso de descarga, y además se puede enseñar *sound design* después.
- **AudioWorklet sin basura:** en el hilo de audio no se crean objetos; buffers preasignados; comunicación con `SharedArrayBuffer` + ring buffer ([ringbuf.js](https://github.com/padenot/ringbuf.js)) cuando haya que mandar datos de análisis a la UI (requiere cabeceras COOP/COEP).
- **Desbloqueo de audio en iOS:** `AudioContext.resume()` en el primer gesto del usuario; pantalla "Tap to start the night".

### 4.5 Estructura del monorepo

```
offbeat/
├── apps/
│   ├── web/                 # Vite + React (PWA)
│   ├── mobile/              # Expo + react-native-audio-api (fase 4)
│   └── desktop/             # Tauri (opcional)
├── packages/
│   ├── theory/              # Teoría pura: escalas, acordes, voice leading, key finding (sin audio, sin DOM)
│   ├── audio-engine/        # Interfaz AudioEngine + implementación Web (Tone.js + worklets)
│   ├── game-core/           # Máquinas de estado (XState), scoring, crowd energy, IRT/Elo, FSRS
│   ├── ui-grid/             # Piano roll y step sequencer (Canvas/Pixi), compartidos
│   ├── content/             # Niveles, lecciones, progresiones en JSON + esquemas Zod
│   └── midi/                # Import/export .mid, Web MIDI
├── assets/
│   ├── samples/             # Fuentes de samples + LICENSES por pack
│   └── packs/               # Salida procesada (generada, no editar a mano)
├── tools/
│   ├── sample-pipeline/     # ffmpeg: recorte, normalización, transcode, manifiesto
│   ├── content-validate/    # Valida esquemas + verifica teoría (usa packages/theory)
│   └── latency-lab/         # Página de test de latencia + script Playwright
├── .claude/                 # skills, agentes, hooks (ver §6)
├── CLAUDE.md
└── ROADMAP.md
```

**Regla de dependencias:** `theory` no depende de nada; `game-core` depende de `theory`; `audio-engine` no conoce el juego; la UI depende de todos. Se refuerza con `dependency-cruiser` en CI.

### 4.6 Contenido como datos

Todos los niveles se describen en JSON validado por Zod. Esto permite generar y revisar contenido con Claude Code a escala y verificar la teoría automáticamente.

```ts
// packages/content/schema/level.ts (borrador)
export const Level = z.object({
  id: z.string(),                       // "club-04-voice-leading-03"
  chapter: z.number().int().min(0).max(8),
  game: z.enum(["groove-lab", "deep-chords", "key-shift", "bassline-duel", "phrase-detective"]),
  mode: z.string(),                     // "voice-leading"
  bpm: z.number().min(110).max(130),
  key: z.object({ tonic: z.string(), mode: z.string() }),   // { tonic: "A", mode: "dorian" }
  concepts: z.array(z.string()),        // ["inversions", "minor9"]
  soundPack: z.string(),                // "club-juno"
  target: z.unknown(),                  // específico por modo: patrón, progresión, escala por compás...
  scoring: z.object({ windowMs: z.number().optional(), threshold: z.number() }),
  dawCard: z.string().optional(),       // id de la tarjeta "Hacelo en tu DAW"
});
```

Ejemplo de `target` para Deep Chords:

```json
{
  "progression": ["Am9", "Dm9", "Fmaj7", "Em7"],
  "barsPerChord": 2,
  "voicingRange": ["C3", "C5"],
  "optimalCost": 7
}
```

`content-validate` recalcula con `tonal` que cada acorde exista, que las notas estén en el rango, que `optimalCost` coincida con el cálculo de voice leading, y que la escala declarada contenga las notas del bajo. Si algo no coincide, falla el CI (y el hook de Claude Code, ver §6).

### 4.7 Estrategia de testing

- **Unit + property-based** (`theory`, `game-core`): por ejemplo "transponer una progresión no cambia su costo de voice leading", "toda escala tiene 12 rotaciones válidas", "la puntuación de groove es 1 con el patrón de referencia exacto".
- **Render offline de audio:** con `OfflineAudioContext` se renderiza un compás y se verifican onsets (±1 ms) y niveles. Así el CI detecta regresiones de timing sin escuchar.
- **E2E con Playwright:** flujos completos de cada minijuego, con audio en modo "headless" y reloj controlado.
- **Regresión visual** del piano roll y del secuenciador (snapshots de Playwright).
- **Latency lab** en dispositivos reales (manual + BrowserStack/Firebase Test Lab en fase 4).

---

## 5. Fases del proyecto

El tamaño es relativo (S, M, L), no una estimación de tiempo.

| Fase | Objetivo | Entregables | Criterio de salida | Tamaño |
|---|---|---|---|---|
| **F0. Fundaciones** | Tener el esqueleto y la tubería de calidad | Monorepo, CLAUDE.md, hooks y skills (§6), CI (lint, typecheck, Vitest, Playwright), página *latency-lab*, spike de transporte con Tone.js + piano roll Canvas | El spike corre un loop 4/4 sin jitter y el piano roll a 60 fps con 512 notas | S |
| **F1. Vertical slice** | Probar que es divertido | Groove Lab completo (Recreate + Fix the Groove), crowd energy, 10 niveles del capítulo 0–1, progreso local | 5 productores lo juegan y quieren repetir (test de juego grabado) | M |
| **F2. Núcleo didáctico** | Cubrir capítulos 0–5 | Deep Chords, Key Shift (Find the Root, Mode Swap), Bassline Duel 1–2, lecciones Learn, FSRS, tarjetas DAW (Live/FL/Logic/Bitwig), exportación MIDI | Pre/post-test muestra ganancia en ≥ 70 % de testers | L |
| **F3. Meta-juego** | Retención | Mapa de venues, vinilos, sound packs, Studio (sandbox), Daily Dig con semilla, rachas | Retención D7 en beta cerrado | M |
| **F4. Desktop y online** | App de escritorio completa | Controladores MIDI (Web MIDI), app instalable con Tauri (opcional), Supabase (cuentas, sync, rankings) | Latencia de tap compensada < 20 ms en Chrome, Edge, Firefox y Safari de escritorio | L |
| **F5. Contenido avanzado** | Capítulos 6–8 | Modos, modulación, Harmonic Mixing, Polymeter, Phrase Detective | Árbol completo jugable | L |
| **F6. Lanzamiento y comunidad** | Crecer | Remixes de semillas de otros, niveles creados por usuarios (UGC con el mismo esquema JSON), tutor con IA | Lanzamiento público | M |

### Mejoras posteriores (backlog de ideas)

- **Tutor con Claude API:** explica por qué tu progresión funciona, sugiere un voicing mejor, genera retos a medida de tus errores frecuentes. La salida del modelo se valida siempre contra `packages/theory` antes de mostrarse.
- **"Analiza mi loop":** el usuario sube un audio corto; [basic-pitch](https://github.com/spotify/basic-pitch) (Apache-2.0) lo pasa a MIDI y el juego detecta tonalidad, acordes y groove, y propone ejercicios sobre su propia música.
- **Ableton Link** en la versión nativa para sincronizar con el DAW o con otros dispositivos.
- **Soporte de controladores** (Launchpad, Push, MPK) con mapeos preconfigurados.
- **Modo multijugador** "B2B": dos jugadores alternan 8 compases y la pista vota.
- **Pentagrama y cifrado clásico** como rama opcional para quien quiera leer partitura.

---

## 6. Desarrollo con Claude Code

Formato y eventos verificados en la documentación oficial: [hooks](https://code.claude.com/docs/en/hooks), [skills](https://code.claude.com/docs/en/skills), [subagentes](https://code.claude.com/docs/en/sub-agents).

### 6.1 Flujo de trabajo recomendado

1. **Issue → plan.** Cada feature empieza como issue en GitHub. En Claude Code se arranca en *plan mode* para que proponga el diseño antes de tocar código.
2. **Worktrees en paralelo.** Cada minijuego vive en su rama/worktree; varias sesiones de Claude Code trabajan en paralelo sin pisarse (por ejemplo, una en `deep-chords` y otra en `key-shift`).
3. **TDD primero en `theory` y `game-core`.** Se le pide a Claude que escriba los tests (incluidos property-based) antes que la implementación.
4. **Hooks como red de seguridad** (formatear, validar contenido, prohibir antipatrones de audio, correr tests antes de terminar).
5. **PR con revisión automática** (subagentes + GitHub Action de Claude Code) y revisión humana final.
6. **Rutinas programadas** para tareas recurrentes (contenido, dependencias, auditorías).

### 6.2 CLAUDE.md (borrador)

```markdown
# OFFBEAT

App lúdico-didáctica de teoría musical para productores de house. Ver docs/diseno.md.

## Reglas de arquitectura
- packages/theory es puro: sin audio, sin DOM, sin dependencias de juego. Todo con tests.
- Nunca temporizar audio con setTimeout/setInterval/rAF. Usar el scheduler de audio-engine.
- La UI no importa Tone.js directamente: solo la interfaz AudioEngine.
- En AudioWorklets: sin asignaciones en process(), buffers preasignados.
- Todo contenido nuevo va en packages/content como JSON y debe pasar `pnpm content:validate`.
- Samples: solo con licencia compatible (CC0, CC BY con atribución, propios). Cada pack tiene LICENSE.md.

## Comandos
- pnpm dev | pnpm test | pnpm test:e2e | pnpm content:validate | pnpm assets:build

## Vocabulario
- Notación por defecto: piano roll; nombres en cifrado americano (Am9, Fmaj7).
- UI en español rioplatense con i18n (es, en). Términos de producción en inglés (swing, groove, stab).
```

### 6.3 Skills del proyecto (`.claude/skills/<nombre>/SKILL.md`)

| Skill | Qué hace | Cuándo se usa |
|---|---|---|
| `nuevo-minijuego` | Genera el andamiaje: máquina XState, función de scoring con tests, componente UI sobre `ui-grid`, esquema de `target` en `content`, ruta y entrada de menú | Al empezar cada minijuego o modo |
| `crear-niveles` | A partir de un concepto y capítulo, genera N niveles JSON con dificultad creciente, corre `content:validate` y renderiza una preview de audio offline | Producción de contenido |
| `verificar-teoria` | Recalcula con `tonal` acordes, escalas, intervalos y costos declarados en contenido o lecciones, y reporta diferencias | Antes de mergear contenido o textos didácticos |
| `tarjeta-daw` | Escribe la tarjeta "Hacelo en tu DAW" para Live, FL, Logic y Bitwig siguiendo una plantilla fija | Al cerrar cada nodo didáctico |
| `sample-pack` | Pipeline de samples: recorte, normalización, transcode Opus/AAC, manifiesto, verificación de licencia y atribuciones | Al agregar sonidos |
| `auditoria-latencia` | Levanta `latency-lab` con Playwright, mide jitter del transporte y frames de UI, y compara con el baseline | Después de tocar `audio-engine` o `ui-grid` |
| `balance-dificultad` | Lee una exportación de telemetría, ajusta parámetros IRT/Elo por ítem y marca ítems ambiguos | En beta, periódicamente |

Ejemplo:

```markdown
---
name: verificar-teoria
description: Verifica la corrección musical de niveles, lecciones y textos didácticos recalculando acordes, escalas e intervalos con packages/theory. Usar al crear o modificar contenido en packages/content o docs/lecciones.
---

1. Identifica los archivos de contenido modificados (git diff --name-only).
2. Para cada uno, corre `pnpm tsx tools/content-validate/check.ts <archivo>`.
3. Para texto libre (lecciones), extrae cada afirmación musical concreta ("Am9 = A C E G B")
   y verifícala con `pnpm tsx tools/content-validate/assert.ts "<afirmación>"`.
4. Reporta una tabla: archivo, afirmación, esperado, obtenido. No corrijas sin mostrar la diferencia.
```

### 6.4 Subagentes (`.claude/agents/`)

- **`revisor-teoria`** (solo lectura): revisa PRs de contenido y lecciones buscando errores musicales y explicaciones confusas para alguien sin formación.
- **`revisor-audio`**: busca antipatrones de tiempo real (timers, asignaciones en worklets, decodificación en caliente, nodos que no se desconectan, fugas de `AudioNode`).
- **`game-designer`**: critica un modo nuevo contra los pilares (§1): ¿suena bien desde el segundo uno?, ¿el feedback es inmediato?, ¿se exporta algo útil?
- **`accesibilidad`**: contraste, daltonismo, navegación por teclado, alternativas a la información solo auditiva.

### 6.5 Hooks (`.claude/settings.json`)

| Evento | Matcher | Acción | Efecto |
|---|---|---|---|
| `SessionStart` | — | `pnpm install --frozen-lockfile` si falta `node_modules`; imprime la fase actual de `ROADMAP.md` | Sesiones (también en la nube) listas para testear |
| `UserPromptSubmit` | — | Inyecta el glosario y la fase activa como contexto | Claude usa el vocabulario del proyecto |
| `PreToolUse` | `Edit\|Write` | Si el archivo está en `packages/audio-engine` y el contenido nuevo usa `setTimeout`/`setInterval`, sale con código 2 y explica por qué | Bloquea el antipatrón número uno del audio web |
| `PreToolUse` | `Write` | Si se escribe en `assets/samples/**` sin `LICENSE.md` en el pack, bloquea | Ningún sample sin licencia |
| `PreToolUse` | `Bash` | Bloquea `rm -rf assets`, `git push --force` a `main` | Protección de assets y ramas |
| `PostToolUse` | `Edit\|Write` | Formatea con Biome/Prettier el archivo; si es `.ts`, typecheck del paquete afectado | Código consistente siempre |
| `PostToolUse` | `Edit\|Write` | Si el archivo es de `packages/content`, corre `content:validate` sobre él; si falla, sale con 2 y devuelve el error a Claude | La teoría incorrecta no sobrevive a la edición |
| `Stop` | — | Corre `vitest related` sobre los archivos cambiados; si falla, sale con 2 para que Claude siga corrigiendo | Claude no "termina" con tests rotos |
| `Notification` | — | Notificación de escritorio | Avisa cuando Claude espera input |

Borrador de configuración:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "bash .claude/hooks/session-start.sh" }] }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/guard-audio-timers.mjs" }]
      },
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/guard-bash.mjs" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/format-and-typecheck.mjs" },
          { "type": "command", "command": "node .claude/hooks/validate-content.mjs" }
        ]
      }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/related-tests.mjs" }] }
    ]
  }
}
```

Esqueleto de un hook (reciben JSON por stdin; código de salida 2 bloquea y el stderr vuelve a Claude):

```js
// .claude/hooks/guard-audio-timers.mjs
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { tool_input } = JSON.parse(input);
const path = tool_input.file_path ?? "";
const text = tool_input.content ?? tool_input.new_string ?? "";
if (path.includes("packages/audio-engine/") && /\bset(Timeout|Interval)\s*\(/.test(text)) {
  console.error(
    "No uses setTimeout/setInterval en audio-engine: programa eventos con el scheduler " +
    "(lookahead sobre AudioContext.currentTime). Ver CLAUDE.md > Reglas de arquitectura."
  );
  process.exit(2);
}
```

### 6.6 MCP y automatizaciones

- **Playwright MCP:** Claude abre la app, juega un nivel, toma capturas y verifica la UI; clave para iterar en el piano roll.
- **GitHub (MCP o `gh`):** issues, PRs, revisión.
- **Figma MCP** (si se diseña en Figma): pasar componentes del sistema visual a código.
- **GitHub Actions:**
  - CI: lint, typecheck, Vitest, render offline de audio, Playwright, tamaño de bundle, Lighthouse PWA.
  - [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action): revisión automática de PRs con los subagentes de §6.4 y respuesta a `@claude` en issues.
  - Validación de licencias de samples y de dependencias (bloquear AGPL en el bundle si la app no es AGPL).
- **Rutinas programadas (Claude Code):**
  - Semanal: generar un lote de niveles del capítulo en curso con `crear-niveles` y abrir PR para revisión.
  - Semanal: actualizar dependencias y correr `auditoria-latencia`.
  - Diaria (beta): resumen de telemetría con ítems problemáticos para `balance-dificultad`.
- **Renovate/Dependabot** para dependencias.

---

## 7. Referencias

> Licencias según lo publicado por cada proyecto; confirmar en su repositorio antes de integrar código o assets.

### 7.1 Código abierto para estudiar o usar

| Proyecto | Para qué sirve aquí | Licencia |
|---|---|---|
| [Tone.js](https://github.com/Tonejs/Tone.js) | Transporte, scheduling, Sampler, síntesis | MIT |
| [tonal](https://github.com/tonaljs/tonal) | Teoría: escalas, acordes, detección, modos | MIT |
| [@tonejs/midi](https://github.com/Tonejs/Midi) | Leer/escribir `.mid` | MIT |
| [Strudel](https://strudel.cc/) ([código en Codeberg](https://codeberg.org/uzu/strudel)) | Patrones rítmicos (port de TidalCycles), referencia de scheduling y de packs de samples | AGPL-3.0 (inspiración, no copiar en app cerrada) |
| [Signal](https://signalmidi.app/) ([código](https://github.com/ryohey/signal)) | Editor MIDI web con piano roll: referencia de render e interacción | MIT |
| [BeepBox](https://github.com/johnnesky/beepbox) | Secuenciador web liviano; ideas de UX de grid y síntesis compacta | MIT |
| [Chrome Music Lab](https://github.com/googlecreativelab/chrome-music-lab) | Experimentos didácticos (Rhythm, Chords, Song Maker) | Apache-2.0 |
| [webaudio-pianoroll](https://github.com/g200kg/webaudio-pianoroll) | Componente de piano roll simple | Ver repositorio |
| [Magenta.js](https://github.com/magenta/magenta-js) | Modelos de música (GrooVAE, MusicVAE) en el navegador | Apache-2.0 |
| [basic-pitch](https://github.com/spotify/basic-pitch) | Audio → MIDI para "Analiza mi loop" | Apache-2.0 |
| [Essentia.js](https://github.com/MTG/essentia.js) | Análisis de audio (tonalidad, BPM, onsets) | AGPL-3.0 |
| [pitchy](https://github.com/ianprime0509/pitchy) | Detección de altura (cantar/silbar el bajo) | MIT |
| [webmidi.js](https://webmidijs.org/) | Controladores MIDI en web | Apache-2.0 |
| [ringbuf.js](https://github.com/padenot/ringbuf.js) | Comunicación lock-free con AudioWorklet | MPL-2.0 |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | Repetición espaciada | MIT |
| [PixiJS](https://pixijs.com/) | Render WebGL de grids y visuales | MIT |
| [react-native-audio-api](https://docs.swmansion.com/react-native-audio-api/) | Web Audio API en React Native | MIT |
| [flutter_soloud](https://pub.dev/packages/flutter_soloud) | Audio de baja latencia en Flutter | MIT |
| [Oboe](https://github.com/google/oboe) / [AudioKit](https://github.com/AudioKit/AudioKit) | Audio nativo Android / iOS si se va a full nativo | Apache-2.0 / MIT |
| [Elementary Audio](https://www.elementary.audio/) | DSP declarativo en JS (web y nativo) | MIT |
| [JUCE](https://github.com/juce-framework/JUCE) | Núcleo C++ si se va a "máximo rendimiento" | AGPLv3 o comercial |

### 7.2 Material didáctico libre o gratuito

- [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/) (Gotham et al.): libro abierto completo; base para verificar contenidos. Licencia Creative Commons (revisar la variante de la edición que se use).
- [Ableton Learning Music](https://learningmusic.ableton.com/) y [Learning Synths](https://learningsynths.ableton.com/): el mejor ejemplo de "teoría desde el grid"; gratuito, no de licencia libre (solo inspiración).
- [musictheory.net](https://www.musictheory.net/): ejercicios clásicos; referencia de qué NO hacer en tono, útil como checklist de conceptos.
- "A Tale of Two Clocks" ([web.dev](https://web.dev/articles/audio-scheduling)): la lectura obligatoria sobre scheduling de audio web.
- [Documentación de Web Audio en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) y de [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet).

### 7.3 Samples y datasets

| Recurso | Uso | Licencia / condición |
|---|---|---|
| Síntesis propia (kick, clap, hats 808/909 sintetizados) | Batería base | Propia |
| [VCSL, Versilian Community Sample Library](https://github.com/sgossner/VCSL) | Pianos, Rhodes-like, percusión | CC0 |
| [Freesound](https://freesound.org/) (filtrar por CC0) | Percusión, texturas, FX | CC0 o CC BY según el sonido |
| Packs de drum machines de la comunidad Tidal/Strudel ([guía de samples de Strudel](https://strudel.cc/learn/samples/)) | Referencia de packs de máquinas clásicas | Revisar origen; muchas son grabaciones de hardware con licencia dudosa: **no redistribuir sin verificar** |
| [Groove MIDI Dataset](https://magenta.tensorflow.org/datasets/groove) | Plantillas de groove y humanización | CC BY 4.0 |
| SampleRadar de MusicRadar y similares | Uso en producciones propias | *Royalty-free* para producir, **no para redistribuir** dentro de una app |

---

## 8. Riesgos y decisiones abiertas

| Riesgo | Mitigación |
|---|---|
| Latencia de audio y de tap en Android/WebView | Calibración por dispositivo, ventanas de evaluación adaptativas, migración a React Native + audio nativo en F4 |
| Que el juego sea "una app de ejercicios con skin de DJ" | Vertical slice en F1 con test de juego real antes de producir contenido masivo; pilar "suena bien desde el segundo uno" |
| Errores de teoría en contenido generado | `content:validate` + hook PostToolUse + skill `verificar-teoria` + subagente `revisor-teoria` + revisión humana |
| Licencias de samples y de dependencias copyleft | Síntesis propia, CC0 por defecto, LICENSE por pack, chequeo de licencias en CI |
| Alcance demasiado grande | Fases con criterio de salida; capítulos 6–8 recién en F5 |

**Decisiones que conviene tomar pronto:**

1. React o Svelte para la web (recomendado: React, por la reutilización con React Native).
2. Idioma de la UI en el lanzamiento (recomendado: español e inglés desde F2 con i18n desde el día uno).
3. Modelo de negocio (gratuito con packs cosméticos, suscripción, o pago único).
4. Nombre definitivo y dominio.

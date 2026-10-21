# Identidad visual: "hardware nocturno"

OFFBEAT se ve como un equipo de estudio en una sala oscura. El chasis es negro cálido, la serigrafía es crema y los datos aparecen en mono, como en un display. El color se usa como señal (LEDs, notas, lo que está activo), nunca como decoración.

## Tipografía

- **Archivo Variable** (OFL) para todo el texto. Los títulos van en mayúsculas, condensados (`font-stretch: 72%`) y con peso 850.
- **JetBrains Mono Variable** (OFL) para datos, etiquetas de serigrafía (`.eyebrow`, `h2`) y teclas (`kbd`).
- Las dos se empaquetan con `@fontsource-variable`, así que funcionan offline y sin pedir nada a Google Fonts.

## Color

| Token | Uso |
|---|---|
| `--bg`, `--panel`, `--panel-2`, `--panel-3` | Chasis y módulos, del más hundido al más elevado |
| `--line`, `--line-2` | Bordes |
| `--text`, `--muted`, `--faint` | Serigrafía en tres niveles |
| `--venue` | Color del recorrido (lo setea `App` desde `TRACKS[].accent`): botones primarios, notas, foco |
| `--ok`, `--ko`, `--warn` | Acierto, error, estrellas |
| `--fn-t`, `--fn-pd`, `--fn-d` | Tónica, predominante y dominante, en todas las pantallas de armonía |

Cada venue tiene su color: Bedroom ámbar (`#f5b45a`), Warehouse naranja (`#ff6a3d`), Club violeta (`#c38bff`) y Label cian (`#4fd8e6`). Para Festival queda reservado un lima (`#c6f432`).

## Reglas

- Una pantalla nueva arranca con `GameHeader`, va en módulos `section` y cierra con el bloque `.result` y `DawCard`.
- Los puntajes se muestran con `Stars` (tres LEDs). No se usan estrellas de texto ni emojis.
- Todo lo que se puede apretar muestra su atajo con `kbd`.
- Nada depende del hover, porque se juega con teclado: cada control tiene `:focus-visible`.
- Las animaciones son solo visuales (CSS) y respetan `prefers-reduced-motion`. El audio nunca se temporiza con la UI.
- Si un color nuevo depende de `--venue`, se declara en el bloque `*` de `styles.css` para que cada elemento lo calcule con el venue que hereda.

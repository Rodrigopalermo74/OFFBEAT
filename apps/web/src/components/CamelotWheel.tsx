import { camelotCode, camelotOf, keyOfCamelot, type MixKey, mixKeyName } from "@offbeat/theory";

interface CamelotWheelProps {
  /** Tonalidad de la cubierta A. */
  home: MixKey;
  /** Tonalidad cargada en la cubierta B, si hay. */
  cued?: MixKey | null;
  /** Tonalidades a marcar como candidatas. */
  marked?: readonly MixKey[];
  /** Mostrar qué casilleros mezclan con la A (después de responder). */
  reveal?: boolean;
}

const C = 160;
const RINGS = { B: [150, 104], A: [104, 60] } as const;

function point(r: number, deg: number): string {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${(C + r * Math.cos(rad)).toFixed(2)} ${(C + r * Math.sin(rad)).toFixed(2)}`;
}

/** Sector de corona entre los radios `outer` e `inner`, centrado en `deg`. */
function sector(outer: number, inner: number, deg: number): string {
  const a0 = deg - 15;
  const a1 = deg + 15;
  return `M ${point(outer, a0)} A ${outer} ${outer} 0 0 1 ${point(outer, a1)} L ${point(inner, a1)} A ${inner} ${inner} 0 0 0 ${point(inner, a0)} Z`;
}

const sameKey = (a: MixKey | null | undefined, b: MixKey) => !!a && camelotCode(a) === camelotCode(b);

/** Rueda de Camelot: afuera las mayores (B), adentro las menores (A); el 12 arriba y una quinta por casillero. */
export function CamelotWheel({ home, cued, marked = [], reveal = false }: CamelotWheelProps) {
  const h = camelotOf(home);
  const cells = (["B", "A"] as const).flatMap((letter) =>
    Array.from({ length: 12 }, (_, i) => {
      const number = i + 1;
      const key = keyOfCamelot({ number, letter });
      const steps = Math.min((number - h.number + 12) % 12, (h.number - number + 12) % 12);
      const mixes = (letter === h.letter && steps <= 1) || (letter !== h.letter && steps === 0);
      const state = [
        sameKey(home, key) && "is-home",
        sameKey(cued, key) && "is-cued",
        marked.some((m) => sameKey(m, key)) && "is-marked",
        reveal && mixes && "is-mix",
      ]
        .filter(Boolean)
        .join(" ");
      return { letter, number, key, state };
    }),
  );
  return (
    <svg
      className="camelot"
      viewBox="0 0 320 320"
      role="img"
      aria-label={`Rueda de Camelot con ${mixKeyName(home)} marcada`}
    >
      {cells.map(({ letter, number, key, state }) => {
        const [outer, inner] = RINGS[letter];
        const deg = (number % 12) * 30;
        const [x, y] = point((outer + inner) / 2, deg).split(" ");
        return (
          <g key={`${number}${letter}`} className={`camelot__cell ${state}`}>
            <path d={sector(outer, inner, deg)} />
            <text x={x} y={Number(y) - 3} className="camelot__code">
              {number}
              {letter}
            </text>
            <text x={x} y={Number(y) + 10} className="camelot__key">
              {mixKeyName(key)}
            </text>
          </g>
        );
      })}
      <text x={C} y={C - 4} className="camelot__center">
        {camelotCode(home)}
      </text>
      <text x={C} y={C + 14} className="camelot__center-key">
        {mixKeyName(home)}
      </text>
    </svg>
  );
}

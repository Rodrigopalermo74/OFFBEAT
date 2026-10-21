import { type DawCard as Card, DAWS, parseDawCard } from "@offbeat/content";
import { useEffect, useRef, useState } from "react";

const files = import.meta.glob("../../../../packages/content/daw-cards/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Tarjetas por id (nombre del archivo), parseadas al cargar. */
const CARDS: Record<string, Card> = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.split("/").pop()?.replace(/\.md$/, ""), parseDawCard(text)]),
);

const DAW_KEY = "offbeat.daw.v1";

function loadDaw(): string {
  try {
    return localStorage.getItem(DAW_KEY) ?? DAWS[0];
  } catch {
    return DAWS[0];
  }
}

/** "Hacelo en tu DAW": cómo llevar lo del nivel a Ableton, FL, Logic o Bitwig. Tecla D para abrir y cerrar. */
export function DawCard({ id }: { id?: string }) {
  const card = id ? CARDS[id] : undefined;
  const [daw, setDaw] = useState(loadDaw);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "d" || e.key === "D") && !e.ctrlKey && !e.metaKey && ref.current) {
        ref.current.open = !ref.current.open;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!card) return null;
  const pick = (name: string) => {
    setDaw(name);
    try {
      localStorage.setItem(DAW_KEY, name);
    } catch {
      // Sin storage: la elección dura lo que dure la pestaña.
    }
  };
  const steps = card.daws.find((d) => d.name === daw) ?? card.daws[0];

  return (
    <details ref={ref} className="daw-card" data-testid="daw-card">
      <summary>
        Hacelo en tu DAW · {card.title} <kbd>D</kbd>
      </summary>
      <p>{card.intro}</p>
      <div className="segmented" role="tablist" aria-label="DAW">
        {card.daws.map((d) => (
          <button
            key={d.name}
            type="button"
            role="tab"
            aria-selected={d.name === steps?.name}
            className={d.name === steps?.name ? "is-active" : ""}
            onClick={() => pick(d.name)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <ol>
        {steps?.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>
        <strong>Reto:</strong> {card.challenge}
      </p>
      <p className="hint">
        Desde el link de HOUSEGAME, "Exportar MIDI" baja un .zip: descomprimilo y arrastrá el .mid a tu DAW.
      </p>
    </details>
  );
}

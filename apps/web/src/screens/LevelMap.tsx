import { type Results, stars } from "@offbeat/game-core";
import { CHAPTER_TITLES, type GrooveLevel, MODE_LABELS } from "../levels.ts";

interface LevelMapProps {
  levels: GrooveLevel[];
  results: Results;
  unlocked: Set<string>;
  onPlay(id: string): void;
  onStudio(): void;
}

export function LevelMap({ levels, results, unlocked, onPlay, onStudio }: LevelMapProps) {
  const chapters = [...new Set(levels.map((l) => l.chapter))];
  return (
    <main className="app">
      <header className="transport">
        <h1>OFFBEAT</h1>
        <span className="meta">Bedroom · Groove Lab</span>
        <button type="button" className="ghost push-right" onClick={onStudio}>
          Studio (sandbox)
        </button>
      </header>
      {chapters.map((chapter) => (
        <section key={chapter}>
          <h2>
            Capítulo {chapter} · {CHAPTER_TITLES[chapter] ?? ""}
          </h2>
          <ol className="level-grid">
            {levels
              .filter((l) => l.chapter === chapter)
              .map((level) => {
                const open = unlocked.has(level.id);
                const best = results[level.id] ?? 0;
                const earned = stars(best, level.threshold);
                return (
                  <li key={level.id}>
                    <button
                      type="button"
                      className="level-card"
                      disabled={!open}
                      onClick={() => onPlay(level.id)}
                      data-testid={`level-${level.id}`}
                    >
                      <span className="level-card__mode">{MODE_LABELS[level.mode] ?? level.mode}</span>
                      <span className="level-card__title">{level.title ?? level.id}</span>
                      <span
                        className="level-card__stars"
                        role="img"
                        aria-label={open ? `${earned} de 3 estrellas` : "Bloqueado"}
                      >
                        {open ? "★".repeat(earned) + "☆".repeat(3 - earned) : "🔒"}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </main>
  );
}

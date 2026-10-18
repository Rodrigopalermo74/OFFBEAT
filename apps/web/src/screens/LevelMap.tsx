import { type Results, stars } from "@offbeat/game-core";
import { CHAPTER_TITLES, MODE_LABELS, TRACKS } from "../levels.ts";

interface LevelMapProps {
  results: Results;
  unlocked: Set<string>;
  onPlay(id: string): void;
  onStudio(): void;
}

export function LevelMap({ results, unlocked, onPlay, onStudio }: LevelMapProps) {
  return (
    <main className="app">
      <header className="transport">
        <h1>OFFBEAT</h1>
        <button type="button" className="ghost push-right" onClick={onStudio}>
          Studio (sandbox)
        </button>
      </header>
      {TRACKS.map((track) => {
        const chapters = [...new Set(track.levels.map((l) => l.chapter))];
        return chapters.map((chapter) => (
          <section key={`${track.game}-${chapter}`} data-testid={`track-${track.game}`}>
            <h2>
              {track.title} · {track.venue} · Capítulo {chapter} · {CHAPTER_TITLES[chapter] ?? ""}
            </h2>
            <ol className="level-grid">
              {track.levels
                .filter((l) => l.chapter === chapter)
                .map((level) => {
                  const open = unlocked.has(level.id);
                  const earned = stars(results[level.id] ?? 0, level.threshold);
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
        ));
      })}
    </main>
  );
}

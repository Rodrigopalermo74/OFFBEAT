import { type Results, stars } from "@offbeat/game-core";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import { Logo } from "../components/Logo.tsx";
import { Stars } from "../components/Stars.tsx";
import { CHAPTER_TITLES, MODE_LABELS, TRACKS } from "../levels.ts";

interface LevelMapProps {
  results: Results;
  unlocked: Set<string>;
  onPlay(id: string): void;
  onStudio(): void;
}

export function LevelMap({ results, unlocked, onPlay, onStudio }: LevelMapProps) {
  // El próximo nivel de cada recorrido: el primero desbloqueado que todavía no pasaste.
  const next = TRACKS.map(
    (track) => track.levels.find((l) => unlocked.has(l.id) && (results[l.id] ?? 0) < l.threshold) ?? null,
  );
  const earned = TRACKS.flatMap((t) => t.levels).reduce((sum, l) => sum + stars(results[l.id] ?? 0, l.threshold), 0);
  const total = TRACKS.reduce((sum, t) => sum + t.levels.length, 0) * 3;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const level = next[Number(e.key) - 1];
      if (level && /^[1-4]$/.test(e.key)) onPlay(level.id);
      else if (e.key === "s" || e.key === "S") onStudio();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onPlay, onStudio]);

  return (
    <main className="app app--wide">
      <header className="map-header">
        <Logo />
        <div className="map-header__stats">
          <span className="eyebrow">Tu carrera</span>
          <span className="readout">
            {earned}
            <small>/{total} ★</small>
          </span>
        </div>
        <button type="button" className="ghost" onClick={onStudio}>
          Studio <kbd>S</kbd>
        </button>
      </header>

      <div className="tracks">
        {TRACKS.map((track, t) => {
          const chapters = [...new Set(track.levels.map((l) => l.chapter))];
          const passed = track.levels.filter((l) => (results[l.id] ?? 0) >= l.threshold).length;
          const upNext = next[t];
          return (
            <section
              key={track.game}
              className="track"
              style={{ "--venue": track.accent } as CSSProperties}
              data-testid={`track-${track.game}`}
            >
              <header className="track__head">
                <div>
                  <span className="eyebrow">{track.venue}</span>
                  <h2 className="track__title">{track.title}</h2>
                  <p className="track__tagline">{track.tagline}</p>
                </div>
                <div className="track__progress">
                  <span className="readout">
                    {passed}
                    <small>/{track.levels.length}</small>
                  </span>
                  <span className="meter meter--thin" aria-hidden="true">
                    <span className="meter__fill" style={{ width: `${(passed / track.levels.length) * 100}%` }} />
                  </span>
                </div>
              </header>

              {upNext ? (
                <button type="button" className="up-next" onClick={() => onPlay(upNext.id)}>
                  <span className="eyebrow">Seguí por acá</span>
                  <strong>{upNext.title ?? upNext.id}</strong>
                  <kbd>{t + 1}</kbd>
                </button>
              ) : (
                <p className="up-next up-next--done">
                  Recorrido completo. Volvé a cualquier nivel para mejorar tus estrellas.
                </p>
              )}

              {chapters.map((chapter) => (
                <div key={chapter} className="chapter">
                  <h3 className="chapter__title">
                    <span className="chapter__num">{String(chapter).padStart(2, "0")}</span>
                    {CHAPTER_TITLES[chapter] ?? ""}
                  </h3>
                  <ol className="level-grid">
                    {track.levels
                      .filter((l) => l.chapter === chapter)
                      .map((level) => {
                        const open = unlocked.has(level.id);
                        const score = results[level.id] ?? 0;
                        const isNext = upNext?.id === level.id;
                        return (
                          <li key={level.id}>
                            <button
                              type="button"
                              className={`level-card ${isNext ? "is-next" : ""} ${score >= level.threshold ? "is-done" : ""}`}
                              disabled={!open}
                              onClick={() => onPlay(level.id)}
                              data-testid={`level-${level.id}`}
                            >
                              <span className="level-card__mode">{MODE_LABELS[level.mode] ?? level.mode}</span>
                              <span className="level-card__title">{level.title ?? level.id}</span>
                              <Stars earned={stars(score, level.threshold)} locked={!open} />
                            </button>
                          </li>
                        );
                      })}
                  </ol>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      <p className="hint map-hint">
        <kbd>1</kbd>–<kbd>4</kbd> seguís el recorrido de cada juego · <kbd>S</kbd> abre el Studio · dentro de los
        juegos, <kbd>Espacio</kbd> play, <kbd>Enter</kbd> drop, <kbd>Esc</kbd> vuelve acá.
      </p>
    </main>
  );
}

import { MODE_LABELS, TRACK_THEME } from "../levels.ts";

interface GameHeaderProps {
  level: { game: string; mode: string; chapter: number; bpm: number; title?: string; brief?: string };
  best: number;
  onExit(): void;
  /** Tonalidad u otro dato del nivel para la línea de contexto ("A menor"). */
  detail?: string;
}

/** Cabecera común de los minijuegos: volver al mapa, contexto del nivel, título, mejor puntaje y consigna. */
export function GameHeader({ level, best, onExit, detail }: GameHeaderProps) {
  const theme = TRACK_THEME[level.game];
  return (
    <header className="game-header">
      <div className="game-header__bar">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa <kbd>Esc</kbd>
        </button>
        <p className="eyebrow">
          {theme ? `${theme.venue} · ${theme.title}` : ""} · {MODE_LABELS[level.mode] ?? level.mode} · Capítulo{" "}
          {level.chapter}
        </p>
        <dl className="readouts">
          <div>
            <dt>BPM</dt>
            <dd>{level.bpm}</dd>
          </div>
          {detail && (
            <div>
              <dt>Tono</dt>
              <dd>{detail}</dd>
            </div>
          )}
          <div>
            <dt>Mejor</dt>
            <dd>{Math.round(best * 100)}%</dd>
          </div>
        </dl>
      </div>
      <h1 className="level-title">{level.title}</h1>
      {level.brief && <p className="brief">{level.brief}</p>}
    </header>
  );
}

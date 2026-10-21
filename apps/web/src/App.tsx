import { ToneEngine } from "@offbeat/audio-engine";
import { type Results, recordResult, unlockedLevels } from "@offbeat/game-core";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Logo } from "./components/Logo.tsx";
import { BasslineDuel } from "./games/bassline-duel/BasslineDuel.tsx";
import { DeepChords } from "./games/deep-chords/DeepChords.tsx";
import { MoodBoard } from "./games/deep-chords/MoodBoard.tsx";
import { OneChordStab } from "./games/deep-chords/OneChordStab.tsx";
import { GrooveLab } from "./games/groove-lab/GrooveLab.tsx";
import { HarmonicMixing } from "./games/key-shift/HarmonicMixing.tsx";
import { KeyShift } from "./games/key-shift/KeyShift.tsx";
import {
  type BassLevel,
  type ChordLevel,
  type GrooveLevel,
  type KeyLevel,
  type MixLevel,
  type StabLevel,
  TRACKS,
} from "./levels.ts";
import { loadResults, saveResults } from "./progress.ts";
import { LevelMap } from "./screens/LevelMap.tsx";
import { Studio } from "./screens/Studio.tsx";

type Screen = { name: "map" } | { name: "level"; id: string } | { name: "studio" };

export function App() {
  const engine = useMemo(() => new ToneEngine(), []);
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "map" });
  const [results, setResults] = useState<Results>(loadResults);
  const unlocked = useMemo(
    () => new Set(TRACKS.flatMap((track) => [...unlockedLevels(track.levels, results)])),
    [results],
  );

  useEffect(() => () => engine.dispose(), [engine]);

  // En la portada, Enter arranca (es un gesto del usuario, así que también habilita el audio).
  useEffect(() => {
    if (started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const start = async () => {
    await engine.start();
    setStarted(true);
  };

  const finish = (id: string, score: number) => {
    setResults((prev) => {
      const next = recordResult(prev, id, score);
      saveResults(next);
      return next;
    });
  };

  if (!started) {
    return (
      <main className="splash">
        <Logo size="xl" animated />
        <p className="splash__tagline">Teoría musical para productores de minimal, deep house y deep tech.</p>
        <button type="button" className="primary primary--lg" onClick={start} data-testid="start">
          Empezar la sesión <kbd>Enter</kbd>
        </button>
        <p className="hint">Con auriculares o monitores. Todo se juega con teclado y mouse.</p>
      </main>
    );
  }

  if (screen.name === "studio") return <Studio engine={engine} onExit={() => setScreen({ name: "map" })} />;

  if (screen.name === "level") {
    const track = TRACKS.find((t) => t.levels.some((l) => l.id === screen.id));
    const index = track?.levels.findIndex((l) => l.id === screen.id) ?? -1;
    const level = track?.levels[index];
    if (level) {
      const next = track?.levels[index + 1];
      const common = {
        engine,
        best: results[level.id] ?? 0,
        onFinish: (score: number) => finish(level.id, score),
        onExit: () => setScreen({ name: "map" }),
        onNext: next ? () => setScreen({ name: "level", id: next.id }) : undefined,
      };
      const venue = { "--venue": track?.accent } as CSSProperties;
      const game = (() => {
        if (level.game === "deep-chords" && level.mode === "mood-board")
          return <MoodBoard key={level.id} level={level as ChordLevel} {...common} />;
        if (level.game === "deep-chords" && level.mode === "one-chord-stab")
          return <OneChordStab key={level.id} level={level as unknown as StabLevel} {...common} />;
        if (level.game === "deep-chords") return <DeepChords key={level.id} level={level as ChordLevel} {...common} />;
        if (level.game === "bassline-duel")
          return <BasslineDuel key={level.id} level={level as BassLevel} {...common} />;
        if (level.game === "key-shift" && level.mode === "harmonic-mixing")
          return <HarmonicMixing key={level.id} level={level as unknown as MixLevel} {...common} />;
        if (level.game === "key-shift") return <KeyShift key={level.id} level={level as KeyLevel} {...common} />;
        return <GrooveLab key={level.id} level={level as GrooveLevel} {...common} />;
      })();
      return (
        <div className="venue" style={venue}>
          {game}
        </div>
      );
    }
  }

  return (
    <LevelMap
      results={results}
      unlocked={unlocked}
      onPlay={(id) => setScreen({ name: "level", id })}
      onStudio={() => setScreen({ name: "studio" })}
    />
  );
}

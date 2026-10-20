import { ToneEngine } from "@offbeat/audio-engine";
import { type Results, recordResult, unlockedLevels } from "@offbeat/game-core";
import { useEffect, useMemo, useState } from "react";
import { BasslineDuel } from "./games/bassline-duel/BasslineDuel.tsx";
import { DeepChords } from "./games/deep-chords/DeepChords.tsx";
import { MoodBoard } from "./games/deep-chords/MoodBoard.tsx";
import { GrooveLab } from "./games/groove-lab/GrooveLab.tsx";
import { KeyShift } from "./games/key-shift/KeyShift.tsx";
import { type BassLevel, type ChordLevel, type GrooveLevel, type KeyLevel, TRACKS } from "./levels.ts";
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
        <h1>OFFBEAT</h1>
        <p>Teoría musical para productores de house.</p>
        <button type="button" className="primary" onClick={start} data-testid="start">
          Tap to start the night
        </button>
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
      if (level.game === "deep-chords" && level.mode === "mood-board")
        return <MoodBoard key={level.id} level={level as ChordLevel} {...common} />;
      if (level.game === "deep-chords") return <DeepChords key={level.id} level={level as ChordLevel} {...common} />;
      if (level.game === "bassline-duel") return <BasslineDuel key={level.id} level={level as BassLevel} {...common} />;
      if (level.game === "key-shift") return <KeyShift key={level.id} level={level as KeyLevel} {...common} />;
      return <GrooveLab key={level.id} level={level as GrooveLevel} {...common} />;
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

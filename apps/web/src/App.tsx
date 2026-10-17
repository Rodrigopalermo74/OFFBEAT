import { ToneEngine } from "@offbeat/audio-engine";
import { type Results, recordResult, unlockedLevels } from "@offbeat/game-core";
import { useEffect, useMemo, useState } from "react";
import { GrooveLab } from "./games/groove-lab/GrooveLab.tsx";
import { GROOVE_LEVELS } from "./levels.ts";
import { loadResults, saveResults } from "./progress.ts";
import { LevelMap } from "./screens/LevelMap.tsx";
import { Studio } from "./screens/Studio.tsx";

type Screen = { name: "map" } | { name: "level"; id: string } | { name: "studio" };

export function App() {
  const engine = useMemo(() => new ToneEngine(), []);
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "map" });
  const [results, setResults] = useState<Results>(loadResults);
  const unlocked = useMemo(() => unlockedLevels(GROOVE_LEVELS, results), [results]);

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
    const index = GROOVE_LEVELS.findIndex((l) => l.id === screen.id);
    const level = GROOVE_LEVELS[index];
    if (level) {
      const next = GROOVE_LEVELS[index + 1];
      return (
        <GrooveLab
          key={level.id}
          level={level}
          engine={engine}
          best={results[level.id] ?? 0}
          onFinish={(score) => finish(level.id, score)}
          onExit={() => setScreen({ name: "map" })}
          onNext={next ? () => setScreen({ name: "level", id: next.id }) : undefined}
        />
      );
    }
  }

  return (
    <LevelMap
      levels={GROOVE_LEVELS}
      results={results}
      unlocked={unlocked}
      onPlay={(id) => setScreen({ name: "level", id })}
      onStudio={() => setScreen({ name: "studio" })}
    />
  );
}

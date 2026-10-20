import type { MidiSong } from "@offbeat/midi";
import { useCallback, useEffect, useState } from "react";
import { type ExportResult, saveMidi } from "../exportMidi.ts";

interface ExportMidiProps {
  /** Nombre del archivo sin extensión. */
  name: string;
  /** Se llama recién al exportar, para tomar el estado actual. */
  song(): MidiSong;
  /** Si no hay nada que exportar, el botón queda deshabilitado. */
  isEmpty?: boolean;
}

const MESSAGES: Record<ExportResult, string> = {
  saved: "Listo: arrastralo a tu DAW.",
  declined: "No se guardó.",
  failed: "No se pudo exportar desde acá.",
};

/** Botón "Exportar MIDI" (tecla M): lo que armaste en el juego, listo para el DAW. */
export function ExportMidi({ name, song, isEmpty }: ExportMidiProps) {
  const [status, setStatus] = useState<ExportResult | null>(null);

  const run = useCallback(async () => {
    if (isEmpty) return;
    setStatus(await saveMidi(name, song()));
  }, [name, song, isEmpty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey) run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <span className="export">
      <button type="button" className="ghost" onClick={run} disabled={isEmpty} data-testid="export-midi">
        Exportar MIDI <kbd>M</kbd>
      </button>
      {status && (
        <span className="meta" role="status" data-testid="export-status">
          {MESSAGES[status]}
        </span>
      )}
    </span>
  );
}

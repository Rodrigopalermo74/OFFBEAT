import type { CSSProperties } from "react";

/** Marca de corrección sobre un paso: faltaba un golpe o sobraba. */
export type CellMark = "missed" | "extra";

export interface StepSequencerProps {
  voices: readonly string[];
  labels?: Record<string, string>;
  pattern: Record<string, number[]>;
  /** Paso que está sonando (o null si está detenido). */
  currentStep: number | null;
  onToggle(voice: string, step: number): void;
  /** Pasos que no se pueden tocar (por ejemplo, en Fix the Groove solo se editan los golpes existentes). */
  isDisabled?(voice: string, step: number): boolean;
  mark?(voice: string, step: number): CellMark | undefined;
}

/** Grid de 16 pasos. Pocos elementos, así que alcanza con DOM; el piano roll grande va en Canvas. */
export function StepSequencer({
  voices,
  labels,
  pattern,
  currentStep,
  onToggle,
  isDisabled,
  mark,
}: StepSequencerProps) {
  return (
    <fieldset className="step-seq" aria-label="Secuenciador por pasos">
      {voices.map((voice) => (
        <div className="step-seq__row" key={voice}>
          <span className="step-seq__label">{labels?.[voice] ?? voice}</span>
          {(pattern[voice] ?? []).map((velocity, step) => {
            const cellMark = mark?.(voice, step);
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: los pasos son posiciones fijas
                key={step}
                type="button"
                aria-pressed={velocity > 0}
                aria-label={`${labels?.[voice] ?? voice} paso ${step + 1}${velocity > 0 ? `, velocity ${Math.round(velocity * 100)}` : ""}${cellMark === "missed" ? ", faltaba" : cellMark === "extra" ? ", sobraba" : ""}`}
                data-testid={`step-${voice}-${step}`}
                disabled={isDisabled?.(voice, step)}
                style={{ "--vel": velocity } as CSSProperties}
                className={[
                  "step-seq__cell",
                  velocity > 0 ? "is-on" : "",
                  step % 4 === 0 ? "is-beat" : "",
                  currentStep === step ? "is-current" : "",
                  cellMark ? `is-${cellMark}` : "",
                ].join(" ")}
                onClick={() => onToggle(voice, step)}
              />
            );
          })}
        </div>
      ))}
    </fieldset>
  );
}

export interface StepSequencerProps {
  voices: readonly string[];
  labels?: Record<string, string>;
  pattern: Record<string, number[]>;
  /** Paso que está sonando (o null si está detenido). */
  currentStep: number | null;
  onToggle(voice: string, step: number): void;
}

/** Grid de 16 pasos. Pocos elementos, así que alcanza con DOM; el piano roll grande va en Canvas. */
export function StepSequencer({ voices, labels, pattern, currentStep, onToggle }: StepSequencerProps) {
  return (
    <fieldset className="step-seq" aria-label="Secuenciador por pasos">
      {voices.map((voice) => (
        <div className="step-seq__row" key={voice}>
          <span className="step-seq__label">{labels?.[voice] ?? voice}</span>
          {(pattern[voice] ?? []).map((velocity, step) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: los pasos son posiciones fijas
              key={step}
              type="button"
              aria-pressed={velocity > 0}
              aria-label={`${labels?.[voice] ?? voice} paso ${step + 1}`}
              data-testid={`step-${voice}-${step}`}
              className={[
                "step-seq__cell",
                velocity > 0 ? "is-on" : "",
                step % 4 === 0 ? "is-beat" : "",
                currentStep === step ? "is-current" : "",
              ].join(" ")}
              onClick={() => onToggle(voice, step)}
            />
          ))}
        </div>
      ))}
    </fieldset>
  );
}

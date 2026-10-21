/**
 * Marca de HOUSEGAME: el nombre sobre una tira de 16 pasos con los contratiempos encendidos
 * (los hats en 2, 6, 10 y 14 que le dan nombre al juego).
 */
export function Logo({ size = "md", animated = false }: { size?: "md" | "xl"; animated?: boolean }) {
  return (
    <div className={`logo logo--${size} ${animated ? "logo--animated" : ""}`}>
      <span className="logo__word">
        HOUSE<span>GAME</span>
      </span>
      <span className="logo__steps" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 16 pasos fijos
            key={i}
            className={`${i % 4 === 2 ? "is-on" : ""} ${i % 4 === 0 ? "is-beat" : ""}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </span>
    </div>
  );
}

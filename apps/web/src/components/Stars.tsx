/** Tres LEDs en vez de estrellas de texto: se leen de un vistazo y escalan bien. */
export function Stars({ earned, locked = false }: { earned: number; locked?: boolean }) {
  return (
    <span className="stars" role="img" aria-label={locked ? "Bloqueado" : `${earned} de 3 estrellas`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`led ${!locked && i < earned ? "is-on" : ""}`} />
      ))}
    </span>
  );
}

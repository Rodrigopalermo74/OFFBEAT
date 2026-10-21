---
name: publicar-link-jugable
description: Arma OFFBEAT en un solo HTML, lo prueba y lo publica en el link jugable de siempre. Usar después de mergear o abrir un PR que cambia lo que ve el jugador, o cuando piden "actualizá el link".
---

# Publicar el link jugable

El jugador prueba OFFBEAT desde un link de Claude (un artifact). El link es siempre el mismo y cada publicación es una versión nueva.

1. `pnpm build:single` arma `dist-single/offbeat.html` con el JS, el CSS y las fuentes adentro (solo los subsets latin y latin-ext). Falla si pasa de 1,5 MB.
2. `pnpm smoke:single` lo abre con Playwright, arranca, entra a un nivel de cada juego y verifica que no haya errores y que carguen Archivo y JetBrains Mono. En la nube exportá antes `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`.
3. Copiá el archivo al scratchpad de la sesión y publicalo con la herramienta Artifact:
   - mismo `file_path` que la publicación anterior de la sesión, o `url` del link si es otra sesión (leelo primero con `action: "read"`);
   - **siempre** `capabilities: {downloads: true}`: sin eso "Exportar MIDI" deja de andar en el link;
   - `label` corto con lo que cambió ("Suma One-Chord Stab");
   - sin `icon` en una republicación.
4. Avisale al jugador qué cambió y que el link es el mismo. Si algo no se pudo probar desde la nube (por ejemplo la ventana de descarga), decilo.

El link vigente está en la memoria del proyecto.

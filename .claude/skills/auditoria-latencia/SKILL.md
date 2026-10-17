---
name: auditoria-latencia
description: Mide el rendimiento del motor de audio y del piano roll de OFFBEAT (fps con 512 notas, latencia reportada por el AudioContext, errores en consola) con Playwright. Usar después de tocar packages/audio-engine o packages/ui-grid.
---

# Auditoría de latencia y rendimiento

1. Corré `pnpm test:e2e` (incluye el test de 512 notas). Si estás en una sesión en la nube con Chromium preinstalado, exportá `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`.
2. Para un reporte más fino, abrí la app con Playwright, apretá Start y Play, activá "Estrés: 512 notas" y registrá durante 10 s:
   - fps mostrados (`data-testid="fps"`);
   - latencia y lookahead del encabezado;
   - errores de consola y `pageerror`.
3. Compará con el último reporte en el PR o en `ROADMAP.md`. Una caída de más de 10 % en fps o cualquier error nuevo es regresión.
4. Recordá que headless no mide la latencia real de salida: los números de dispositivos reales se anotan a mano en `ROADMAP.md`.

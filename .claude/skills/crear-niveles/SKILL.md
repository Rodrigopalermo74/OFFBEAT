---
name: crear-niveles
description: Genera niveles JSON de HOUSEGAME para un concepto y capítulo dados, con dificultad creciente, y los valida musicalmente. Usar cuando haya que producir contenido nuevo en packages/content/levels.
---

# Crear niveles

Entrada: concepto (por ejemplo "inversiones"), capítulo (0–8), minijuego y modo, y cantidad.

1. Leé el capítulo en `docs/diseno.md` §3 para respetar qué conceptos ya conoce el jugador. No introduzcas conceptos de capítulos posteriores.
2. Mirá los niveles existentes del mismo modo (`packages/content/levels/`) para no repetir y para mantener el formato.
3. Diseñá la curva: el primero se resuelve en un intento; cada nivel cambia una sola variable (más voces, otra tonalidad, más pasos, ventana de timing más chica).
4. Para valores calculables (como `optimalCost`), no los estimes: calculalos con `packages/theory` (por ejemplo un script con `node --experimental-strip-types`).
5. Escribí cada archivo como `packages/content/levels/<id>.json`, con `id` = `<venue>-<capítulo 2 dígitos>-<modo>-<nn>`.
6. Corré `pnpm content:validate` y corregí hasta que todo pase.
7. Pasale los niveles al subagente `revisor-teoria` y resumí sus observaciones en el PR.

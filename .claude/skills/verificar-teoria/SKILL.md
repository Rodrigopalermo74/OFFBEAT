---
name: verificar-teoria
description: Verifica la corrección musical de niveles, lecciones y textos didácticos recalculando acordes, escalas e intervalos con packages/theory. Usar al crear o modificar contenido en packages/content o textos que afirman hechos de teoría musical.
---

# Verificar teoría

1. Listá los archivos tocados: `git diff --name-only origin/main...`.
2. Niveles JSON: `pnpm content:validate <archivos>`.
3. Textos (lecciones, tarjetas DAW, strings de UI): extraé cada afirmación concreta ("Am9 = A C E G B", "el dórico sube la sexta", "8A mezcla con 9A") y verificala con un script corto que use `@offbeat/theory` o `tonal` (por ejemplo `Chord.get("Am9").notes`, `Scale.get("A dorian").notes`).
4. Reportá una tabla: archivo, afirmación, esperado, obtenido. Corregí solo lo que esté mal y mostrá la diferencia.
5. Si una afirmación es de estilo o de práctica de producción (no verificable con código), marcala como "criterio" y dejala para revisión humana.

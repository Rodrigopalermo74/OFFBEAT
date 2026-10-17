---
name: sample-pack
description: Agrega un pack de samples a OFFBEAT verificando licencia, procesando el audio (recorte, normalización, Opus y AAC) y generando el manifiesto. Usar cuando haya que sumar sonidos que no se pueden sintetizar.
---

# Sample pack

1. Antes de nada, ¿se puede sintetizar? Kicks, claps, hats y pads básicos se hacen en `packages/audio-engine`. Solo usá samples para timbres que no salen con síntesis simple.
2. Licencia: solo CC0, CC BY (con atribución) o material propio. Nada de packs "royalty-free" que prohíben redistribución.
3. Creá `assets/samples/<pack>/LICENSE.md` primero (el hook bloquea agregar audio sin él) con: origen (URL), licencia, autor, fecha de descarga y atribución exacta.
4. Procesá con ffmpeg (no a mano):
   - recortar silencio inicial, normalizar a pico −1 dBFS, mono si el sonido no necesita estéreo;
   - exportar `.opus` (48 kHz) y `.m4a` (AAC, para Safari) a `assets/packs/<pack>/`.
5. Generá `assets/packs/<pack>/manifest.json` con nombre, nota raíz (si es tonal), duración y archivos.
6. Sumá la atribución al listado de créditos de la app.

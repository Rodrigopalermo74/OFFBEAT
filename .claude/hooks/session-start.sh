#!/usr/bin/env bash
# SessionStart: deja el repo listo para testear (también en sesiones en la nube) y recuerda la fase actual.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

if [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile >/dev/null 2>&1 || echo "Aviso: pnpm install falló; corré 'pnpm install' a mano."
fi

# Lo que se imprime acá entra como contexto de la sesión.
phase=$(grep -m1 -E '^## .*\(actual\)' ROADMAP.md 2>/dev/null || true)
echo "OFFBEAT · ${phase:-fase no marcada en ROADMAP.md}"
# La pila de PRs abiertos, para no tener que redescubrirla en cada sesión.
if command -v gh >/dev/null 2>&1; then
  prs=$(timeout 10 gh pr list --state open --limit 20 --json number,title,baseRefName \
    --template '{{range .}}  #{{.number}} {{.title}} (sobre {{.baseRefName}}){{"\n"}}{{end}}' 2>/dev/null || true)
  if [ -n "$prs" ]; then
    count=$(printf '%s\n' "$prs" | grep -c '#')
    echo "PRs abiertos ($count):"
    printf '%s\n' "$prs"
    [ "$count" -gt 4 ] && echo "Hay $count PRs apilados: proponé mergear los de abajo antes de abrir otro."
  fi
fi
echo "Antes de terminar: pnpm typecheck && pnpm test (el hook Stop lo verifica)."

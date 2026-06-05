#!/usr/bin/env bash
# Deploy Apps Script:
#   0) build:gas-artifacts (Tailwind + Cytoscape kg-lib-*.html; siempre, aunque no esté commiteado)
#   1) Embebe logo.png en gas/index.html (data URL).
#   2) clasp push + nueva versión (vendor/ ignorado vía .claspignore en raíz del repo).
#   3) clasp redeploy del webAppDeploymentId en gas/deploy.json (misma URL /exec).
#      Si no hay ID o redeploy falla, clasp deploy crea una implementación nueva y actualiza deploy.json.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ build:gas-artifacts (css + kg-vis)"
npm run build:gas-artifacts

CONFIG="$(node <<'NODE'
const fs = require('fs');
const clasp = JSON.parse(fs.readFileSync('.clasp.json', 'utf8'));
const deployPath = 'gas/deploy.json';
const deploy = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
process.stdout.write(
  [clasp.scriptId, deploy.webAppDeploymentId || '', deploy.workspaceDomain || ''].join('\n'),
);
NODE
)"

SCRIPT_ID="$(echo "$CONFIG" | sed -n '1p' | tr -d '\r')"
WEBAPP_DEPLOYMENT_ID="$(echo "$CONFIG" | sed -n '2p' | tr -d '\r')"
DOMAIN_FROM_CONFIG="$(echo "$CONFIG" | sed -n '3p' | tr -d '\r')"

DOMAIN="${DEPLOY_ENTERPRISE_DOMAIN:-$DOMAIN_FROM_CONFIG}"

VERSION_NOTE="${1:-deploy $(date -u +%Y-%m-%dT%H:%MZ)}"
DEPLOY_DESC="Aviators web app"

echo "→ embed-logo (logo.png → gas/index.html)"
node scripts/embed-logo.cjs

echo "→ clasp push"
clasp push --force

echo "→ clasp version \"${VERSION_NOTE}\""
VERS_LINE="$(clasp version "${VERSION_NOTE}" 2>&1)"
VERS="$(echo "$VERS_LINE" | sed -n 's/^Created version //p')"
if [[ -z "$VERS" ]]; then
  echo "" >&2
  echo "Deploy detenido: no se creó una versión nueva." >&2
  echo "$VERS_LINE" >&2
  if echo "$VERS_LINE" | grep -qi 'limit of 200 versions'; then
    echo "" >&2
    echo "El proyecto de Apps Script ya tiene 200 versiones (máximo de Google)." >&2
    echo "clasp push sí subió el código, pero la Web App sigue en la última versión publicada" >&2
    echo "hasta que borres versiones viejas y vuelvas a correr ./deploy." >&2
    echo "" >&2
    echo "En el editor: Implementar → Administrar implementaciones → icono de reloj / historial" >&2
    echo "→ eliminar versiones antiguas (dejar las más recientes y las que usan implementaciones activas)." >&2
    echo "Gestionar: https://script.google.com/home/projects/${SCRIPT_ID}/deployments" >&2
  fi
  exit 1
fi

ACTIVE_ID=""
REDEPLOY_OK=0

if [[ -n "$WEBAPP_DEPLOYMENT_ID" ]]; then
  echo "→ clasp redeploy ${WEBAPP_DEPLOYMENT_ID} (versión ${VERS}; misma URL pública)"
  set +e
  DEPLOY_OUTPUT="$(clasp redeploy "$WEBAPP_DEPLOYMENT_ID" -V "$VERS" --description "$DEPLOY_DESC" 2>&1)"
  REDEPLOY_EXIT=$?
  set -e
  echo "$DEPLOY_OUTPUT"
  if [[ "$REDEPLOY_EXIT" -eq 0 ]]; then
    ACTIVE_ID="$WEBAPP_DEPLOYMENT_ID"
    REDEPLOY_OK=1
  else
    echo "→ redeploy falló (¿implementación borrada en Google?). Se creará una nueva." >&2
  fi
fi

if [[ "$REDEPLOY_OK" -eq 0 ]]; then
  echo "→ clasp deploy (nueva implementación web, versión ${VERS})"
  DEPLOY_OUTPUT="$(
    clasp deploy -V "$VERS" --description "$DEPLOY_DESC" 2>&1
  )"
  echo "$DEPLOY_OUTPUT"

  DEPLOY_LINE="$(echo "$DEPLOY_OUTPUT" | grep -E '^Deployed ' || true)"
  ACTIVE_ID="$(echo "$DEPLOY_LINE" | sed -E -n 's/^Deployed ([^ ]+) @[0-9]+$/\1/p' | tr -d '[:space:]')"
  if [[ -z "$ACTIVE_ID" ]]; then
    echo "No se obtuvo deployment ID desde clasp deploy. Salida:" >&2
    echo "$DEPLOY_OUTPUT" >&2
    exit 1
  fi

  node -e '
const fs = require("fs");
const path = "gas/deploy.json";
const id = process.argv[1];
const j = JSON.parse(fs.readFileSync(path, "utf8"));
j.webAppDeploymentId = id;
fs.writeFileSync(path, JSON.stringify(j, null, 2) + "\n");
' "$ACTIVE_ID"

  echo ""
  echo "→ gas/deploy.json actualizado: webAppDeploymentId=$ACTIVE_ID"
  if [[ -n "$WEBAPP_DEPLOYMENT_ID" && "$WEBAPP_DEPLOYMENT_ID" != "$ACTIVE_ID" ]]; then
    echo "  (reemplaza al anterior: $WEBAPP_DEPLOYMENT_ID)"
    echo "  Compartí la URL nueva; la anterior ya no recibe actualizaciones."
  fi
fi

EXEC_URL_STD="https://script.google.com/macros/s/${ACTIVE_ID}/exec"
MANAGE_URL="https://script.google.com/home/projects/${SCRIPT_ID}/deployments"

echo ""
echo "━━━━━━━━ URLs de la aplicación web"

if [[ -n "$DOMAIN" ]]; then
  echo "Globant Workspace:"
  echo "https://script.google.com/a/${DOMAIN}/macros/s/${ACTIVE_ID}/exec"
  echo ""
fi

echo "Formato estándar:"
echo "$EXEC_URL_STD"
echo ""
echo "Gestionar implementaciones:"
echo "$MANAGE_URL"
echo "━━━━━━━━"
echo ""
if [[ "$REDEPLOY_OK" -eq 1 ]]; then
  echo "Nota: misma URL que antes (redeploy sobre webAppDeploymentId en gas/deploy.json)."
else
  echo "Nota: implementación nueva creada. Guardá esta URL; los próximos ./deploy la reutilizarán."
fi

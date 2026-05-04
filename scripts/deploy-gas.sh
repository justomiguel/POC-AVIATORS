#!/usr/bin/env bash
# Deploy Apps Script:
#   1) Embebe logo.png en gas/index.html (data URL).
#   2) clasp push + nueva versión.
#   3) Borra implementaciones viejas (clasp undeploy), excepto @HEAD.
#   4) Crea una implementación nueva de web app y actualiza gas/deploy.json.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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
DEPLOYMENT_ID_LEGACY="$(echo "$CONFIG" | sed -n '2p' | tr -d '\r')"
DOMAIN_FROM_CONFIG="$(echo "$CONFIG" | sed -n '3p' | tr -d '\r')"

DOMAIN="${DEPLOY_ENTERPRISE_DOMAIN:-$DOMAIN_FROM_CONFIG}"

VERSION_NOTE="${1:-deploy $(date -u +%Y-%m-%dT%H:%MZ)}"

echo "→ embed-logo (logo.png → gas/index.html)"
node scripts/embed-logo.cjs

echo "→ clasp push"
clasp push --force

echo "→ clasp version \"${VERSION_NOTE}\""
VERS_LINE="$(clasp version "${VERSION_NOTE}" 2>&1)"
VERS="$(echo "$VERS_LINE" | sed -n 's/^Created version //p')"
if [[ -z "$VERS" ]]; then
  echo "No se pudo interpretar la versión. Salida: $VERS_LINE" >&2
  exit 1
fi

echo "→ clasp undeploy (todas salvo la de @HEAD; las URLs viejas quedan inválidas)"
while IFS= read -r line; do
  [[ "$line" == "- "* ]] || continue
  if [[ "$line" == *"@HEAD"* ]]; then
    continue
  fi
  id="$(echo "$line" | sed -E 's/^- ([^ ]+) .*/\1/')"
  id="$(echo "$id" | tr -d '[:space:]')"
  [[ -z "$id" ]] && continue
  echo "  · undeploy $id"
  clasp undeploy "$id" || echo "    (no se pudo borrar esta; seguimos)" >&2
done < <(clasp deployments 2>/dev/null || true)

echo "→ clasp deploy (nueva implementación web, versión ${VERS})"
DEPLOY_OUTPUT="$(
  clasp deploy -V "$VERS" --description "Aviators web app" 2>&1
)"
echo "$DEPLOY_OUTPUT"

DEPLOY_LINE="$(echo "$DEPLOY_OUTPUT" | grep -E '^Deployed ' || true)"
NEW_ID="$(echo "$DEPLOY_LINE" | sed -E -n 's/^Deployed ([^ ]+) @[0-9]+$/\1/p' | tr -d '[:space:]')"
if [[ -z "$NEW_ID" ]]; then
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
' "$NEW_ID"

echo ""
echo "→ gas/deploy.json actualizado: webAppDeploymentId=$NEW_ID"
if [[ -n "$DEPLOYMENT_ID_LEGACY" && "$DEPLOYMENT_ID_LEGACY" != "$NEW_ID" ]]; then
  echo "  (reemplaza al anterior: $DEPLOYMENT_ID_LEGACY)"
fi

EXEC_URL_STD="https://script.google.com/macros/s/${NEW_ID}/exec"
MANAGE_URL="https://script.google.com/home/projects/${SCRIPT_ID}/deployments"

echo ""
echo "━━━━━━━━ URLs de la aplicación web"

if [[ -n "$DOMAIN" ]]; then
  echo "Globant Workspace:"
  echo "https://script.google.com/a/${DOMAIN}/macros/s/${NEW_ID}/exec"
  echo ""
fi

echo "Formato estándar:"
echo "$EXEC_URL_STD"
echo ""
echo "Gestionar implementaciones:"
echo "$MANAGE_URL"
echo "━━━━━━━━"
echo ""
echo "Nota: cada deploy cambia la URL pública porque se crea un deployment nuevo."

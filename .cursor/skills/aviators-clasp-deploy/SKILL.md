---
name: aviators-clasp-deploy
description: >-
  Deploys and validates Google Apps Script for the Aviators repo (clasp rootDir gas).
  Use when the user mentions clasp push/pull, deployment, new web app version, script
  properties, manifest changes, or syncing gas/ to Apps Script.
disable-model-invocation: false
---

# Aviators · clasp deploy

## Repo layout

- **clasp** config lives at repo root: `.clasp.json` sets `"rootDir": "gas"` — all pushed sources are under `gas/`.
- **Manifest**: `gas/appsscript.json` (not at repository root).
- **Tailwind**: if you changed Tailwind classes or `gas/tailwind-input.css`, run **`npm run build:css`** at repo root so `gas/tailwind-include.html` is updated before `clasp push`. The **`./deploy`** script always runs **`npm run build:css`** first.
- **HTML includes**: `Code.js` `doGet` wires `tailwind-include`, `app-legacy-styles`, and `app-client` into the `index` template — ensure new UI fragments stay listed in `doGet` if you split further files.

## Before / after `clasp push`

0. **Consentimiento**: No ejecutar `clasp push`, `./deploy` ni publicar la Web App **sin que el usuario lo pida explícitamente** en ese momento. Regla del repo: `.cursor/rules/no-production-push-without-consent.mdc`.
1. **Scopes & network**: If you add new Google or Sheets APIs or new external hosts, update `gas/appsscript.json`:
   - `oauthScopes` — least privilege ([scopes](https://developers.google.com/apps-script/concepts/scopes)).
   - `urlFetchWhitelist` — add each HTTPS origin used by `UrlFetchApp` (e.g. Globant API host already listed).
2. **Runtime**: Keep `"runtimeVersion": "V8"`.
3. **Web app**: Cambios en `doGet`, HTML o permisos requieren **publicar una versión** en la implementación (`clasp redeploy` con el `webAppDeploymentId` de `gas/deploy.json`; `./deploy` lo hace automáticamente). La URL `/exec` **no cambia** mientras se reutilice el mismo deployment ID. Los usuarios pueden necesitar **re-autorizar** si cambiaron scopes. **`webapp.executeAs`** en `gas/appsscript.json` debe coincidir con el despliegue («Ejecutar como yo» = `USER_DEPLOYING`).
4. **Secrets**: API keys and tokens belong in **Script Properties** (or team vault); never commit them.

## Commands (terminal)

**Solo tras consentimiento explícito del usuario** para tocar producción: `clasp push`, `./deploy`, publicar Web App. Sin ese OK, limitarse a edición local y `npm run build:css`.

```bash
# From repository root (where .clasp.json is)
clasp status      # local vs remoto (sin escribir en Google)
clasp push        # solo si el usuario lo pidió en este turno
clasp open        # optional: open script in browser
clasp deployments # list deployments
```

## Checklist for the agent

- [ ] Edits under `gas/` match what clasp will push (`rootDir` is `gas`).
- [ ] `appsscript.json` updated if new services/hosts are needed.
- [ ] Remind user to run **`./deploy`** (or `clasp redeploy` with `gas/deploy.json` ID) when user-facing behavior changes — same public URL, new script version.
- [ ] If scopes changed, remind **re-authorize** for users hitting the app.

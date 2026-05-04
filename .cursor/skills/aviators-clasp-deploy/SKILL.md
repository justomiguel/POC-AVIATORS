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

## Before / after `clasp push`

1. **Scopes & network**: If you add new Google or Sheets APIs or new external hosts, update `gas/appsscript.json`:
   - `oauthScopes` — least privilege ([scopes](https://developers.google.com/apps-script/concepts/scopes)).
   - `urlFetchWhitelist` — add each HTTPS origin used by `UrlFetchApp` (e.g. Globant API host already listed).
2. **Runtime**: Keep `"runtimeVersion": "V8"`.
3. **Web app**: Changing `Code.js` `doGet`, HTML, or permissions usually requires a **new deployment** (Manage deployments) and users may need to **re-authorize** if scopes changed.
4. **Secrets**: API keys and tokens belong in **Script Properties** (or team vault); never commit them.

## Commands (agent may run in terminal)

```bash
# From repository root (where .clasp.json is)
clasp push
clasp open        # optional: open script in browser
clasp deployments # list deployments
```

## Checklist for the agent

- [ ] Edits under `gas/` match what clasp will push (`rootDir` is `gas`).
- [ ] `appsscript.json` updated if new services/hosts are needed.
- [ ] Remind user to **Deploy** → **New version** for the web app URL when user-facing behavior changes.
- [ ] If scopes changed, remind **re-authorize** for users hitting the app.

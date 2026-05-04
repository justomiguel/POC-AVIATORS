---
name: aviators-globant-api
description: >-
  Integrates Globant Enterprise AI / Agents API in the Aviators Apps Script project:
  RAG profiles, Assistant files, Bearer HTTP, base URL and keys via properties.
  Use when changing Globant endpoints, authentication, RAG sync, assistants, or
  when the user mentions Globant, api.agents.globant.com, or Enterprise AI.
disable-model-invocation: false
---

# Aviators · Globant API integration

## Where code lives

| Area | Path |
|------|------|
| RAG HTTP client | `gas/infrastructure/globant/GlobantRagApiClient.js` |
| Assistant HTTP client | `gas/infrastructure/globant/GlobantAssistantApiClient.js` |
| RAG defaults / payloads | `gas/infrastructure/globant/GlobantRagDefaults.js` |
| Orchestration / provider | `gas/application/LlmProviderGlobant.js`, `LlmOrchestrator.js`, `GlobantControlService.js` |
| Config | `gas/application/LlmConfig.js` |
| Thin HTTP | `gas/infrastructure/http/BearerHttp.js` — `UrlFetchApp` with `muteHttpExceptions`, `validateHttpsCertificates` |

## Network allowlist

- Host used for Globant must appear in `gas/appsscript.json` → `urlFetchWhitelist` (e.g. `https://api.agents.globant.com/`).
- Adding a **new** host requires manifest update + **clasp push** + often new deployment.

## Secrets

- Store **GLOBANT_AGENTS_API_KEY** (and related) in **Script Properties**, not in git.
- Clients read configuration via existing config helpers; do not hardcode tokens in `.js` files.

## Practices

- Reuse **GlobantRagApiClient_create** / assistant client factories instead of duplicating `UrlFetchApp` calls across files.
- Handle non-2xx with `muteHttpExceptions: true`, inspect `getResponseCode()` and response body safely (truncate for errors).
- Keep profile names and document IDs flowing through the same types as the rest of `gas/application/` to avoid drift.

## Related

- Project rule: `.cursor/rules/gas-manifest-and-quality.mdc`

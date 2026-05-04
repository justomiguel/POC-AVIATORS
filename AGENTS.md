# Aviators — guía para agentes (Cursor / IA)

Este repo es **Google Apps Script** con **clasp** (`gas/`, despliegue a un proyecto Script). Las reglas detalladas están en **`.cursor/rules/*.mdc`** (stack, dependencias, i18n, manifiesto).

## Prompts tipo “quiero que la app / el sistema…”

Interpretar como cambios en **esta base Apps Script** (HtmlService, `Code.js`, servicios GAS), no como app Node/React desplegada aparte, salvo que el usuario aclare otro repositorio.

## Skills de proyecto (este repo)

Están en **`.cursor/skills/<nombre>/SKILL.md`** (formato Cursor, listos para detección por el agente):

| Skill | Cuándo usarlo |
|-------|----------------|
| **aviators-clasp-deploy** | `clasp push`, despliegue web, cambios en `gas/appsscript.json`, nueva versión publicada. |
| **aviators-gas-i18n** | Textos de UI, traducción, locale, `Intl`, catálogos es/en. |
| **aviators-globant-api** | API Globant, RAG, Assistant, `UrlFetchApp`, allowlist, secretos. |

## Skills globales de Cursor (opcional)

Viene **instalado** con Cursor en `~/.cursor/skills-cursor/` (no editar ahí). Referencias útiles:

| Skill | Uso |
|-------|-----|
| **create-rule** | Ampliar `.cursor/rules`. |
| **create-skill** | Crear más skills en `.cursor/skills/`. |
| **create-hook** | Hooks de editor o agente. |
| **babysit** | PRs y CI si los usás. |

Para skills de la comunidad: `npx skills find` / `npx skills add` (ecosistema [skills.sh](https://skills.sh/)).

## Referencias externas útiles

- [Apps Script — External APIs](https://developers.google.com/apps-script/guides/services/external)  
- [Manifest (`appsscript.json`)](https://developers.google.com/apps-script/manifest)  
- [Libraries](https://developers.google.com/apps-script/guides/libraries)  
- [Authorization scopes](https://developers.google.com/apps-script/concepts/scopes)  
- [clasp](https://github.com/google/clasp)

# Aviators — guía para agentes (Cursor / IA)

Este repo es **Google Apps Script** con **clasp** (`gas/`, despliegue a un proyecto Script). Las reglas detalladas están en **`.cursor/rules/*.mdc`** (stack, dependencias, i18n, manifiesto, convención de commits sin marcas de IDE). Convención de **icono en cada botón** de la UI: **`gas-ui-buttons-icons.mdc`**. Convención de **secciones** (cabecera + párrafo explicativo): **`gas-ui-sections-structure.mdc`**. Tras tocar Tailwind o clases en HTML de `gas/`, recompilar CSS: **`gas-tailwind-compile.mdc`**.

## Antes de implementar (agente)

Ante pedidos de código o cambios en el repo: primero **refinamiento obligatorio** — objetivo reformulado, **casos borde**, **preguntas** para complementar el pedido y **supuestos**; recién después usar herramientas que editen archivos o alteren el proyecto. Detalle y excepciones: `.cursor/rules/agent-refinement-before-code.mdc`.

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

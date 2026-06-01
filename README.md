# Aviators

Web app interna para consultar y gestionar conocimiento de preventa y operaciones: catálogo de contenidos (propuestas, success cases, clientes, onboarding), chat con agentes IA, métricas de uso y administración de agentes RAG.

El runtime es **Google Apps Script** servido con **HtmlService**; el código fuente vive en `gas/` y se sincroniza con Google mediante **[clasp](https://github.com/google/clasp)**.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Google Apps Script (V8) |
| UI | HTML + JS modular (`gas/app-client-*.html`) inyectado desde `Code.js` |
| Estilos | Tailwind CSS compilado en local → `gas/tailwind-include.html` |
| Persistencia | Google Sheets (catálogo, métricas, clientes, catálogo API) |
| Archivos | Google Drive (carpeta raíz del proyecto) |
| IA | Globant Enterprise AI (RAG / Assistant) o Gemini API |
| i18n | Español e inglés (`gas/i18n/UiStrings.js`) |

## Funcionalidades principales

- **Chat** con agentes especializados (orquestador, propuestas, success cases, clientes, onboarding).
- **Catálogo de contenidos**: ingesta de PDFs, extracción asistida por IA y sincronización con perfiles RAG.
- **Maestro de clientes** con metadata e industria.
- **Métricas**: preguntas, no respondidas, leaderboards y feedback.
- **Admin**: agentes RAG, prompts rápidos, reset de métricas y restablecimiento total de datos operativos en spreadsheets (solo administradores).
- **Roles** desde una planilla de Google (pestaña `data`: columna Rol + E-mail).

## Estructura del repositorio

```
aviators/
├── gas/                    # Código Apps Script (rootDir de clasp)
│   ├── Code.js             # doGet, RPC expuestas al cliente
│   ├── index.html          # Shell HtmlService
│   ├── app-client-*.html   # Módulos JS del cliente
│   ├── application/        # Servicios de dominio
│   ├── infrastructure/     # Auth, Drive, HTTP, clientes Globant
│   ├── i18n/               # Catálogo de strings es/en
│   └── appsscript.json     # Manifiesto (scopes, webapp, allowlist)
├── scripts/
│   ├── deploy-gas.sh       # Pipeline de deploy
│   └── embed-logo.cjs      # Embebe logo en index.html
├── deploy                  # Atajo → scripts/deploy-gas.sh
├── .clasp.json             # scriptId + rootDir
└── package.json            # Toolchain Tailwind (solo local)
```

## Requisitos previos

1. **Node.js** (18+) y npm — solo para compilar Tailwind en local.
2. **[clasp](https://github.com/google/clasp)** instalado y autenticado:

   ```bash
   npm install -g @google/clasp
   clasp login
   ```

3. Acceso al **proyecto de Apps Script** vinculado en `.clasp.json` (`scriptId`).
4. Cuenta con permisos para desplegar la Web App en el dominio de Google Workspace configurado (`access: DOMAIN` en el manifiesto).

## Configuración inicial

### 1. Dependencias locales

```bash
npm install
```

### 2. Propiedades del script (Apps Script → Configuración → Propiedades del script)

No commitear secretos. Configuración mínima típica:

| Propiedad | Descripción |
|-----------|-------------|
| `GLOBANT_AGENTS_API_KEY` | API key de Globant Enterprise AI |
| `GLOBANT_RAG_BASE_URL` | Base URL (ej. `https://api.clients.geai.globant.com`) |
| `GEMINI_API_KEY` | Opcional, si se usa proveedor Gemini |
| `LLM_PROVIDER` | Opcional: `globant` o `gemini` |
| `ROLES_SPREADSHEET_ID` | ID de la planilla de roles (si no usa la por defecto del proyecto) |

Detalle de propiedades admin, corpus Drive y Globant: comentarios en `gas/application/LlmConfig.js`.

### 3. Planilla de roles

Spreadsheet con pestaña **`data`** y columnas **Rol** y **E-mail**. Las etiquetas de administrador se reconocen vía propiedad `ADMIN_SHEET_ROLES` (default: `Admin`, `Administrador`, `administrator`).

### 4. Dominio Workspace (opcional)

En `gas/deploy.json`, campo `workspaceDomain` (ej. `globant.com`) para que el script de deploy imprima la URL con formato `/a/{dominio}/macros/s/...`.

## Desarrollo local

### Compilar CSS (obligatorio tras cambiar clases Tailwind)

```bash
npm run build:css
```

En desarrollo continuo:

```bash
npm run watch:css
```

El artefacto que consume la Web App es **`gas/tailwind-include.html`**, no el CSS suelto.

### Sincronizar código sin publicar Web App

```bash
clasp push
clasp open    # abrir el editor en el navegador
```

`clasp push` sube el contenido de `gas/` al proyecto remoto; **no** actualiza la URL pública de la Web App por sí solo.

## Despliegue a producción

El flujo recomendado es el script **`./deploy`** (equivale a `scripts/deploy-gas.sh`):

```bash
./deploy
# o con nota de versión:
./deploy "release 2026-06-01"
```

El script ejecuta, en orden:

1. **`npm run build:css`** — Tailwind actualizado en `tailwind-include.html`.
2. **Embeber logo** — `logo.png` → data URL en `gas/index.html` (si existe `logo.png` en la raíz).
3. **`clasp push --force`** — sube `gas/` al proyecto Apps Script.
4. **`clasp version`** — crea una versión numerada.
5. **`clasp undeploy`** — elimina implementaciones antiguas (excepto `@HEAD`).
6. **`clasp deploy`** — crea una **nueva** implementación de Web App y actualiza `gas/deploy.json` con el `webAppDeploymentId`.

Al finalizar imprime las URLs de acceso (formato estándar y, si aplica, formato Workspace).

> **Importante:** cada deploy genera un **nuevo deployment ID**; la URL pública cambia. Compartí la URL que imprime el script tras el deploy.

### Checklist post-deploy

- [ ] Abrir la URL `/exec` e iniciar sesión con Google.
- [ ] Si cambiaron **scopes** en `appsscript.json`, los usuarios deben **re-autorizar** la app.
- [ ] Verificar que el despliegue use **Ejecutar como: yo (desplegador)** — coherente con `"executeAs": "USER_DEPLOYING"` en el manifiesto.
- [ ] Confirmar propiedades del script y acceso a spreadsheets/Drive en la cuenta desplegadora.

### Deploy manual (paso a paso)

```bash
npm run build:css
clasp push
clasp version "descripción del cambio"
clasp deploy -V <número_de_versión> --description "Aviators web app"
```

Gestionar implementaciones: [Apps Script → Implementaciones](https://script.google.com/home/projects) del proyecto.

## Manifiesto y red externa

`gas/appsscript.json` define:

- **OAuth scopes** mínimos (Drive, Sheets, perfil de usuario, peticiones externas).
- **`urlFetchWhitelist`**: hosts permitidos para `UrlFetchApp` (Google APIs, Globant, Gemini).

Si integrás un host HTTPS nuevo, añadilo a la allowlist y volvé a desplegar; puede requerir re-autorización.

## Datos y reset administrativo

Los datos operativos viven en spreadsheets creados/gestionados por la app (IDs en Script Properties). Desde **Métricas → Restablecer todo** (solo admin) se pueden vaciar filas de:

- catálogo de contenidos,
- métricas (incl. historial de chat y quick prompts),
- maestro de clientes,
- catálogo API de agentes.

**No** se modifica la planilla de roles ni secretos en Script Properties.

## Referencias

- [Google Apps Script](https://developers.google.com/apps-script)
- [clasp](https://github.com/google/clasp)
- [Manifiesto Apps Script](https://developers.google.com/apps-script/manifest)
- Guía para agentes/IA del repo: [`AGENTS.md`](./AGENTS.md)

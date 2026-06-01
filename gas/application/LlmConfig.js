/**
 * @fileoverview Configuración central (propiedades del script y valores por defecto).
 *
 * Apps Script → Configuración del proyecto → Propiedades del script:
 *
 * - **GLOBANT_AGENTS_API_KEY** — API key de Globant Agents / RAG (a veces empieza por
 *   prefijos como `cv-extractor_…`; pegá el valor completo, una sola línea).
 * - **GEMINI_API_KEY** — clave de Google AI Studio (solo modo Gemini).
 * - **LLM_PROVIDER** (opcional) — `globant` o `gemini`: fuerza el proveedor si definiste
 *   ambas claves. Si no está definido y hay las dos, prevalece Globant.
 *
 * Opcionales Globant: GLOBANT_RAG_BASE_URL (ej. `https://api.clients.geai.globant.com`; debe estar en
 * `appsscript.json` → `urlFetchWhitelist`), **GLOBANT_API_MODE**, GLOBANT_RAG_PROFILE_NAME,
 * GLOBANT_RAG_DOCUMENT_ID, GLOBANT_RAG_SKIP_UPLOAD, GLOBANT_RAG_EXECUTE_MAX_RETRIES,
 * GLOBANT_RAG_SKIP_AUTO_PROFILE. Opcional Gemini: GEMINI_MODEL.
 *
 * **Admin · corpus desde Drive** — perfil único cargado desde **carpetas** + **archivos** seleccionados:
 * - **ADMIN_EMAILS** — emails admin (coma). Vacío ⇒ `justo.vargas@globant.com`.
 * - **ADMIN_KNOWLEDGE_SOURCES** — JSON `{"folders":[{"id","name"}],"files":[{"id","name"}]}`.
 * - **ADMIN_KNOWLEDGE_FOLDER_IDS** — legado: sólo lista de IDs de carpeta (migratorio).
 * - **ADMIN_KNOWLEDGE_PROFILE_NAME** — nombre estable del perfil RAG (ej. `aviators-corpus`).
 * - **ADMIN_KNOWLEDGE_LAST_SYNC** — ISO fecha; lo escribe el script al sincronizar.
 * - **ADMIN_SYNC_MAX_FILES** — máx. documentos por sync (defecto 25).
 *
 * **GLOBANT_API_MODE** — `rag` (defecto): `/v1/search/profile` + `/v1/search/execute`.
 * `assistant`: igual que legacy `AssistantProvider` — `/v1/accessControl/apitoken/validate`,
 * `/v1/files` (multipart) + `/v1/assistant/chat`. Exige **GLOBANT_RAG_PROFILE_NAME**
 * con el nombre del asistente (ej. `cv-extractor`).
 *
 * Perfil autocreado `aviators-*` solo aplica a modo **rag**.
 */

var LLM_PROP = Object.freeze({
  PROVIDER: 'LLM_PROVIDER',

  GLOBANT_API_KEY: 'GLOBANT_AGENTS_API_KEY',
  GLOBANT_API_MODE: 'GLOBANT_API_MODE',
  GLOBANT_BASE_URL: 'GLOBANT_RAG_BASE_URL',
  GLOBANT_PROFILE: 'GLOBANT_RAG_PROFILE_NAME',
  GLOBANT_STATIC_DOC_ID: 'GLOBANT_RAG_DOCUMENT_ID',
  GLOBANT_SKIP_UPLOAD: 'GLOBANT_RAG_SKIP_UPLOAD',
  GLOBANT_EXECUTE_MAX_RETRIES: 'GLOBANT_RAG_EXECUTE_MAX_RETRIES',
  GLOBANT_SKIP_AUTO_PROFILE: 'GLOBANT_RAG_SKIP_AUTO_PROFILE',

  GEMINI_KEY: 'GEMINI_API_KEY',
  GEMINI_MODEL: 'GEMINI_MODEL',

  ADMIN_EMAILS: 'ADMIN_EMAILS',
  ADMIN_KNOWLEDGE_SOURCES: 'ADMIN_KNOWLEDGE_SOURCES',
  ADMIN_KNOWLEDGE_FOLDER_IDS: 'ADMIN_KNOWLEDGE_FOLDER_IDS',
  ADMIN_KNOWLEDGE_PROFILE_NAME: 'ADMIN_KNOWLEDGE_PROFILE_NAME',
  ADMIN_KNOWLEDGE_LAST_SYNC: 'ADMIN_KNOWLEDGE_LAST_SYNC',
  ADMIN_SYNC_MAX_FILES: 'ADMIN_SYNC_MAX_FILES',
});

var LLM_DEFAULTS = Object.freeze({
  GEMINI_MODEL: 'gemini-2.0-flash',
  MAX_DRIVE_FILES: 5,
  MAX_DOC_CHARS: 18000,
  GLOBANT_EXECUTE_MAX_RETRIES: 3,
  ADMIN_SYNC_MAX_FILES_DEFAULT: 25,
});

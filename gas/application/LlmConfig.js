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
 * Opcionales Globant: GLOBANT_RAG_BASE_URL (vacío ⇒ `https://api.clients.geai.globant.com`; debe estar en
 * `appsscript.json` → `urlFetchWhitelist`), **GLOBANT_API_MODE**, GLOBANT_RAG_PROFILE_NAME,
 * GLOBANT_RAG_DOCUMENT_ID, GLOBANT_RAG_SKIP_UPLOAD, GLOBANT_RAG_EXECUTE_MAX_RETRIES,
 * GLOBANT_RAG_SKIP_AUTO_PROFILE. Opcional Gemini: GEMINI_MODEL.
 * GLOBANT_CHAT_MODEL — modelo para /v1/chat/completions (roster, catálogo, texto sin archivo);
 *   ej. vertex_ai/gemini-2.5-flash u openai/gpt-5.5 (Chat API directo, ver docs Globant).
 * GLOBANT_FILES_ASSISTANT_NAME — Chat Assistant permanente para /v1/files + /v1/assistant/chat
 *   (extracción de contenidos, chat adjunto, armado de propuestas). Si no está definido, Aviators crea
 *   «aviators-document-files» en el primer uso (POST /v1/assistant, uploadFiles: true) y guarda el nombre aquí.
 *   Los PDFs subidos a /v1/files se borran al terminar cada sesión (DELETE /v1/files/{id}); el assistant no se borra.
 *
 * **Admin · corpus desde Drive** — perfil único cargado desde **carpetas** + **archivos** seleccionados:
 * - **ADMIN_EMAILS** — emails admin (coma). Notificaciones de solicitudes de acceso;
 *   si está vacío, se usan cuentas con rol `admin` o permiso `manage_users` en Supabase.
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
 *
 * Plantilla local de claves (no la lee Apps Script en runtime): `env.local` en la raíz del repo.
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

  GLOBANT_EMBEDDING_MODEL: 'GLOBANT_EMBEDDING_MODEL',
  GLOBANT_CHAT_MODEL: 'GLOBANT_CHAT_MODEL',
  /** Asistente/carpeta para upload temporal /v1/files (análisis de documentos). */
  GLOBANT_FILES_ASSISTANT_NAME: 'GLOBANT_FILES_ASSISTANT_NAME',
  /** Entero 1–20: tope MB de PDF embebido (RPC base64). Por defecto 12 si no se define. */
  CHAT_PDF_EMBED_MAX_MB: 'CHAT_PDF_EMBED_MAX_MB',
});

var LLM_DEFAULTS = Object.freeze({
  GEMINI_MODEL: 'gemini-2.0-flash',
  MAX_DRIVE_FILES: 5,
  MAX_DOC_CHARS: 18000,
  GLOBANT_EXECUTE_MAX_RETRIES: 3,
  ADMIN_SYNC_MAX_FILES_DEFAULT: 25,
  /** /v1/chat/completions: evitar gemini-2.0-flash (retirado / sin acceso en varios proyectos Vertex). */
  GLOBANT_CHAT_MODEL: 'vertex_ai/gemini-2.5-flash',
});

/** @type {Readonly<Record<string, string>>} Claves de Script Properties del proyecto. */
var AVIATORS_PROP = Object.freeze({
  DRIVE_ROOT_FOLDER_ID: 'DRIVE_ROOT_FOLDER_ID',
  CHAT_PDF_EMBED_MAX_MB: LLM_PROP.CHAT_PDF_EMBED_MAX_MB,
  SALESFORCE_ACCOUNTS_SPREADSHEET_ID: 'SALESFORCE_ACCOUNTS_SPREADSHEET_ID',

  GLOBANT_PROJECT_ID: 'GLOBANT_PROJECT_ID',

  ADMIN_AGENTS_REGISTRY: 'ADMIN_AGENTS_REGISTRY',
  ADMIN_AGENTS_REGISTRY_FILE_ID: 'ADMIN_AGENTS_REGISTRY_FILE_ID',

  DATA_BACKEND: 'AVIATORS_DATA_BACKEND',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SUPABASE_SCHEMA: 'SUPABASE_SCHEMA',

  PROVIDER: LLM_PROP.PROVIDER,
  GLOBANT_API_KEY: LLM_PROP.GLOBANT_API_KEY,
  GLOBANT_API_MODE: LLM_PROP.GLOBANT_API_MODE,
  GLOBANT_BASE_URL: LLM_PROP.GLOBANT_BASE_URL,
  GLOBANT_PROFILE: LLM_PROP.GLOBANT_PROFILE,
  GLOBANT_STATIC_DOC_ID: LLM_PROP.GLOBANT_STATIC_DOC_ID,
  GLOBANT_SKIP_UPLOAD: LLM_PROP.GLOBANT_SKIP_UPLOAD,
  GLOBANT_EXECUTE_MAX_RETRIES: LLM_PROP.GLOBANT_EXECUTE_MAX_RETRIES,
  GLOBANT_SKIP_AUTO_PROFILE: LLM_PROP.GLOBANT_SKIP_AUTO_PROFILE,
  GEMINI_KEY: LLM_PROP.GEMINI_KEY,
  GEMINI_MODEL: LLM_PROP.GEMINI_MODEL,
  ADMIN_EMAILS: LLM_PROP.ADMIN_EMAILS,
  ADMIN_KNOWLEDGE_SOURCES: LLM_PROP.ADMIN_KNOWLEDGE_SOURCES,
  ADMIN_KNOWLEDGE_FOLDER_IDS: LLM_PROP.ADMIN_KNOWLEDGE_FOLDER_IDS,
  ADMIN_KNOWLEDGE_PROFILE_NAME: LLM_PROP.ADMIN_KNOWLEDGE_PROFILE_NAME,
  ADMIN_KNOWLEDGE_LAST_SYNC: LLM_PROP.ADMIN_KNOWLEDGE_LAST_SYNC,
  ADMIN_SYNC_MAX_FILES: LLM_PROP.ADMIN_SYNC_MAX_FILES,
});

/**
 * @param {string} key
 * @return {string}
 */
function AviatorsConfig_scriptProp_(key) {
  return String(
    PropertiesService.getScriptProperties().getProperty(key) || '',
  ).trim();
}

/**
 * @return {string}
 */
function AviatorsConfig_driveRootFolderId_() {
  return AviatorsConfig_scriptProp_(AVIATORS_PROP.DRIVE_ROOT_FOLDER_ID);
}

/**
 * @return {string}
 */
function AviatorsConfig_requireDriveRootFolderId_() {
  var id = AviatorsConfig_driveRootFolderId_();
  if (!id) {
    AviatorsError_throw_('ERR_DRIVE_ROOT_NOT_CONFIGURED', 'AviatorsConfig_requireDriveRootFolderId_');
  }
  return id;
}

/**
 * @return {string}
 */
function AviatorsConfig_salesforceAccountsSpreadsheetId_() {
  return SalesforceAccounts_parseSpreadsheetId_(
    AviatorsConfig_scriptProp_(AVIATORS_PROP.SALESFORCE_ACCOUNTS_SPREADSHEET_ID),
  );
}

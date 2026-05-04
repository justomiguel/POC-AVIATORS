/**
 * @fileoverview Catálogo único de textos de UI (es/en). No duplicar mensajes en HTML/JS en bruto.
 * Cambiá APP_UI_LOCALE para el idioma por defecto de la plantilla y del servidor.
 */

/** @type {'es'|'en'} */
var APP_UI_LOCALE = 'es';

var UI_STRINGS = {
  es: {
    app_title: 'Aviators',
    note_no_email:
      'No pudimos obtener tu correo. Volvé a autorizar la app o revisá el despliegue.',
    note_no_docs:
      'No encontramos Docs ni archivos .txt/.md recientes en tu unidad. Creá uno o revisá permisos de Drive.',
    login_h1: 'Aviators',
    login_lead:
      'Esta es la suite agentica de Aviators. Bienvenido.',
    login_button: 'Continuar con Google',
    login_footnote: '',
    visitor_title: 'Sin rol asignado',
    visitor_body:
      'No tenés un rol asignado, así que el acceso es limitado. Si necesitás más funciones, pedí acceso a quien administre Aviators.',
    dashboard_title: 'Inicio',
    dashboard_lead:
      'Usá el agente, tus documentos en Drive y el explorador desde esta misma cuenta.',
    session_no_role_line: 'No tenés un rol asignado.',
    session_role_err_open:
      'No se pudo abrir la planilla de roles (ID incorrecto o tu cuenta sin acceso a ese archivo).',
    session_role_err_tab:
      'Falta la pestaña «data» en la planilla de roles (o el nombre no coincide).',
    session_role_err_cols:
      'Encabezados no reconocidos: hace falta una columna de rol (Rol / Role) y una de email (E-mail / email / correo).',
    busy_connecting: 'Conectando…',
    session_check: 'Comprobando sesión…',
    role_label_visitor: 'Visitante',
    sidebar_aria_profile: 'Perfil',
    sidebar_account: 'Cuenta',
    sidebar_logout: 'Cerrar sesión',
    sidebar_logout_aria: 'Cerrar sesión',
    label_no_email: '(sin email)',
    label_em_dash: '—',
    err_generic: 'Error.',
    err_login_session: 'Error al cargar la sesión.',
    drive_loading: 'Cargando Drive…',
    drive_list_error: 'No se pudo listar esta carpeta.',
    drive_status_empty:
      'Esta carpeta está vacía o no hay ítems visibles.',
    drive_status_items: '{n} elemento(s) en pantalla.',
    drive_status_more_hint:
      ' Usá «Cargar más» para la siguiente página.',
    drive_no_session:
      'Sin sesión con email no se puede listar Drive desde la app.',
    admin_pick_items: '{n} elemento(s).',
    admin_pick_more_short: ' Usá «Cargar más» si hace falta.',
    admin_mime_not_eligible: 'Tipo no incluible en el corpus RAG.',
    globant_project_warn:
      'Estado proyecto: posiblemente inactivo/advertencia API.',
    gc_btn_docs: 'Docs',
    gc_btn_clear_docs: 'Vaciar docs',
    btn_rag_delete_agent: 'Eliminar agente',
    gc_profiles_header:
      'Agentes (perfiles RAG) visibles para esta API key: {count}',
    gc_project_line: ' · Proyecto: {name}',
    gc_profiles_empty_html:
      '<strong>Listado vacío.</strong> No hay agentes/perfiles en este proyecto todavía, o la API devolvió 0. Se crean al <strong>sincronizar el corpus</strong> (botón más abajo) o vía API. Volvé a <strong>Actualizar listado</strong> después de crear uno.',
    gc_col_agent: 'Agente',
    gc_col_description: 'Descripción',
    gc_col_actions: 'Acciones',
    globant_panel_busy_fetch:
      'Consultando Globant… Obteniendo perfiles RAG o listado de archivos (puede tardar unos segundos).',
    rag_docs_loading: 'Cargando documentos del perfil «{name}»…',
    rag_docs_loading_more: 'Cargando más documentos del perfil «{name}»…',
    confirm_corpus_resync:
      'Se borrará y recreará el perfil en Globant y se volverán a subir los PDFs. ¿Continuar?',
    admin_busy_sync_long: 'Sincronizando (puede tardar varios minutos)…',
    admin_sync_corpus_done: '{note} · Subidos {uploaded}/{total}.',
    confirm_rag_doc_remove:
      '¿Quitar el documento del perfil «{name}»? (no borra Drive)',
    gc_busy_rag_doc_del:
      'Quitando documento del índice RAG (perfil «{name}»)…',
    confirm_rag_clear_all:
      'Se borrarán todos los documentos indexados del perfil «{name}». ¿Continuar?',
    gc_busy_rag_clear_all:
      'Vaciando todos los documentos del perfil «{name}»…',
    err_delete_generic: 'Error al eliminar.',
    gc_delete_busy: 'Eliminando archivo en Globant Files…',
    confirm_delete_agent_full:
      '¿Eliminar por completo el agente/perfil «{name}» en Globant?',
    gc_busy_delete_agent: 'Eliminando agente «{name}»…',
    drive_breadcrumb_root: 'Mi Drive',
    drive_breadcrumb_sep: ' › ',
    mime_folder: 'Carpeta',
    mime_doc_pdf: 'Doc/PDF',
    mime_sheet: 'Sheet',
    mime_slides: 'Slides',
    mime_drawing: 'Drawing',
    mime_google: 'Google',
    mime_file: 'Archivo',
    mime_trunc: '…',
    static_consult_heading: 'Tu pregunta',
    static_drive_explorer_heading: 'Explorador de Drive',
    static_drive_explorer_lead:
      'Navegá tus carpetas y archivos (solo lectura, misma cuenta que inició sesión). Los archivos se abren en una pestaña nueva.',
    btn_mi_drive: 'Mi Drive',
    btn_back: 'Volver',
    btn_load_more: 'Cargar más',
    lbl_question_sronly: 'Pregunta',
    ph_question:
      'Escribí cualquier pregunta… (ej.: ¿qué día es hoy? o resumí un documento de la lista de abajo)',
    ask_agent_btn: 'Preguntar al agente',
    ask_btn: 'Consultar',
    footer_logout: 'Cerrar sesión y volver al inicio',
    static_drive_files_heading: 'Documentos en Drive',
    admin_sec_title: 'Administración · corpus RAG',
    admin_lead_html:
      '<strong>Modo rápido:</strong> una <strong>carpeta raíz</strong> y un botón: se recorre el árbol de subcarpetas y se suben a Globant (como PDF) Docs, Sheets, Slides, Drawing y PDF nativos, hasta el máximo por ciclo (propiedad <code>ADMIN_SYNC_MAX_FILES</code>, hasta 80). Podés además sumar fuentes con el buscador de abajo.',
    admin_globant_summary: 'Agentes Globant — listar y eliminar',
    admin_globant_howto_html:
      'Cada <strong>agente</strong> es un <strong>perfil RAG</strong> del proyecto de tu API key (endpoint <code>GET /v1/search/profiles</code>). Tocá <strong>Actualizar listado</strong> y elegí <strong>Eliminar agente</strong> en la fila que quieras.',
    globant_refresh_list: 'Actualizar listado',
    lbl_admin_profile: 'Nombre del perfil RAG Globant',
    ph_admin_profile: 'ej. aviators-drive-corpus',
    lbl_admin_root_folder: 'Carpeta raíz en Drive — URL o solo ID',
    ph_admin_root_url: 'https://drive.google.com/drive/folders/…',
    admin_root_input_title:
      'Clic con el campo vacío o «Elegir en Drive» abre el explorador. Para pegar sin abrirlo, enfocá el campo con Tab.',
    btn_pick_drive: 'Elegir en Drive',
    admin_root_hint_micro_html:
      '<strong>Clic</strong> en el campo vacío o en <strong>Elegir en Drive</strong> para navegar tu Drive y marcar carpetas o archivos indexables (PDF, Docs, Sheets, Slides, Drawing). También podés <strong>pegar URL o ID</strong> enfocando el campo con <kbd>Tab</kbd>.',
    admin_root_hint_html:
      'Pegá el enlace al abrir la carpeta en Drive (o el ID). Se visitan <strong>todas las subcarpetas</strong> en profundidad (hasta 12 niveles). Esta acción <strong>reemplaza</strong> la selección guardada por solo esta raíz (sin archivos sueltos extra) y luego recrea el perfil y sube documentos a Globant.',
    admin_root_sync_btn:
      'Un solo clic: guardar raíz y subir todo recursivamente a Globant',
    admin_subsec_search: 'Más carpetas o archivos con el buscador',
    lbl_admin_search: 'Buscar en Drive por nombre',
    ph_admin_search: 'Ej. contrato • informe técnico',
    chk_admin_fulltext: 'Buscar también dentro del texto (más lento)',
    btn_search: 'Buscar',
    btn_next_page: 'Siguientes',
    lbl_admin_selected: 'Seleccionado para índice',
    admin_selection_empty: 'Nada seleccionado aún.',
    admin_json_summary: 'Opción técnica: JSON persistido',
    btn_save_config: 'Guardar configuración',
    btn_clear_selection: 'Vaciar selección',
    btn_sync_corpus: 'Sincronizar corpus (recrear perfil)',
    admin_pick_title: 'Elegir en tu Drive',
    btn_close: 'Cerrar',
    admin_pick_foot_html:
      'Solo se pueden marcar archivos que el corpus puede subir como PDF (Google Docs, Sheets, Slides, Drawing, PDF). Las carpetas marcan todo el árbol al sincronizar.',
    admin_pick_cancel: 'Cancelar',
    admin_pick_add: 'Añadir a la selección',
    chip_folder: 'CARPETA',
    chip_file: 'ARCHIVO',
    chip_remove_aria: 'Quitar',
    admin_need_email_drive: 'Necesitás sesión con email para explorar Drive.',
    admin_pick_added:
      'Listo: sumé {folders} carpeta(s) y {files} archivo(s). Guardá la configuración si querés persistir.',
    admin_search_no_results:
      'Sin resultados para «{q}». Probá otras palabras o marcar búsqueda en contenido.',
    admin_search_results: '{count} resultado(s).',
    err_admin_drive_search: 'Error buscando en Drive.',
    err_admin_sync_root: 'Error al sincronizar desde la raíz.',
    confirm_sync_root:
      'Se guardará solo esta carpeta raíz como fuente (los archivos sueltos del selector no quedan en la config). Después se recorrerán todas sus subcarpetas y se recreará el perfil Globant para subir PDFs. ¿Continuar?',
    admin_busy_sync_root:
      'Guardando carpeta raíz y sincronizando (puede tardar varios minutos)…',
    admin_sync_root_done:
      'Raíz «{folder}» · Perfil «{profile}» · {note} · Subidos {uploaded}/{total}.',
    admin_selection_cleared: 'Selección vaciada (no guardado aún).',
    admin_busy_save: 'Guardando…',
    admin_save_done:
      'Guardado: {folders} carpeta(s), {files} archivo(s), perfil «{profile}».',
    err_admin_save: 'Error al guardar.',
    confirm_empty_selection:
      'No hay carpetas ni archivos seleccionados para sincronizar. ¿Seguir de todos modos (solo recrear perfil)?',
    admin_busy_sync: 'Sincronizando…',
    err_admin_sync: 'Error en sincronización.',
    confirm_globant_del_file: 'Eliminar archivo Globant Files {id}?',
    confirm_delete_profile: '¿Eliminar el agente RAG «{name}»? Esta acción no se puede deshacer.',
    confirm_delete_doc: '¿Eliminar del índice el documento {id}?',
    generic_folder_name: 'Carpeta',
    admin_open: 'Abrir',
    admin_add_folder: 'Sumar carpeta',
    admin_add_file: 'Sumar archivo',
    err_globant_list: 'Error al listar Globant.',
    err_globant_paginate: 'Error al paginar.',
    err_docs_list: 'Error listando docs',
    gc_no_info: 'No se obtuvo información.',
    gc_col_file: 'Archivo',
    gc_col_index: 'Estado índice',
    gc_col_id: 'Id',
    gc_empty_docs_profile: '(Sin documentos indexados para este perfil)',
    gc_empty_docs_page: '(Sin resultados en este tramo)',
    gc_load_more: 'Cargar más documentos ({listed}/{total})',
    gc_remove: 'Quitar',
    gc_asst_summary:
      '{count} elemento(s) en Files API · no son agentes RAG (modo Assistant).',
    gc_col_name: 'Nombre',
    gc_col_ext: 'Ext.',
    gc_col_size: 'Tamaño',
    gc_btn_delete_file: 'Eliminar archivo',
    busy_consulting: 'Consultando…',
    err_ask: 'Error al consultar.',
    ask_empty_question: 'Escribí una pregunta.',
    busy_consulting_agent: 'Consultando con el agente…',
    err_ask_agent: 'Error al llamar al API.',
    ask_max_docs: 'Podés seleccionar como máximo {max} documentos.',
    consult_heading_globant: 'Tu pregunta — agente Globant',
    consult_heading_gemini: 'Tu pregunta — Gemini',
    consult_heading_none: 'Tu pregunta — sin modelo configurado',
    drive_heading_globant: 'Documentos en Drive (solo para consulta con documentos)',
    drive_heading_gemini: 'Documentos en Drive (marcá hasta 5)',
    drive_heading_plain: 'Documentos en Drive',
    btn_consult_drive: 'Consultar con documentos de Drive',
    answer_placeholder_globant:
      'Acá verás la respuesta. «Preguntar al agente» usa tu perfil RAG Globant con el corpus que sincronicés desde Drive (PDF, Docs, Sheets, Slides). «Consultar con documentos» exporta los archivos marcados arriba a PDF y arma el contexto de la respuesta.',
    answer_placeholder_gemini:
      'El resultado aparecerá aquí. Se envía el contenido texto de cada doc seleccionado al modelo Gemini.',
    answer_placeholder_none:
      'No hay clave cargada en Propiedades del script de ESTE proyecto. Abrí Apps Script → engranaje → Propiedades del script → nueva fila: GLOBANT_AGENTS_API_KEY = tu token (o GEMINI_API_KEY). Nueva versión de la web app si hace falta.',
    admin_sync_line:
      '{folders} carpeta(s) · {files} archivo(s) explícitos · hasta {max} PDF por sync{last}',
    last_sync_suffix: ' · Última sync: {date}',
    globant_hint_assistant:
      'Modo Assistant: aquí ves archivos de Files API, no perfiles RAG. Listado GET /v1/files/all · podés borrar cada archivo.',
    globant_hint_rag:
      'Tras Actualizar verás cada agente (perfil RAG). Docs = archivos indexados. «Eliminar agente» borra el perfil en Globant.',
    globant_hint_no_key:
      'Aquí aparecen datos sólo cuando el script tiene GLOBANT_AGENTS_API_KEY y el modo es Globant.',
    llm_meta_asst: 'Globant Assistant (/v1/chat) · perfil/asistente {hint} · {loc}',
    llm_meta_rag: 'Globant RAG (/v1/search) · perfil/asistente {hint} · {loc}',
    llm_hint_asst_long:
      'Modo Assistant (igual que AssistantProvider): GLOBANT_API_MODE=assistant + GLOBANT_AGENTS_API_KEY + GLOBANT_RAG_PROFILE_NAME (ej. cv-extractor). Endpoints: validate, /v1/files, /v1/assistant/chat. GLOBANT_RAG_SKIP_UPLOAD=true para no re-subir PDF antes del chat. Opcional: GLOBANT_RAG_EXECUTE_MAX_RETRIES.',
    llm_hint_rag_long:
      'Modo RAG: «Preguntar al agente» usa /v1/search/execute. Con documentos Drive, sube PDF por /v1/search/profile/.../document. Clave GLOBANT_AGENTS_API_KEY. Opcional: GLOBANT_RAG_PROFILE_NAME, GLOBANT_RAG_DOCUMENT_ID, GLOBANT_RAG_SKIP_UPLOAD, GLOBANT_API_MODE=rag.',
    llm_meta_gemini: 'Modo: Gemini API · modelo {model}',
    llm_hint_gemini: 'Consultas con GEMINI_API_KEY (Google AI Studio).',
    llm_error_gemini_http: 'Gemini API {code}: {detail}',
    llm_hint_config:
      'Configurá GLOBANT_AGENTS_API_KEY o GEMINI_API_KEY.',
    char_times: '—',
    meta_files_suffix: '{n} archivo(s)',
    session_email_no_capture:
      'Sin email de usuario: ejecutá la web como «usuario que accede» y autorizá de nuevo.',
    drive_search_min_chars: 'Escribí al menos 2 caracteres para buscar.',
    err_admin_only: 'Solo usuarios administradores pueden usar esta acción.',
    err_question_required: 'Escribí una pregunta.',
    err_select_doc: 'Seleccioná al menos un documento.',
    err_json_sources: 'JSON inválido.',
    err_sources_need_one:
      'Agregá al menos una carpeta o un archivo (PDF/Google).',
    err_corpus_globant_only: 'El corpus admin solo aplica con proveedor Globant.',
    err_falta_globant_key: 'Falta GLOBANT_AGENTS_API_KEY.',
    err_globant_direct:
      'La prueba directa Globant solo aplica cuando el proveedor activo es Globant.',
    err_globant_only_feature: 'Solo disponible con proveedor Globant.',
    err_assistant_delete_mode:
      'Esta acción solo aplica con GLOBANT_API_MODE=assistant.',
    err_globant_file_id: 'Indicá fileId del documento en Globant.',
    err_prompt_required: 'Escribí un prompt.',
    err_falta_gemini: 'Falta GEMINI_API_KEY en Propiedades del script.',
    err_root_folder_required:
      'Indicá el ID o el enlace de la carpeta raíz en Drive.',
    err_gemini_parse: 'La respuesta del modelo no es válida.',
    err_globant_prof_assistant:
      'Con GLOBANT_API_MODE=assistant tenés que definir GLOBANT_RAG_PROFILE_NAME (ej. cv-extractor).',
    err_globant_prof_skipauto:
      'Con GLOBANT_RAG_SKIP_AUTO_PROFILE=true tenés que definir GLOBANT_RAG_PROFILE_NAME.',
    err_globant_prof_req:
      'Definí GLOBANT_RAG_PROFILE_NAME para este modo.',
    err_globant_rag_missing: 'Falta el cliente RAG de Globant.',
    drive_error_search_http: 'Drive (búsqueda) {code}: {detail}',
    drive_error_browse_http: 'Drive (explorar) {code}: {detail}',
    drive_error_fetch_http: 'Drive {code}: {detail}',
    drive_mime_not_plain_text: 'Tipo no soportado para texto: {mime}',
    drive_text_truncated_suffix: '\n…[truncado]',
    err_drive_folder_not_recognized:
      'No se reconoce una carpeta. Pegá la URL con /folders/… o solo el ID del directorio.',
    globant_snapshot_requires_provider:
      'Este panel requiere proveedor Globant (definí GLOBANT_AGENTS_API_KEY y no sólo Gemini).',
    globant_assistant_files_list_hint:
      'Modo Assistant: los archivos no son los documentos indexados del RAG; se listan vía GET /v1/files/all.',
    err_globant_profile_name_required: 'Indicá el nombre del perfil RAG.',
    err_globant_rag_list_mode_only:
      'Este listado sólo aplica con GLOBANT_API_MODE vacío o rag.',
    err_globant_delete_profile_rag_only:
      'Eliminar perfil RAG sólo en modo rag (no Assistant).',
    err_globant_rag_action_only: 'Acción válida sólo en modo rag.',
    err_globant_profile_doc_required:
      'Perfil RAG y document id requeridos.',
    err_globant_rag_only_short: 'Sólo en modo rag.',
    err_globant_assistant_file_id_required:
      'Indicá el id del archivo en Globant Files.',
    err_globant_delete_file_assistant_only:
      'Eliminar archivo /v1/files sólo tiene sentido en GLOBANT_API_MODE=assistant.',
    err_globant_api_http: 'Globant {path} · HTTP {code}: {detail}',
    err_globant_api_logical: 'Globant {path} · respuesta: {detail}',
    err_globant_assistant_empty_file:
      'Archivo vacío para Globant Assistant upload.',
    err_globant_chat_retry_unknown:
      'GlobantAssistantApiClient_sendChatWithRetry: error desconocido.',
    err_json_invalid_detail: 'JSON inválido: {message}',
    admin_sources_folder_ids_not_array:
      'Array de IDs de carpeta debe ser JSON string[].',
    admin_sources_empty_input:
      'Vacío: usá el buscador arriba o pegá `{ "folders":[],"files":[] }`.',
    admin_folder_not_a_folder_type:
      '«{name}» no es carpeta (tipo {mime}). Usá solo carpetas aquí.',
    admin_folder_access_denied:
      'No se accede a la carpeta «{name}»: {reason}',
    admin_root_folder_access_denied:
      'No hay acceso a la carpeta (…{tail}): {reason}',
    admin_corpus_assistant_no_search:
      'Modo Assistant (GLOBANT_API_MODE=assistant) no usa /v1/search.',
    admin_corpus_nothing_to_index:
      'Nada que indexar (PDF/Google Doc/Sheet/Slide). Sumá desde el buscador.',
    admin_corpus_index_failed: 'Indexación fallida {current}/{total}.',
    admin_corpus_sync_return_note:
      'Consultá con «Preguntar al agente». Tipos admitidos sync: PDF, Docs, Sheets, Slides, Draw.',
    admin_rag_default_profile_description:
      'Corpus Aviators (Drive picker + carpetas).',
    generic_file_name: 'Archivo',
    label_root_short: 'Raíz',
    err_no_llm_provider:
      'No hay proveedor LLM: en este proyecto Apps Script abrí el engranaje «Configuración del proyecto» → «Propiedades del script» y agregá la propiedad GLOBANT_AGENTS_API_KEY o GEMINI_API_KEY con tu clave. El código solo lee esas propiedades (no lee valores pegados en archivos .gs). Opcional: LLM_PROVIDER=globant|gemini.',
    llm_project_hint_autocreate: '(se creará en la primera consulta)',
    llm_ui_config_hint_assistant_profile:
      'GLOBANT_API_MODE=assistant: definí GLOBANT_RAG_PROFILE_NAME (ej. cv-extractor).',
    llm_ui_config_no_keys:
      'Este despliegue no ve ninguna clave. En el proyecto vinculado a clasp: Editor → ⚙️ Configuración del proyecto → Propiedades del script → agregá GLOBANT_AGENTS_API_KEY (valor = tu Bearer token) y guardá; podés tener que volver a abrir la web app. Opcional: LLM_PROVIDER, GLOBANT_API_MODE.',
    drive_export_pdf_failed:
      'Export PDF: {code} — {detail} ({stem})',
    drive_globant_pdf_required:
      'Para Globant hace falta PDF o formato Google convertible a PDF (Doc, Sheets, Slides). Archivo «{stem}» MIME: {mime}. Convertilo en Drive a Google Docs/Sheet o subí un PDF.',
    admin_folder_tree_inaccessible:
      'Carpeta Drive no accesible (…{tail}): {reason}',
    err_globant_indexing_failed:
      'Indexación Globant incompleta o fallida para el documento.',
    llm_auto_created_profile_desc: 'Perfil creado por Aviators (Apps Script).',
    meta_provider_globant_rag: 'Globant Agents RAG (/v1/search)',
    meta_provider_globant_assistant: 'Globant /v1/assistant/chat',
    meta_provider_globant_execute: 'Globant /v1/search/execute',
    meta_filter_assistant_no_rag:
      'modo Assistant (sin filtro documento RAG)',
    meta_filter_rag_doc_id: 'id = {id}',
    meta_filter_rag_full_profile: 'sin filtro (perfil completo)',
    meta_provider_gemini_api: 'Gemini API',
    llm_gemini_system_preamble:
      'Respondé en español usando solo información de los documentos. Si algo no aparece ahí, decilo claramente. Podés usar viñetas.',
    llm_gemini_section_question: '--- PREGUNTA ---',
    llm_gemini_section_documents: '--- DOCUMENTOS ---',
    llm_gemini_doc_heading: '### {name}\n',
    llm_gemini_between_docs: '\n\n---\n',
    llm_gemini_block_read_error: '### id {id}\n_Error: {err}_',
  },
  en: {
    app_title: 'Aviators',
    note_no_email:
      'We could not get your email. Re-authorize the app or check deployment.',
    note_no_docs:
      'We could not find recent Docs or .txt/.md files in your Drive. Create one or check Drive permissions.',
    login_h1: 'Aviators',
    login_lead: 'This is the Aviators agentic suite. Welcome.',
    login_button: 'Continue with Google',
    login_footnote: '',
    visitor_title: 'No role assigned',
    visitor_body:
      "You don't have a role assigned, so access is limited. If you need more features, ask your Aviators admin.",
    dashboard_title: 'Home',
    dashboard_lead:
      'Use the agent, your Drive files, and the explorer with this account.',
    session_no_role_line: "You don't have a role assigned.",
    session_role_err_open:
      'Could not open the roles spreadsheet (wrong ID or your account has no access).',
    session_role_err_tab:
      'The «data» tab is missing in the roles spreadsheet (or the name does not match).',
    session_role_err_cols:
      'Unrecognized headers: need a role column (Rol / Role) and an email column (E-mail / email / correo).',
    busy_connecting: 'Connecting…',
    session_check: 'Checking session…',
    role_label_visitor: 'Visitor',
    sidebar_aria_profile: 'Profile',
    sidebar_account: 'Account',
    sidebar_logout: 'Sign out',
    sidebar_logout_aria: 'Sign out',
    label_no_email: '(no email)',
    label_em_dash: '—',
    err_generic: 'Error.',
    err_login_session: 'Could not load session.',
    drive_loading: 'Loading Drive…',
    drive_list_error: 'Could not list this folder.',
    drive_status_empty: 'This folder is empty or has no visible items.',
    drive_status_items: '{n} item(s) on screen.',
    drive_status_more_hint: ' Use “Load more” for the next page.',
    drive_no_session:
      'Drive cannot be listed without an email session.',
    admin_pick_items: '{n} item(s).',
    admin_pick_more_short: ' Use “Load more” if needed.',
    admin_mime_not_eligible: 'MIME type not allowed for RAG corpus.',
    globant_project_warn: 'Project status: possibly inactive / API warning.',
    gc_btn_docs: 'Docs',
    gc_btn_clear_docs: 'Clear docs',
    btn_rag_delete_agent: 'Delete agent',
    gc_profiles_header:
      'RAG agents (profiles) visible for this API key: {count}',
    gc_project_line: ' · Project: {name}',
    gc_profiles_empty_html:
      '<strong>Empty list.</strong> There are no agents/profiles in this project yet, or the API returned 0. They are created when you <strong>sync the corpus</strong> (button below) or via API. Click <strong>Refresh list</strong> after creating one.',
    gc_col_agent: 'Agent',
    gc_col_description: 'Description',
    gc_col_actions: 'Actions',
    globant_panel_busy_fetch:
      'Querying Globant… Loading RAG profiles or file list (may take a few seconds).',
    rag_docs_loading: 'Loading profile documents «{name}»…',
    rag_docs_loading_more: 'Loading more profile documents «{name}»…',
    confirm_corpus_resync:
      'The Globant profile will be deleted and recreated and PDFs re-uploaded. Continue?',
    admin_busy_sync_long: 'Syncing (may take several minutes)…',
    admin_sync_corpus_done: '{note} · Uploaded {uploaded}/{total}.',
    confirm_rag_doc_remove:
      'Remove document from profile «{name}»? (does not delete Drive)',
    gc_busy_rag_doc_del: 'Removing document from RAG index (profile «{name}»)…',
    confirm_rag_clear_all:
      'All indexed documents for profile «{name}» will be deleted. Continue?',
    gc_busy_rag_clear_all: 'Clearing all documents for profile «{name}»…',
    err_delete_generic: 'Error while deleting.',
    gc_delete_busy: 'Deleting file in Globant Files…',
    confirm_delete_agent_full:
      'Permanently delete agent/profile «{name}» in Globant?',
    gc_busy_delete_agent: 'Deleting agent «{name}»…',
    drive_breadcrumb_root: 'My Drive',
    drive_breadcrumb_sep: ' › ',
    mime_folder: 'Folder',
    mime_doc_pdf: 'Doc/PDF',
    mime_sheet: 'Sheet',
    mime_slides: 'Slides',
    mime_drawing: 'Drawing',
    mime_google: 'Google',
    mime_file: 'File',
    mime_trunc: '…',
    static_consult_heading: 'Your question',
    static_drive_explorer_heading: 'Drive explorer',
    static_drive_explorer_lead:
      'Browse your folders and files (read-only, same account as signed in). Files open in a new tab.',
    btn_mi_drive: 'My Drive',
    btn_back: 'Back',
    btn_load_more: 'Load more',
    lbl_question_sronly: 'Question',
    ph_question:
      'Type any question… (e.g. what day is it? or summarize a document from the list below)',
    ask_agent_btn: 'Ask the agent',
    ask_btn: 'Ask',
    footer_logout: 'Sign out and return to start',
    static_drive_files_heading: 'Documents in Drive',
    admin_sec_title: 'Administration · RAG corpus',
    admin_lead_html:
      '<strong>Quick mode:</strong> one <strong>root folder</strong> and one button: the subfolder tree is walked and uploaded to Globant as PDF (Docs, Sheets, Slides, Drawing, native PDFs), up to the max per cycle (<code>ADMIN_SYNC_MAX_FILES</code>, up to 80). You can also add sources via the search below.',
    admin_globant_summary: 'Globant agents — list and delete',
    admin_globant_howto_html:
      'Each <strong>agent</strong> is a RAG <strong>profile</strong> for your API key project (<code>GET /v1/search/profiles</code>). Click <strong>Refresh list</strong> and choose <strong>Delete agent</strong> on the row you want.',
    globant_refresh_list: 'Refresh list',
    lbl_admin_profile: 'Globant RAG profile name',
    ph_admin_profile: 'e.g. aviators-drive-corpus',
    lbl_admin_root_folder: 'Root folder in Drive — URL or ID only',
    ph_admin_root_url: 'https://drive.google.com/drive/folders/…',
    admin_root_input_title:
      'Click empty field or “Pick in Drive” opens the explorer. To paste only, focus the field with Tab.',
    btn_pick_drive: 'Pick in Drive',
    admin_root_hint_micro_html:
      '<strong>Click</strong> the empty field or <strong>Pick in Drive</strong> to browse and mark folders or indexable files (PDF, Docs, Sheets, Slides, Drawing). You can also <strong>paste URL or ID</strong> by focusing the field with <kbd>Tab</kbd>.',
    admin_root_hint_html:
      'Paste the link when the folder is open in Drive (or the ID). <strong>All subfolders</strong> are visited (up to 12 levels). This <strong>replaces</strong> saved selection with this root only (no extra loose files), then recreates the profile and uploads to Globant.',
    admin_root_sync_btn:
      'One click: save root and upload everything recursively to Globant',
    admin_subsec_search: 'More folders or files with search',
    lbl_admin_search: 'Search Drive by name',
    ph_admin_search: 'E.g. contract • technical report',
    chk_admin_fulltext: 'Search inside file text (slower)',
    btn_search: 'Search',
    btn_next_page: 'More',
    lbl_admin_selected: 'Selected for index',
    admin_selection_empty: 'Nothing selected yet.',
    admin_json_summary: 'Technical option: persisted JSON',
    btn_save_config: 'Save configuration',
    btn_clear_selection: 'Clear selection',
    btn_sync_corpus: 'Sync corpus (recreate profile)',
    admin_pick_title: 'Pick from your Drive',
    btn_close: 'Close',
    admin_pick_foot_html:
      'Only files the corpus can upload as PDF (Google Docs, Sheets, Slides, Drawing, PDF) can be marked. Folders mark the whole tree when syncing.',
    admin_pick_cancel: 'Cancel',
    admin_pick_add: 'Add to selection',
    chip_folder: 'FOLDER',
    chip_file: 'FILE',
    chip_remove_aria: 'Remove',
    admin_need_email_drive: 'You need a session with email to browse Drive.',
    admin_pick_added:
      'Done: added {folders} folder(s) and {files} file(s). Save configuration to persist.',
    admin_search_no_results:
      'No results for “{q}”. Try other words or enable full-text search.',
    admin_search_results: '{count} result(s).',
    err_admin_drive_search: 'Error searching Drive.',
    err_admin_sync_root: 'Error syncing from root folder.',
    confirm_sync_root:
      'Only this root folder will be saved as source (loose picker files stay out of config). Then all subfolders are walked and the Globant profile is recreated to upload PDFs. Continue?',
    admin_busy_sync_root:
      'Saving root folder and syncing (may take several minutes)…',
    admin_sync_root_done:
      'Root «{folder}» · Profile «{profile}» · {note} · Uploaded {uploaded}/{total}.',
    admin_selection_cleared: 'Selection cleared (not saved yet).',
    admin_busy_save: 'Saving…',
    admin_save_done:
      'Saved: {folders} folder(s), {files} file(s), profile «{profile}».',
    err_admin_save: 'Error saving.',
    confirm_empty_selection:
      'No folders or files selected to sync. Continue anyway (recreate profile only)?',
    admin_busy_sync: 'Syncing…',
    err_admin_sync: 'Sync error.',
    confirm_globant_del_file: 'Delete Globant Files file {id}?',
    confirm_delete_profile:
      'Delete RAG agent «{name}»? This cannot be undone.',
    confirm_delete_doc: 'Remove document {id} from the index?',
    generic_folder_name: 'Folder',
    admin_open: 'Open',
    admin_add_folder: 'Add folder',
    admin_add_file: 'Add file',
    err_globant_list: 'Error listing Globant.',
    err_globant_paginate: 'Error paginating.',
    err_docs_list: 'Error listing documents',
    gc_no_info: 'No information was returned.',
    gc_col_file: 'File',
    gc_col_index: 'Index status',
    gc_col_id: 'Id',
    gc_empty_docs_profile: '(No indexed documents for this profile)',
    gc_empty_docs_page: '(No results in this page)',
    gc_load_more: 'Load more documents ({listed}/{total})',
    gc_remove: 'Remove',
    gc_asst_summary:
      '{count} item(s) in Files API · not RAG agents (Assistant mode).',
    gc_col_name: 'Name',
    gc_col_ext: 'Ext.',
    gc_col_size: 'Size',
    gc_btn_delete_file: 'Delete file',
    busy_consulting: 'Asking…',
    err_ask: 'Error while asking.',
    ask_empty_question: 'Type a question.',
    busy_consulting_agent: 'Calling the agent…',
    err_ask_agent: 'Error calling the API.',
    ask_max_docs: 'You can select at most {max} documents.',
    consult_heading_globant: 'Your question — Globant agent',
    consult_heading_gemini: 'Your question — Gemini',
    consult_heading_none: 'Your question — no model configured',
    drive_heading_globant: 'Documents in Drive (for document-backed Q&A only)',
    drive_heading_gemini: 'Documents in Drive (select up to 5)',
    drive_heading_plain: 'Documents in Drive',
    btn_consult_drive: 'Ask using selected Drive documents',
    answer_placeholder_globant:
      'The answer appears here. “Ask the agent” uses your Globant RAG profile and corpus synced from Drive. “Ask with documents” exports selected files to PDF and builds context.',
    answer_placeholder_gemini:
      'The result appears here. Text from each selected doc is sent to Gemini.',
    answer_placeholder_none:
      'No key in this project’s Script Properties. Open Apps Script → gear → Script properties → add GLOBANT_AGENTS_API_KEY (or GEMINI_API_KEY). Redeploy the web app if needed.',
    admin_sync_line:
      '{folders} folder(s) · {files} explicit file(s) · up to {max} PDFs per sync{last}',
    last_sync_suffix: ' · Last sync: {date}',
    globant_hint_assistant:
      'Assistant mode: Files API files, not RAG profiles. List GET /v1/files/all · you can delete each file.',
    globant_hint_rag:
      'After Refresh you see each agent (RAG profile). Docs = indexed files. “Delete agent” removes the profile in Globant.',
    globant_hint_no_key:
      'Data appears only when the script has GLOBANT_AGENTS_API_KEY and mode is Globant.',
    llm_meta_asst: 'Globant Assistant (/v1/chat) · profile/assistant {hint} · {loc}',
    llm_meta_rag: 'Globant RAG (/v1/search) · profile/assistant {hint} · {loc}',
    llm_hint_asst_long:
      'Assistant mode: GLOBANT_API_MODE=assistant + GLOBANT_AGENTS_API_KEY + GLOBANT_RAG_PROFILE_NAME. Endpoints: validate, /v1/files, /v1/assistant/chat. GLOBANT_RAG_SKIP_UPLOAD=true to skip PDF re-upload before chat.',
    llm_hint_rag_long:
      'RAG mode: “Ask the agent” uses /v1/search/execute. With Drive docs, upload PDF via /v1/search/profile/.../document. Key GLOBANT_AGENTS_API_KEY.',
    llm_meta_gemini: 'Mode: Gemini API · model {model}',
    llm_hint_gemini: 'Queries use GEMINI_API_KEY (Google AI Studio).',
    llm_error_gemini_http: 'Gemini API {code}: {detail}',
    llm_hint_config: 'Set GLOBANT_AGENTS_API_KEY or GEMINI_API_KEY.',
    char_times: '—',
    meta_files_suffix: '{n} file(s)',
    session_email_no_capture:
      'No user email: run the web app as “user accessing” and authorize again.',
    drive_search_min_chars: 'Type at least 2 characters to search.',
    err_admin_only: 'Only administrator users can run this action.',
    err_question_required: 'Type a question.',
    err_select_doc: 'Select at least one document.',
    err_json_sources: 'Invalid JSON.',
    err_sources_need_one: 'Add at least one folder or file (PDF/Google).',
    err_corpus_globant_only: 'Admin corpus only applies with Globant provider.',
    err_falta_globant_key: 'GLOBANT_AGENTS_API_KEY is missing.',
    err_globant_direct:
      'Globant direct test only applies when Globant is the active provider.',
    err_globant_only_feature: 'Only available with Globant provider.',
    err_assistant_delete_mode: 'This action only applies with GLOBANT_API_MODE=assistant.',
    err_globant_file_id: 'Provide the Globant Files document id.',
    err_prompt_required: 'Type a prompt.',
    err_falta_gemini: 'GEMINI_API_KEY is missing in Script Properties.',
    err_root_folder_required: 'Provide the root folder ID or link in Drive.',
    err_gemini_parse: 'The model response is not valid.',
    err_globant_prof_assistant:
      'With GLOBANT_API_MODE=assistant you must set GLOBANT_RAG_PROFILE_NAME (e.g. cv-extractor).',
    err_globant_prof_skipauto:
      'With GLOBANT_RAG_SKIP_AUTO_PROFILE=true you must set GLOBANT_RAG_PROFILE_NAME.',
    err_globant_prof_req:
      'Set GLOBANT_RAG_PROFILE_NAME for this mode.',
    err_globant_rag_missing: 'Globant RAG client is missing.',
    drive_error_search_http: 'Drive (search) {code}: {detail}',
    drive_error_browse_http: 'Drive (browse) {code}: {detail}',
    drive_error_fetch_http: 'Drive {code}: {detail}',
    drive_mime_not_plain_text: 'MIME type not supported for plain text: {mime}',
    drive_text_truncated_suffix: '\n…[truncated]',
    err_drive_folder_not_recognized:
      'Not recognized as a folder. Paste a URL with /folders/… or the folder ID only.',
    globant_snapshot_requires_provider:
      'This panel requires Globant provider (set GLOBANT_AGENTS_API_KEY, not Gemini alone).',
    globant_assistant_files_list_hint:
      'Assistant mode: these files are not RAG indexed docs; they are listed via GET /v1/files/all.',
    err_globant_profile_name_required: 'Enter the RAG profile name.',
    err_globant_rag_list_mode_only:
      'This list only applies with GLOBANT_API_MODE empty or rag.',
    err_globant_delete_profile_rag_only:
      'Delete RAG profile only in rag mode (not Assistant).',
    err_globant_rag_action_only: 'This action is only valid in rag mode.',
    err_globant_profile_doc_required:
      'RAG profile and document id are required.',
    err_globant_rag_only_short: 'Only in rag mode.',
    err_globant_assistant_file_id_required:
      'Enter the file id in Globant Files.',
    err_globant_delete_file_assistant_only:
      'Deleting /v1/files only applies with GLOBANT_API_MODE=assistant.',
    err_globant_api_http: 'Globant {path} · HTTP {code}: {detail}',
    err_globant_api_logical: 'Globant {path} · response: {detail}',
    err_globant_assistant_empty_file:
      'Empty file for Globant Assistant upload.',
    err_globant_chat_retry_unknown:
      'GlobantAssistantApiClient_sendChatWithRetry: unknown error.',
    err_json_invalid_detail: 'Invalid JSON: {message}',
    admin_sources_folder_ids_not_array:
      'Folder ID array must be JSON string[].',
    admin_sources_empty_input:
      'Empty: use the search above or paste `{ "folders":[],"files":[] }`.',
    admin_folder_not_a_folder_type:
      '«{name}» is not a folder (type {mime}). Use folders only here.',
    admin_folder_access_denied:
      'Cannot access folder «{name}»: {reason}',
    admin_root_folder_access_denied:
      'Cannot access folder (…{tail}): {reason}',
    admin_corpus_assistant_no_search:
      'Assistant mode (GLOBANT_API_MODE=assistant) does not use /v1/search.',
    admin_corpus_nothing_to_index:
      'Nothing to index (PDF/Google Doc/Sheet/Slide). Add from search.',
    admin_corpus_index_failed: 'Indexing failed {current}/{total}.',
    admin_corpus_sync_return_note:
      'Ask the agent for Q&A. Sync supports PDF, Docs, Sheets, Slides, Draw.',
    admin_rag_default_profile_description:
      'Aviators corpus (Drive picker + folders).',
    generic_file_name: 'File',
    label_root_short: 'Root',
    err_no_llm_provider:
      'No LLM provider: in this Apps Script project open the gear «Project settings» → «Script properties» and add GLOBANT_AGENTS_API_KEY or GEMINI_API_KEY with your key. The code only reads those properties (not values pasted in .gs files). Optional: LLM_PROVIDER=globant|gemini.',
    llm_project_hint_autocreate: '(will be created on first query)',
    llm_ui_config_hint_assistant_profile:
      'GLOBANT_API_MODE=assistant: set GLOBANT_RAG_PROFILE_NAME (e.g. cv-extractor).',
    llm_ui_config_no_keys:
      'This deployment does not see any key. In the clasp-linked project: Editor → ⚙️ Project settings → Script properties → add GLOBANT_AGENTS_API_KEY (value = your Bearer token) and save; you may need to reopen the web app. Optional: LLM_PROVIDER, GLOBANT_API_MODE.',
    drive_export_pdf_failed:
      'Export PDF: {code} — {detail} ({stem})',
    drive_globant_pdf_required:
      'Globant needs PDF or a Google format exportable to PDF (Doc, Sheets, Slides). File «{stem}» MIME: {mime}. Convert in Drive to Google Docs/Sheet or upload a PDF.',
    admin_folder_tree_inaccessible:
      'Drive folder not accessible (…{tail}): {reason}',
    err_globant_indexing_failed:
      'Globant indexing incomplete or failed for the document.',
    llm_auto_created_profile_desc: 'Profile created by Aviators (Apps Script).',
    meta_provider_globant_rag: 'Globant Agents RAG (/v1/search)',
    meta_provider_globant_assistant: 'Globant /v1/assistant/chat',
    meta_provider_globant_execute: 'Globant /v1/search/execute',
    meta_filter_assistant_no_rag:
      'Assistant mode (no RAG document filter)',
    meta_filter_rag_doc_id: 'id = {id}',
    meta_filter_rag_full_profile: 'no filter (full profile)',
    meta_provider_gemini_api: 'Gemini API',
    llm_gemini_system_preamble:
      'Answer in English using only information from the documents. If something is not there, say so clearly. You may use bullet points.',
    llm_gemini_section_question: '--- QUESTION ---',
    llm_gemini_section_documents: '--- DOCUMENTS ---',
    llm_gemini_doc_heading: '### {name}\n',
    llm_gemini_between_docs: '\n\n---\n',
    llm_gemini_block_read_error: '### id {id}\n_Error: {err}_',
  },
};

/**
 * @param {'es'|'en'} locale
 * @param {string} key
 * @return {string}
 */
function UiStrings_t(locale, key) {
  var L = UI_STRINGS[locale] || UI_STRINGS.es;
  var v = L[key];
  if (v != null && v !== '') return v;
  return UI_STRINGS.es[key] != null ? UI_STRINGS.es[key] : key;
}

/**
 * @return {'es'|'en'}
 */
function UiStrings_activeLocale_() {
  return APP_UI_LOCALE === 'en' ? 'en' : 'es';
}

/**
 * @param {string} key
 * @param {Object<string,string|number>=} vars
 * @return {string}
 */
function UiStrings_fmt_(key, vars) {
  var s = UiStrings_t(UiStrings_activeLocale_(), key);
  if (!vars) return s;
  for (var k in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, k)) {
      s = s.split('{' + k + '}').join(String(vars[k]));
    }
  }
  return s;
}

/**
 * Objeto plano para HtmlService (un idioma activo).
 * @return {Object<string, string>}
 */
function UiStrings_getClientPack_() {
  var locale = UiStrings_activeLocale_();
  var src = UI_STRINGS[locale] || UI_STRINGS.es;
  /** @type {Object<string, string>} */
  var out = {};
  for (var k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  }
  out._locale = locale;
  return out;
}

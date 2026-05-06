/**
 * @fileoverview Catálogo único de textos de UI (es/en). No duplicar mensajes en HTML/JS en bruto.
 * Cambiá APP_UI_LOCALE para el idioma por defecto de la plantilla y del servidor.
 */

/** @type {'es'|'en'} */
var APP_UI_LOCALE = 'es';

var UI_STRINGS = {
  es: {
    app_title: 'Aviators',
    nav_home: 'Inicio',
    nav_agents: 'Agentes',
    nav_contents: 'Contenidos',
    nav_clients: 'Clientes',
    nav_metrics: 'Métricas',
    nav_faq: 'Ayuda / FAQ',
    page_faq_title: 'Preguntas frecuentes',
    page_faq_lead:
      'Guía para entender la idea general del sitio, cómo se reparte el trabajo entre el orquestador y los agentes especializados del chat, y cómo usar cada área (Inicio, Contenidos, Clientes, Agentes) según tu rol.',
    faq_sec_platform_heading: 'Glob.ai y motor de agentes',
    faq_sec_platform_lead:
      'Aviators está construido sobre Glob.ai: el stack que antes se conocía comercialmente como Globant Enterprise AI ahora actúa como “superpoder” detrás de la orquestación, los perfiles RAG y los agentes especializados del chat (indexación, consultas y administración cuando tu cuenta tiene permisos).',
    faq_sec_purpose_heading: '¿Para qué está pensado Aviators?',
    faq_sec_purpose_lead:
      'Aviators es una Web App sobre Google Workspace que concentra tres frentes: (1) consultar con IA usando tus propios documentos como fuente verificable; (2) administrar agentes RAG, instrucciones y carpetas de Drive cuando tenés permisos; (3) cargar PDFs con un flujo guiado —elegís el tipo de contenido, extraés metadatos con IA, revisás y guardás— para indexar cada ítem en el agente que corresponda (propuesta, success case o cliente). Así el chat puede apoyarse en material curado en lugar de respuestas genéricas.',
    faq_sec_visual_heading: 'Referencias visuales',
    faq_sec_visual_lead:
      'Esquemas simplificados del layout y los flujos principales (la interfaz real puede variar según tu pantalla e idioma).',
    faq_note_illustrations:
      'Son diagramas orientativos, no capturas fotográficas de datos reales.',
    faq_fig_shell_caption: 'Barra lateral con navegación, idioma y tema; panel principal con la página activa.',
    faq_fig_chat_caption: 'En Inicio podés chatear y adjuntar contexto desde Drive.',
    faq_fig_pipeline_caption: 'Flujo típico en Contenidos: tipo → PDF → revisión → guardado e indexación.',
    faq_sec_q_heading: 'Dudas habituales',
    faq_sec_q_lead:
      'Arriba está el detalle de cada agente del chat. Acá, expandí cada pregunta para respuestas breves sobre la app. Si falta permiso para algo, pedilo a quien administra roles en tu organización.',
    faq_sec_agents_heading: 'Agentes del chat: qué hace cada uno',
    faq_sec_agents_lead:
      'Cuando usás un modo asistido por varios perfiles RAG, un orquestador enruta la pregunta hacia uno o más especialistas. Cada uno está entrenado por instrucciones de sistema para ceñirse a su corpus indexado en Globant: no inventan hechos y, si no hay coincidencias, indican que no hallaron material en lugar de rellenar a ciegas.',
    faq_agent_orchestrator_title: 'Orquestador',
    faq_agent_orchestrator_detail_html:
      '<p>Su único objetivo es <strong>clasificar tu consulta</strong> y decidir qué agente(s) deben responder. No es un experto “de memoria”: cumple la función de enrutamiento.</p><p>Si la misma pregunta podría atenderse desde más de un repositorio, puede disparar <strong>varios agentes en paralelo</strong> (por ejemplo, “¿qué hicimos con el cliente X?” puede mezclar casos de éxito y propuestas).</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>Success cases</strong>: historias de implementación, resultados y referencias por industria o tecnología.</li><li><strong>Propuestas</strong>: alcance comercial, entregables, cronograma, esfuerzo, pricing, RFP u ofertas presupuestadas.</li><li><strong>Clientes</strong>: nómina de cuentas, proyectos activos o en mantenimiento y estado de la relación.</li><li><strong>Conversación general</strong>: saludos o charla breve sin consultar esos corpus se resuelve en un modo conversacional sin especialistas.</li></ul>',
    faq_agent_success_cases_title: 'Success cases',
    faq_agent_success_cases_detail_html:
      '<p>Responde <strong>solo</strong> con lo que esté en el repositorio indexado de success cases del estudio; no usa conocimiento externo como verdad documentada.</p><p>El foco son casos concretos y comparables: contexto, problema, solución implementada, resultados y aprendizajes, en tono ejecutivo y accionable. Cuando aplica, estructura en bloques tipo Caso, Contexto, Solución, Impacto y Riesgos. Si varios casos encajan, puede listarlos y ofrecer profundizar en uno.</p><p>Si el índice no contiene nada pertinente, la respuesta deja claro que <strong>no hay material alineado</strong> en lugar de inventar clientes, métricas o nombres de proyecto.</p>',
    faq_agent_proposals_title: 'Propuestas comerciales',
    faq_agent_proposals_detail_html:
      '<p>Se apoya exclusivamente en el repositorio indexado de <strong>propuestas comerciales</strong>. Orienta la respuesta a ventas y entrega: alcance, supuestos, entregables, fases, riesgos y próximos pasos, de forma breve y alineada a lo documentado.</p><p>Distingue en la práctica lo que está explícito en el PDF frente a inferencias; si falta un dato imprescindible, convendrá pedirlo antes de afirmar. No debe inventar precios, fechas, compromisos ni clientes no respaldados por el índice. Si hay varias propuestas relacionadas, puede resumirlas y preguntar en cuál profundizar.</p><p>Sin propuestas relevantes en el índice, comunica que <strong>no encontró coincidencias</strong> en lugar de fabricar ofertas.</p>',
    faq_agent_clients_title: 'Clientes y proyectos',
    faq_agent_clients_detail_html:
      '<p>Toma como única fuente la <strong>nómina indexada de clientes actuales y proyectos en mantenimiento</strong>. Objetivo: responder por cuenta, obra vigente, estado y continuidad de la relación.</p><p>No mezcla clientes ni proyectos sin evidencia en el índice; si el nombre es ambiguo, conviene aclarar la entidad antes de afirmar. Cuando aplica, organiza en bloques: Cliente, Proyectos vigentes, Estado, Riesgos o pendientes. No debe inventar contratos, revenue, alcance ni fechas.</p><p>Si el cliente o proyecto no aparece en el índice, la respuesta indica <strong>falta de información indexada</strong>, en lugar de suponer datos comerciales.</p>',
    faq_agents_admin_note:
      'Los administradores pueden ajustar instrucciones, perfiles Globant y carpetas de Drive en la sección Agentes; esta descripción refleja el comportamiento previsto por defecto en el código del sistema.',
    faq_q_what: '¿Qué es Aviators?',
    faq_a_what:
      'Es una Web App de Google Apps Script pensada para equipos que quieren conversar con modelos de IA sobre documentación propia: el conocimiento vive en Drive y en flujos de “Contenidos” que indexan PDFs en agentes RAG. Según tu rol, también gestionás el registro de agentes, la cartera en “Clientes” y el chat en Inicio, con orquestación hacia especialistas cuando el modo de despliegue lo habilita.',
    faq_q_flow: '¿Cómo empiezo después de iniciar sesión?',
    faq_a_flow:
      'Usá la barra lateral para ir a Inicio (tablero y chat), o a Agentes, Contenidos y Clientes si aparecen en tu menú. La búsqueda global está debajo de las entradas de navegación.',
    faq_q_chat: '¿Cómo funciona el chat de Inicio?',
    faq_a_chat:
      'Escribís tu pregunta en el área de mensajes y enviás. El modo de consulta técnico (Globant RAG, Assistant o Gemini según configuración) aparece en el cartel superior del chat. Cuando el despliegue usa varios perfiles indexados, un orquestador puede dirigir la pregunta a uno o más agentes —success cases, propuestas o clientes— según el tema. Podés mantener turnos sucesivos en la misma conversación.',
    faq_q_drive_ctx: '¿Qué son los archivos de contexto o Drive?',
    faq_a_drive_ctx:
      'Podés explorar carpetas de Drive y adjuntar archivos permitidos para que la respuesta se apoye en ellos, respetando límites de selección y formatos que la integración acepte.',
    faq_q_contents: '¿Qué hago en Contenidos?',
    faq_a_contents:
      'Creás o editás ítems de conocimiento: elegís el tipo (propuesta, success case, cliente), subís un PDF, pedís extraer metadata con IA, revisás los campos y guardás para indexar en el agente correspondiente.',
    faq_q_agents_clients: '¿Qué son Agentes y Clientes?',
    faq_a_agents_clients:
      'En Agentes, quien administra el proyecto registra cada especialista (perfil Globant, instrucciones, carpetas y archivos de Drive que alimentan el índice) y lanza la sincronización. La pantalla Clientes es la cartera operativa (industria, contacto, notas) alineada al negocio. El detalle de qué responde cada agente en el chat está en la sección “Agentes del chat” arriba.',
    faq_q_visibility: '¿Por qué no veo Agentes, Contenidos o Clientes?',
    faq_a_visibility:
      'Esas secciones dependen del rol asignado en el directorio interno. Si solo ves el aviso de visitante, tu cuenta aún no tiene permisos de miembro; contactá al equipo que gestiona la planilla o lista de acceso.',
    faq_q_roles: '¿Qué roles existen y qué puede hacer cada uno?',
    faq_a_roles_html:
      '<p>Los permisos se asignan desde la hoja de roles interna (columna <strong>Rol</strong>) y se aplican automáticamente en el menú y acciones:</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>visitante</strong>: acceso básico (Inicio/FAQ), chat con alcance acotado y sin acceso a datos internos sensibles.</li><li><strong>admin</strong>: acceso completo con escritura (Agentes, Contenidos, Clientes y Métricas), incluyendo operaciones de administración.</li><li><strong>presales</strong>: foco comercial-operativo con escritura en Contenidos/Clientes y lectura de Métricas.</li><li><strong>manager</strong>: lectura de Métricas y navegación general para seguimiento.</li><li><strong>tech</strong>: lectura en Agentes, Contenidos, Clientes y Métricas; sin acciones de escritura.</li><li><strong>client partner</strong>: lectura en Agentes, Contenidos, Clientes y Métricas; sin acciones de escritura.</li></ul><p class="mt-2">Si necesitás cambiar de rol o ampliar permisos, pedilo al administrador de la planilla de roles.</p>',
    faq_q_misc: '¿Dónde cambio idioma, tema oscuro o exporto datos?',
    faq_a_misc:
      'Idioma y modo claro/oscuro están al pie del panel lateral. En listas de Contenidos y Clientes hay acciones de exportación/importación CSV cuando correspondan.',
    page_contents_title: 'Contenidos del agente',
    page_contents_lead:
      'Subí contenido, extraé metadata, revisá y guardá para indexar automáticamente en el agente correspondiente.',
    contents_btn_new: 'Nuevo contenido',
    contents_btn_back_list: 'Volver a la lista',
    contents_editor_title_new: 'Nuevo contenido',
    contents_editor_title_edit: 'Editar contenido',
    contents_editor_subtitle_new:
      'Elegí el tipo, subí el PDF y revisá los datos antes de guardar.',
    contents_editor_subtitle_edit:
      'Ajustá los datos o reemplazá el archivo para reindexar.',
    contents_step_type: 'Tipo',
    contents_step_file: 'Archivo',
    contents_step_review: 'Revisión',
    contents_type_helper:
      'Esto define a qué agente se va a indexar el contenido.',
    contents_dropzone_title: 'Arrastrá un PDF o elegí uno',
    contents_current_file_label: 'Archivo procesado',
    contents_btn_replace_file: 'Reemplazar',
    contents_list_heading: 'Lista de contenidos',
    contents_list_lead:
      'Seleccioná una fila para editarla o reemplazar archivo y reprocesar todo el flujo.',
    contents_filter_type: 'Tipo',
    contents_filter_query: 'Buscar',
    contents_filter_query_ph: 'Título, cliente o resumen',
    contents_type_all: 'Todos',
    contents_type_pick: 'Elegir tipo…',
    contents_type_proposal: 'Propuesta',
    contents_type_success_case: 'Success case',
    contents_type_client: 'Cliente',
    contents_legend_title: 'Agentes:',
    contents_col_title: 'Título',
    contents_col_type: 'Tipo',
    contents_col_client: 'Cliente',
    contents_col_updated: 'Actualizado',
    contents_col_actions: 'Acciones',
    contents_btn_edit: 'Editar',
    contents_list_empty: 'No hay contenidos cargados todavía.',
    contents_list_count: '{n} contenido(s).',
    contents_editor_heading: 'Editor de contenido',
    contents_editor_lead:
      'Cargá un PDF, extraé metadata con el orquestador y ajustá antes de guardar.',
    contents_lbl_type: 'Tipo de contenido',
    contents_dropzone_hint:
      'Solo PDF. Apenas lo seleccionés se sube, se extrae metadata y se prepara para indexar.',
    contents_btn_pick_file: 'Elegir archivo',
    contents_btn_upload: 'Subir archivo',
    contents_btn_extract: 'Extraer metadata',
    contents_file_pending_upload: 'Archivo seleccionado: {name} (pendiente de subir).',
    contents_busy_processing: 'Procesando archivo…',
    contents_step_reading: 'Leyendo archivo…',
    contents_step_uploading: 'Enviando a análisis',
    contents_step_analyzing: 'Analizando documento',
    contents_step_extracting: 'Extrayendo metadata',
    contents_step_analyzing_inline: 'Analizando documento con IA…',
    contents_btn_cancel_upload: 'Cancelar',
    contents_cancel_confirm:
      'Se descartará el archivo subido y los datos extraídos. ¿Continuar?',
    contents_cancelled: 'Operación cancelada.',
    contents_lbl_title: 'Título',
    contents_lbl_summary: 'Resumen',
    contents_lbl_client: 'Cliente',
    contents_lbl_tags: 'Hashtags',
    contents_ph_add_tag: '#nuevoTag',
    contents_btn_add_tag: 'Agregar',
    contents_specific_proposal_heading: 'Campos de propuesta',
    contents_specific_success_heading: 'Campos de success case',
    contents_specific_client_heading: 'Campos de cliente',
    contents_lbl_stage: 'Stage',
    contents_lbl_pricing_model: 'Modelo de pricing',
    contents_lbl_effort: 'Esfuerzo estimado',
    contents_lbl_notes: 'Notas',
    contents_lbl_challenge: 'Challenge',
    contents_lbl_solution: 'Solution',
    contents_lbl_impact_value: 'Impacto',
    contents_lbl_account_status: 'Estado de cuenta',
    contents_lbl_active_projects: 'Proyectos activos',
    contents_lbl_health_score: 'Health score',
    contents_btn_save: 'Guardar',
    contents_btn_delete: 'Eliminar',
    contents_btn_cancel: 'Cancelar',
    contents_busy_loading: 'Cargando contenidos…',
    contents_busy_opening: 'Abriendo contenido…',
    contents_file_opening: 'Abriendo archivo en Drive…',
    contents_file_not_found: 'No encontré el archivo en Drive.',
    contents_busy_uploading: 'Subiendo archivo…',
    contents_busy_extracting: 'Extrayendo metadata…',
    contents_busy_saving: 'Indexando y guardando…',
    contents_busy_deleting: 'Eliminando del índice y catálogo…',
    contents_extraction_done:
      'Metadata extraída. Revisá y ajustá antes de guardar.',
    contents_uploaded: 'Archivo subido. Ahora podés extraer metadata.',
    contents_saved: 'Contenido guardado.',
    contents_deleted: 'Contenido eliminado.',
    contents_confirm_delete:
      'Se eliminará del catálogo y del índice del agente. ¿Continuar?',
    contents_err_pick_file: 'Elegí un archivo PDF.',
    contents_err_pick_type: 'Elegí un tipo de contenido.',
    contents_err_upload_first: 'Primero subí un archivo.',
    contents_err_upload_read:
      'No se pudo leer el archivo local. Intentá nuevamente.',
    contents_err_upload_failed: 'No se pudo subir el archivo.',
    contents_err_title_required: 'El título es obligatorio.',
    contents_err_extract_first:
      'Primero cargá y extraé metadata para obtener el archivo de trabajo.',
    contents_err_pick_row: 'Elegí una fila para eliminar.',
    contents_row_busy: 'Procesando…',
    contents_index_repair_needed: 'No indexado',
    contents_btn_repair_index: 'Arreglar',
    contents_busy_repairing_index: 'Reindexando desde Drive…',
    contents_repair_done: 'Contenido reindexado desde Drive.',
    contents_repair_removed:
      'El archivo ya no existe en Drive: se limpió el índice y se quitó la fila.',
    contents_repair_failed: 'No se pudo reparar el índice.',
    admin_contents_empty:
      'No hay agentes todavía. Creá uno en la pestaña Agentes.',
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
    home_welcome_title: 'Bienvenido a la suite agéntica de Aviators',
    home_welcome_lead_html:
      'Para más información de uso ir al <a href="#" data-nav-page="faq" class="font-medium text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">FAQ</a>, o hacé una pregunta directamente.',
    dashboard_title: 'Inicio',
    dashboard_lead:
      'Escribí abajo y seguí la conversación arriba. Las respuestas aparecen como mensajes.',
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
    mobile_menu_open_aria: 'Abrir menú',
    mobile_menu_close_aria: 'Cerrar menú',
    mobile_menu_backdrop_aria: 'Cerrar panel lateral',
    sidebar_language: 'Idioma',
    lang_option_es: 'Español',
    lang_option_en: 'Inglés',
    theme_dark: 'Modo oscuro',
    theme_light: 'Modo claro',
    dash_agents_title: 'Agentes',
    dash_contents_title: 'Contenidos',
    dash_clients_title: 'Clientes',
    contents_readonly_notice: 'Solo lectura',
    clients_readonly_notice: 'Solo lectura',
    dash_detail_empty: 'Sin desglose todavía.',
    dash_agent_kind_orchestrator: 'Orquestador',
    dash_agent_kind_success_cases: 'Success cases',
    dash_agent_kind_proposals: 'Propuestas',
    dash_agent_kind_clients: 'Clientes (corpus)',
    dash_agent_kind_other: 'Personalizado',
    dash_agent_kind_other_named: '{name}',
    dash_agents_strategies_line: 'Estrategias: {list}',
    dash_industry_unknown: 'Sin industria',
    global_search_ph: 'Buscar en todo…',
    global_search_no_results: 'Sin resultados.',
    global_search_group_agents: 'Agentes',
    global_search_group_contents: 'Contenidos',
    global_search_group_clients: 'Clientes',
    batch_selected: '{n} seleccionados',
    batch_delete_selected: 'Eliminar seleccionados',
    batch_delete_confirm: '¿Eliminar {n} elementos seleccionados?',
    batch_deleting: 'Eliminando {done} de {total}…',
    batch_done: '{n} elementos eliminados.',
    batch_sync_selected: 'Sincronizar seleccionados',
    batch_sync_confirm: '¿Sincronizar {n} agentes seleccionados?',
    batch_syncing: 'Sincronizando {done} de {total}…',
    batch_sync_done: '{n} agentes sincronizados.',
    batch_agents_delete_confirm: '¿Eliminar {n} agentes seleccionados?',
    batch_agents_deleting: 'Eliminando {done} de {total}…',
    batch_agents_delete_done: '{done}/{total} agentes eliminados.',
    export_csv: 'Exportar CSV',
    import_csv: 'Importar CSV',
    export_done: 'Exportación completada.',
    export_no_data: 'No hay datos para exportar.',
    import_empty: 'El archivo CSV está vacío.',
    import_preview_title: 'Vista previa de importación',
    import_preview_rows: '{n} filas a importar.',
    import_confirm: 'Importar {n} filas',
    import_cancel: 'Cancelar',
    import_progress: 'Importando {done} de {total}…',
    import_done: '{n} filas importadas.',
    import_errors: '({n} con errores)',
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
    static_consult_heading: 'Conversación con el asistente',
    static_consult_lead:
      'Los mensajes quedan arriba; solo esa zona hace scroll. Enter envía; Shift+Enter baja de línea.',
    static_drive_explorer_heading: 'Explorador de Drive',
    static_drive_explorer_lead:
      'Navegá tus carpetas y archivos (solo lectura, misma cuenta que inició sesión). Los archivos se abren en una pestaña nueva.',
    btn_mi_drive: 'Mi Drive',
    btn_back: 'Volver',
    btn_load_more: 'Cargar más',
    lbl_chat_input_sronly: 'Tu mensaje',
    lbl_question_sronly: 'Pregunta',
    chat_new_conversation: 'Nueva conversación',
    chat_empty_hint:
      'Todavía no hay mensajes. Escribí abajo y tocá enviar para ver la respuesta del asistente.',
    chat_thinking: 'El asistente está escribiendo…',
    chat_no_relevant_content: 'No encontré información relevante en mi base de conocimiento para responder tu consulta. ¿Podrías reformularla o hacer una pregunta más específica?',
    chat_sr_you: 'Vos',
    chat_sr_agent: 'Asistente',
    chat_refs_title: 'Fuentes relacionadas',
    chat_refs_open_link: 'Abrir archivo',
    chat_ref_not_found: 'No encontré el archivo en Drive.',
    home_chat_banner_setup:
      'El asistente no está disponible por ahora. Si el problema sigue, contactá a quien administra Aviators.',
    ph_question: 'Escribí tu mensaje…',
    ask_agent_btn: 'Enviar',
    ask_btn: 'Enviar con documentos',
    static_drive_files_heading: 'Archivos de contexto',
    static_drive_files_lead:
      'Marcá hasta 5 archivos recientes para que entren en esta respuesta.',
    page_agents_title: 'Administración de agentes',
    page_agents_lead:
      'Cada agente define el nombre del perfil en Globant, las instrucciones del modelo y las fuentes para indexar. Guardá los cambios y sincronizá cuando estés listo.',
    page_agents_readonly_lead:
      'Vista de solo lectura de la configuración de agentes. Podés consultar definición, prompt y fuentes, sin editar ni sincronizar.',
    admin_agent_sec_profile_heading: 'Perfil del agente',
    admin_agent_sec_profile_lead:
      'Nombre del perfil RAG en Globant. Tiene que ser único entre tus agentes.',
    admin_agent_sec_prompt_heading: 'Instrucciones',
    admin_agent_sec_prompt_lead:
      'Plantilla opcional que orienta cómo usa el contexto recuperado al responder.',
    admin_agent_sec_api_heading: 'Configuración Agent API (v2)',
    admin_agent_sec_api_lead:
      'Estos campos guardan la definición editable del agente para create/update vía API: modelo, estrategia, prompt y parámetros LLM.',
    admin_agent_sec_actions_heading: 'Guardar y sincronizar',
    admin_agent_sec_actions_lead:
      'Primero guardá perfil, instrucciones y PDF elegidos. Después sincronizá para subirlos al índice en Globant. Eliminar saca el agente del registro en Aviators.',
    admin_agent_sec_sources_heading: 'Fuentes para el índice',
    admin_agent_sec_sources_lead:
      'Arrastrá o elegí PDF aquí; se suben a tu Drive y aparecen como chips abajo.',
    admin_agent_sec_indexed_lead:
      'Listado remoto en Globant para este perfil. Refrescá la lista después de sincronizar.',
    admin_agent_dropzone_aria: 'Zona para arrastrar archivos PDF',
    admin_agent_dropzone_hint:
      'Arrastrá uno o varios PDF aquí, o elegí archivos en tu equipo.',
    btn_admin_agent_upload_pdf: 'Elegir PDF',
    btn_go_agents: 'Ir a Agentes',
    admin_upload_progress: 'Subiendo archivo {current} de {total}…',
    admin_upload_done_added:
      'Se añadieron {n} archivo(s) a la selección. Guardá el agente si querés persistir.',
    err_admin_upload_only_pdf:
      'Solo se pueden subir archivos PDF para este corpus.',
    err_admin_upload_empty: 'Archivo vacío: «{name}».',
    err_admin_upload_decode: 'No se pudo leer el archivo «{name}».',
    err_admin_upload_too_large:
      'El archivo «{name}» supera el tamaño máximo permitido.',
    err_admin_upload_mime:
      'Tipo no válido para el corpus («{name}»: {mime}). Usá PDF.',
    err_admin_upload_failed: 'No se pudo subir «{name}».',
    admin_sec_title: 'Agentes',
    admin_agent_new: 'Nuevo agente',
    admin_agent_seed_defaults: 'Generar agentes por defecto',
    lbl_admin_agent_profile: 'Nombre del perfil',
    ph_admin_agent_profile: 'ej. mi-corpus-aviators',
    lbl_admin_agent_prompt: 'Instrucciones del agente',
    lbl_admin_agent_api_id_or_name: 'idOrName (update/upsert)',
    ph_admin_agent_api_id_or_name: 'ej. DeepResearcher o UUID',
    lbl_admin_agent_api_name: 'Nombre del agente (API)',
    ph_admin_agent_api_name: 'ej. aviators-success-cases',
    lbl_admin_agent_api_model: 'Modelo LLM',
    ph_admin_agent_api_model: 'ej. gpt-4o',
    lbl_admin_agent_api_strategy: 'Reasoning strategy',
    ph_admin_agent_api_strategy: 'ej. Chain of Thought',
    lbl_admin_agent_api_max_tokens: 'Max tokens',
    lbl_admin_agent_api_timeout: 'Timeout (segundos)',
    lbl_admin_agent_api_temperature: 'Temperature',
    lbl_admin_agent_api_access_scope: 'Access scope',
    lbl_admin_agent_api_sharing_scope: 'Sharing scope',
    lbl_admin_agent_api_status: 'Estado',
    lbl_admin_agent_api_automatic_publish:
      'Publicar automáticamente al aplicar update/upsert',
    lbl_admin_agent_api_job_description: 'Job description',
    lbl_admin_agent_api_description: 'Description',
    lbl_admin_agent_api_avatar: 'Avatar URL',
    ph_admin_agent_api_avatar: 'https://...',
    lbl_admin_agent_api_prompt_context: 'Prompt context',
    opt_admin_agent_private: 'private',
    opt_admin_agent_public: 'public',
    opt_admin_agent_sharing_organization: 'organization',
    opt_admin_agent_sharing_none: 'none',
    opt_admin_agent_sharing_everybody: 'everybody',
    opt_admin_agent_status_active: 'active',
    opt_admin_agent_status_inactive: 'inactive',
    admin_agent_prompt_hint_html:
      'Opcional. Usá <code>{context}</code> y <code>{question}</code> en la plantilla si aplica. Vacío = valor por defecto.',
    btn_admin_agent_save: 'Guardar agente',
    btn_admin_agent_sync: 'Sincronizar índice',
    btn_admin_agent_delete: 'Eliminar agente',
    btn_admin_agent_refresh_docs: 'Actualizar documentos',
    admin_agent_globant_docs: 'Documentos indexados',
    admin_agent_empty_select: 'Elegí un agente en la lista o creá uno nuevo.',
    admin_agent_list_empty: 'Todavía no hay agentes.',
    agents_ro_empty_select:
      'Elegí un agente en la lista para ver su configuración.',
    agents_ro_detail_heading: 'Detalle del agente',
    admin_agent_last_sync_label: 'Última sincronización',
    agents_ro_sources_label: 'Fuentes del índice',
    admin_busy_agent_save: 'Guardando agente…',
    admin_busy_agent_seed: 'Generando agentes por defecto…',
    admin_agent_seed_loader_hint:
      'Si hace falta, se crea el archivo de registro en Drive y se añaden los agentes que falten. Puede tardar unos segundos.',
    admin_busy_agent_sync: 'Sincronizando índice (puede tardar)…',
    admin_busy_agent_delete: 'Eliminando…',
    admin_agent_saved: 'Agente guardado en Aviators y Globant.',
    admin_agent_seed_done_added:
      'Se crearon {n} agente(s) por defecto faltantes.',
    admin_agent_seed_done_noop:
      'Ya existían todos los agentes por defecto.',
    admin_agent_last_sync: 'Última sincronización: {date}',
    admin_agent_sync_done:
      'Listo: perfil «{profile}» · subidos {uploaded}/{total}.',
    err_admin_agent_payload: 'Datos del agente no válidos.',
    err_admin_agent_profile_name:
      'El nombre del perfil debe tener 2–80 caracteres: letras, números, guión bajo o medio; debe empezar con letra o número.',
    err_admin_agent_duplicate: 'Ya existe un agente con el perfil «{name}».',
    err_admin_agent_api_model_required:
      'Para guardar en Globant API tenés que indicar un modelo LLM.',
    err_admin_agent_api_id:
      'Falta idOrName para guardar en Globant API.',
    err_admin_agent_id: 'Falta el identificador del agente.',
    err_admin_agent_not_found: 'No se encontró ese agente.',
    err_admin_agent_seed:
      'No se pudieron crear o verificar los agentes por defecto.',
    confirm_delete_agent_registry:
      '¿Eliminar este agente de Aviators? Si existe en Globant (modo RAG), también se pedirá borrar el perfil allí.',
    admin_agent_delete_modal_title: '¿Eliminar este agente?',
    admin_agent_delete_modal_cancel: 'Cancelar',
    admin_agent_delete_modal_confirm: 'Sí, eliminar',
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
    btn_close: 'Cerrar',
    chip_folder: 'CARPETA',
    chip_file: 'ARCHIVO',
    chip_remove_aria: 'Quitar',
    admin_need_email_drive: 'Necesitás sesión con email para explorar Drive.',
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
    gc_view_file: 'Ver',
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
    orch_step_routing: 'Analizando tu consulta…',
    orch_step_delegating: 'Delegando a {agent}…',
    orch_step_answering: '{agent} está respondiendo…',
    orch_step_multi: 'Consultando a {agents}…',
    orch_routed_badge: 'Respondido por {agent}',
    orch_no_results:
      'Ninguno de los agentes encontró contenido relevante en su índice para esta consulta.',
    err_ask_agent: 'Error al llamar al API.',
    ask_max_docs: 'Podés seleccionar como máximo {max} documentos.',
    consult_heading_globant: 'Preguntale al agente',
    consult_heading_gemini: 'Pregunta con Gemini y documentos',
    consult_heading_none: 'Consultas (sin modelo configurado)',
    drive_heading_globant:
      'Selección desde Drive oculta: en Globant preguntás al perfil/agente configurado.',
    drive_heading_gemini: 'Archivos para esta respuesta',
    drive_heading_plain: 'Archivos',
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
    err_orchestrator_missing:
      'No se encontró el agente orquestador en la configuración.',
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
    meta_filter_profile: 'perfil = {profile}',
    meta_orchestrator_selected_agent:
      'Enrutado a {agent} · confianza {confidence}',
    meta_provider_gemini_api: 'Gemini API',
    llm_gemini_system_preamble:
      'Respondé en español usando solo información de los documentos. Si algo no aparece ahí, decilo claramente. Podés usar viñetas.',
    llm_gemini_section_question: '--- PREGUNTA ---',
    llm_gemini_section_documents: '--- DOCUMENTOS ---',
    llm_gemini_doc_heading: '### {name}\n',
    llm_gemini_between_docs: '\n\n---\n',
    llm_gemini_block_read_error: '### id {id}\n_Error: {err}_',
    page_clients_title: 'Clientes',
    page_clients_lead:
      'Gestioná tu cartera de clientes. Podés agregar metadata como industria, país y contacto principal.',
    clients_btn_new: 'Nuevo cliente',
    clients_btn_back_list: 'Volver a la lista',
    clients_th_name: 'Nombre',
    clients_th_industry: 'Industria',
    clients_th_country: 'País',
    clients_th_contact: 'Contacto',
    clients_th_actions: 'Acciones',
    clients_lbl_name: 'Nombre del cliente',
    clients_lbl_industry: 'Industria',
    clients_lbl_country: 'País',
    clients_lbl_contact_name: 'Nombre del contacto',
    clients_lbl_contact_email: 'Email del contacto',
    clients_lbl_notes: 'Notas',
    clients_btn_save: 'Guardar cliente',
    clients_btn_delete: 'Eliminar',
    clients_btn_cancel: 'Cancelar',
    clients_busy_loading: 'Cargando clientes…',
    clients_busy_saving: 'Guardando cliente…',
    clients_busy_deleting: 'Eliminando cliente…',
    clients_saved: 'Cliente guardado.',
    clients_deleted: 'Cliente eliminado.',
    clients_err_name_required: 'El nombre del cliente es requerido.',
    clients_confirm_delete: '¿Eliminar este cliente permanentemente?',
    clients_no_items: 'No hay clientes registrados.',
    clients_load_more: 'Cargar más',
    clients_showing_of: 'Mostrando {shown} de {total}.',
    contents_client_combo_new: '+ Agregar nuevo cliente',
    contents_client_combo_placeholder: 'Seleccionar cliente…',
    contents_load_more: 'Cargar más',
    contents_showing_of: 'Mostrando {shown} de {total}.',
    page_metrics_title: 'Métricas',
    page_metrics_lead:
      'Seguimiento operativo del uso del chat, no respondidas y desempeño por agente, cliente e industria.',
    metrics_range_label: 'Ventana',
    metrics_range_30d: 'Últimos 30 días',
    metrics_range_90d: 'Últimos 90 días',
    metrics_range_12m: 'Últimos 12 meses',
    metrics_refresh_btn: 'Actualizar métricas',
    metrics_reset_btn: 'Resetear métricas',
    metrics_reset_confirm:
      'Esto borrará todo el histórico de métricas. ¿Querés continuar?',
    metrics_reset_busy: 'Reseteando métricas…',
    metrics_reset_done: 'Métricas reseteadas.',
    metrics_reset_error: 'No se pudieron resetear las métricas.',
    metrics_overview_heading: 'Resumen',
    metrics_overview_lead:
      'Indicadores globales para entender volumen de preguntas y consultas sin respuesta.',
    metrics_total_questions: 'Preguntas',
    metrics_total_unanswered: 'No respondidas',
    metrics_trend_heading: 'Tendencia temporal',
    metrics_trend_lead:
      'Evolución diaria del uso de preguntas y consultas no respondidas en la ventana elegida.',
    metrics_agent_usage_heading: 'Uso por agente',
    metrics_agent_usage_lead:
      'Cuántas preguntas se dirigieron a cada agente en el período seleccionado.',
    metrics_leaderboards_heading: 'Leaderboards',
    metrics_leaderboards_lead:
      'Rankings de adopción por usuario y desempeño del catálogo por cliente/industria.',
    metrics_lb_users: 'Personas usando el chat (preguntas)',
    metrics_lb_agents: 'Preguntas por agente',
    metrics_lb_success_client: 'Success cases por cliente',
    metrics_lb_success_industry: 'Success cases por industria',
    metrics_lb_proposal_client: 'Propuestas por cliente',
    metrics_lb_proposal_industry: 'Propuestas por industria',
    metrics_unanswered_heading: 'Consultas no respondidas',
    metrics_unanswered_lead:
      'Historial de preguntas donde no hubo contenido suficiente para responder.',
    metrics_th_date: 'Fecha',
    metrics_th_user: 'Usuario',
    metrics_th_agent: 'Agente',
    metrics_th_question: 'Pregunta',
    metrics_th_reason: 'Motivo',
    metrics_loading_dashboard: 'Cargando dashboard de métricas…',
    metrics_loading_unanswered: 'Cargando consultas no respondidas…',
    metrics_loaded: 'Métricas actualizadas.',
    metrics_load_error: 'No se pudieron cargar las métricas.',
    metrics_empty: 'Sin datos para mostrar.',
    metrics_pagination_info: 'Mostrando {from}–{to} de {total}.',
    metrics_pagination_empty: 'No hay registros.',
    pagination_prev: 'Anterior',
    pagination_next: 'Siguiente',
    err_metrics_only:
      'Solo usuarios con rol admin, manager, presales, tech o client partner pueden ver métricas.',
    err_metrics_reset_only:
      'Solo administradores pueden resetear métricas.',
    context_files_loading: 'Cargando archivos de contexto…',
  },
  en: {
    app_title: 'Aviators',
    nav_home: 'Home',
    nav_agents: 'Agents',
    nav_contents: 'Content',
    nav_clients: 'Clients',
    nav_metrics: 'Metrics',
    nav_faq: 'Help / FAQ',
    page_faq_title: 'Frequently asked questions',
    page_faq_lead:
      'How the product fits together: the big picture, how the orchestrator splits work among specialized chat agents, and how to use Home, Content, Clients and Agents based on your role.',
    faq_sec_platform_heading: 'Glob.ai and the agent runtime',
    faq_sec_platform_lead:
      'Aviators runs on Glob.ai—the stack formerly marketed as Globant Enterprise AI—which now superpowers orchestration, RAG profiles and the specialized chat agents (indexing, Q&A and administration when your account is permitted).',
    faq_sec_purpose_heading: 'What is Aviators for?',
    faq_sec_purpose_lead:
      'Aviators is a Google Workspace web app built around three pillars: (1) ask AI questions with your own documents as the trusted source; (2) administer RAG agents, prompts and Drive folders when you have permissions; (3) upload PDFs through a guided flow—pick a content type, run AI metadata extraction, review and save—so each item is indexed into the right agent (proposal, success case or client). That way chat answers draw on curated material instead of generic guesses.',
    faq_sec_visual_heading: 'Visual reference',
    faq_sec_visual_lead:
      'Simplified sketches of layout and main flows (your actual UI may vary by screen size and language).',
    faq_note_illustrations:
      'These are illustrative diagrams, not photographic screenshots of real data.',
    faq_fig_shell_caption: 'Sidebar with navigation, locale and theme; main panel shows the active page.',
    faq_fig_chat_caption: 'On Home you can chat and attach context from Drive.',
    faq_fig_pipeline_caption: 'Typical Content flow: type → PDF → review → save and index.',
    faq_sec_q_heading: 'Common questions',
    faq_sec_q_lead:
      'Above you will find each chat agent explained in detail. Expand the questions here for quick answers about the app. If a feature is unavailable, ask whoever manages roles in your organization.',
    faq_sec_agents_heading: 'Chat agents: what each one does',
    faq_sec_agents_lead:
      'When several indexed RAG profiles are enabled, an orchestrator routes your question to one or more specialists. System prompts train each agent to stick to its Globant-indexed corpus: they must not fabricate facts, and when nothing matches they say so instead of filling gaps blindly.',
    faq_agent_orchestrator_title: 'Orchestrator',
    faq_agent_orchestrator_detail_html:
      '<p>Its only job is to <strong>classify your question</strong> and decide which agent(s) should answer. It is not a subject-matter “memory expert”—it routes traffic.</p><p>If one question could be answered from more than one corpus, it may call <strong>multiple agents in parallel</strong> (for example, “what did we do for client X?” may combine success stories and proposals).</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>Success cases</strong>: delivery stories, outcomes and references by industry or technology.</li><li><strong>Proposals</strong>: commercial scope, deliverables, schedule, effort, pricing, RFPs or budgeted bids.</li><li><strong>Clients</strong>: account roster, active or maintenance projects and relationship status.</li><li><strong>General chat</strong>: brief greetings or small talk without those corpora uses a conversational mode without specialists.</li></ul>',
    faq_agent_success_cases_title: 'Success cases',
    faq_agent_success_cases_detail_html:
      '<p>Answers <strong>only</strong> from the studio’s indexed success-case repository; it does not treat the open web as vetted knowledge.</p><p>The goal is concrete, comparable cases: context, problem, implemented solution, outcomes and learnings, in an executive, actionable tone. When useful, it uses blocks like Case, Context, Solution, Impact and Risks. If several cases fit, it may list them and offer to go deeper on one.</p><p>If the index has no relevant material, the reply makes clear there is <strong>no aligned content</strong> rather than inventing clients, metrics or project names.</p>',
    faq_agent_proposals_title: 'Commercial proposals',
    faq_agent_proposals_detail_html:
      '<p>Grounds exclusively in the indexed <strong>commercial proposal</strong> corpus. It frames answers around sales and delivery: scope, assumptions, deliverables, phases, risks and next steps—brief and faithful to what is documented.</p><p>In practice it separates what the PDF states from inference; if a critical fact is missing, it should ask before asserting. It must not invent prices, dates, commitments or undocumented clients. If several proposals relate to the ask, it may summarize them and ask which one to deepen.</p><p>With no matching proposals in the index, it reports <strong>no relevant hits</strong> instead of fabricating offers.</p>',
    faq_agent_clients_title: 'Clients and projects',
    faq_agent_clients_detail_html:
      '<p>Uses only the indexed roster of <strong>current clients and maintenance projects</strong>. Goal: answer by account, active work, status and relationship continuity.</p><p>It does not mix clients or projects without evidence in the index; ambiguous names should be clarified before stating facts. When it helps, it organizes into Client, Active projects, Status, and Risks or open items. It must not invent contracts, revenue, scope or dates.</p><p>If the client or project is not in the index, the reply signals <strong>missing indexed information</strong> instead of guessing commercial details.</p>',
    faq_agents_admin_note:
      'Administrators can edit prompts, Globant profiles and Drive folders under Agents; this page reflects the default behavior shipped with the system.',
    faq_q_what: 'What is Aviators?',
    faq_a_what:
      'A Google Apps Script web app for teams that want AI conversations anchored in their own documents: knowledge lives in Drive and in Content workflows that index PDFs into RAG agents. Depending on your role you also manage the agent registry, the Clients portfolio and Home chat, with orchestration to specialists when the deployment enables it.',
    faq_q_flow: 'What should I do right after signing in?',
    faq_a_flow:
      'Use the sidebar for Home (dashboard and chat), or Agents, Content and Clients if they appear. Global search sits below the nav items.',
    faq_q_chat: 'How does Home chat work?',
    faq_a_chat:
      'Type in the message area and send. The technical consultation mode (Globant RAG, Assistant or Gemini depending on setup) is shown in the banner above the chat. When several indexed profiles are enabled, an orchestrator may route the question to one or more agents—success cases, proposals or clients—based on the topic. You can keep multiple turns in one thread.',
    faq_q_drive_ctx: 'What about Drive or context files?',
    faq_a_drive_ctx:
      'You can browse Drive folders and attach allowed files so answers use them, within selection limits and formats the integration accepts.',
    faq_q_contents: 'What do I do under Content?',
    faq_a_contents:
      'Create or edit knowledge items: pick a type (proposal, success case, client), upload a PDF, run AI metadata extraction, review fields, then save to index into the right agent.',
    faq_q_agents_clients: 'What are Agents and Clients?',
    faq_a_agents_clients:
      'Under Agents, project admins register each specialist (Globant profile, prompts, Drive folders and files feeding the index) and run sync jobs. Clients is the operational account view (industry, contacts, notes) aligned with the business. For what each chat agent answers, see the “Chat agents” section above.',
    faq_q_visibility: "Why don't I see Agents, Content or Clients?",
    faq_a_visibility:
      'Those areas depend on your role in the internal directory. If you only see the visitor notice, your account is not a full member yet—ask whoever manages the roster or access list.',
    faq_q_roles: 'What roles exist and what can each one do?',
    faq_a_roles_html:
      '<p>Permissions come from the internal role sheet (the <strong>Role</strong> column) and are enforced automatically in menus and actions:</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>visitante</strong>: basic access (Home/FAQ), chat with constrained scope, and no sensitive internal data access.</li><li><strong>admin</strong>: full write access (Agents, Content, Clients and Metrics), including administrative operations.</li><li><strong>presales</strong>: commercial/operational focus with write access in Content/Clients and metrics visibility.</li><li><strong>manager</strong>: metrics visibility and general navigation for follow-up.</li><li><strong>tech</strong>: read-only access across Agents, Content, Clients and Metrics; no write actions.</li><li><strong>client partner</strong>: read-only access across Agents, Content, Clients and Metrics; no write actions.</li></ul><p class="mt-2">If you need a role change or broader permissions, contact the administrator of the role sheet.</p>',
    faq_q_misc: 'Where do I change language, dark mode or export data?',
    faq_a_misc:
      'Locale and light/dark mode are at the bottom of the sidebar. Content and Clients lists include CSV export/import actions when available.',
    page_contents_title: 'Agent content',
    page_contents_lead:
      'Upload content, extract metadata, review and save it to auto-index into the matching agent.',
    contents_btn_new: 'New content',
    contents_btn_back_list: 'Back to list',
    contents_editor_title_new: 'New content',
    contents_editor_title_edit: 'Edit content',
    contents_editor_subtitle_new:
      'Pick a type, upload the PDF and review the data before saving.',
    contents_editor_subtitle_edit:
      'Adjust the data or replace the file to re-index.',
    contents_step_type: 'Type',
    contents_step_file: 'File',
    contents_step_review: 'Review',
    contents_type_helper:
      'This decides which agent the content gets indexed into.',
    contents_dropzone_title: 'Drop a PDF or pick one',
    contents_current_file_label: 'Processed file',
    contents_btn_replace_file: 'Replace',
    contents_list_heading: 'Content list',
    contents_list_lead:
      'Pick a row to edit it, or replace its file and run the full process again.',
    contents_filter_type: 'Type',
    contents_filter_query: 'Search',
    contents_filter_query_ph: 'Title, client or summary',
    contents_type_all: 'All',
    contents_type_pick: 'Pick type…',
    contents_type_proposal: 'Proposal',
    contents_type_success_case: 'Success case',
    contents_type_client: 'Client',
    contents_legend_title: 'Agents:',
    contents_col_title: 'Title',
    contents_col_type: 'Type',
    contents_col_client: 'Client',
    contents_col_updated: 'Updated',
    contents_col_actions: 'Actions',
    contents_btn_edit: 'Edit',
    contents_list_empty: 'No content items yet.',
    contents_list_count: '{n} item(s).',
    contents_editor_heading: 'Content editor',
    contents_editor_lead:
      'Upload a PDF, extract metadata with the orchestrator, then adjust before saving.',
    contents_lbl_type: 'Content type',
    contents_dropzone_hint:
      'PDF only. As soon as you pick it we upload, extract metadata and prepare to index.',
    contents_btn_pick_file: 'Choose file',
    contents_btn_upload: 'Upload file',
    contents_btn_extract: 'Extract metadata',
    contents_file_pending_upload: 'Selected file: {name} (pending upload).',
    contents_busy_processing: 'Processing file…',
    contents_step_reading: 'Reading file…',
    contents_step_uploading: 'Sending for analysis',
    contents_step_analyzing: 'Analyzing document',
    contents_step_extracting: 'Extracting metadata',
    contents_step_analyzing_inline: 'Analyzing document with AI…',
    contents_btn_cancel_upload: 'Cancel',
    contents_cancel_confirm:
      'The uploaded file and extracted data will be discarded. Continue?',
    contents_cancelled: 'Operation cancelled.',
    contents_lbl_title: 'Title',
    contents_lbl_summary: 'Summary',
    contents_lbl_client: 'Client',
    contents_lbl_tags: 'Hashtags',
    contents_ph_add_tag: '#newTag',
    contents_btn_add_tag: 'Add',
    contents_specific_proposal_heading: 'Proposal fields',
    contents_specific_success_heading: 'Success case fields',
    contents_specific_client_heading: 'Client fields',
    contents_lbl_stage: 'Stage',
    contents_lbl_pricing_model: 'Pricing model',
    contents_lbl_effort: 'Estimated effort',
    contents_lbl_notes: 'Notes',
    contents_lbl_challenge: 'Challenge',
    contents_lbl_solution: 'Solution',
    contents_lbl_impact_value: 'Impact',
    contents_lbl_account_status: 'Account status',
    contents_lbl_active_projects: 'Active projects',
    contents_lbl_health_score: 'Health score',
    contents_btn_save: 'Save',
    contents_btn_delete: 'Delete',
    contents_btn_cancel: 'Cancel',
    contents_busy_loading: 'Loading content…',
    contents_busy_opening: 'Opening content…',
    contents_file_opening: 'Opening file in Drive…',
    contents_file_not_found: 'I could not find that file in Drive.',
    contents_busy_uploading: 'Uploading file…',
    contents_busy_extracting: 'Extracting metadata…',
    contents_busy_saving: 'Indexing and saving…',
    contents_busy_deleting: 'Deleting from index and catalog…',
    contents_extraction_done:
      'Metadata extracted. Review and adjust before saving.',
    contents_uploaded: 'File uploaded. You can now extract metadata.',
    contents_saved: 'Content saved.',
    contents_deleted: 'Content deleted.',
    contents_confirm_delete:
      'This removes the item from catalog and agent index. Continue?',
    contents_err_pick_file: 'Choose a PDF file.',
    contents_err_pick_type: 'Choose a content type.',
    contents_err_upload_first: 'Upload a file first.',
    contents_err_upload_read:
      'Could not read the local file. Please try again.',
    contents_err_upload_failed: 'Could not upload the file.',
    contents_err_title_required: 'Title is required.',
    contents_err_extract_first:
      'Upload and extract metadata first to get a working file.',
    contents_err_pick_row: 'Pick a row to delete.',
    contents_row_busy: 'Processing…',
    contents_index_repair_needed: 'Not indexed',
    contents_btn_repair_index: 'Fix',
    contents_busy_repairing_index: 'Re-indexing from Drive…',
    contents_repair_done: 'Content re-indexed from Drive.',
    contents_repair_removed:
      'The file no longer exists in Drive: the index was cleaned and the row was removed.',
    contents_repair_failed: 'Could not repair the index.',
    admin_contents_empty:
      'No agents yet. Create one in the Agents tab.',
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
    home_welcome_title: 'Welcome to the Aviators agentic suite',
    home_welcome_lead_html:
      'For more info go to the <a href="#" data-nav-page="faq" class="font-medium text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">FAQ</a>, or ask a question directly.',
    dashboard_title: 'Home',
    dashboard_lead:
      'Write below and follow the conversation above. Replies appear as messages.',
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
    mobile_menu_open_aria: 'Open menu',
    mobile_menu_close_aria: 'Close menu',
    mobile_menu_backdrop_aria: 'Close side panel',
    sidebar_language: 'Language',
    lang_option_es: 'Spanish',
    lang_option_en: 'English',
    theme_dark: 'Dark mode',
    theme_light: 'Light mode',
    dash_agents_title: 'Agents',
    dash_contents_title: 'Contents',
    dash_clients_title: 'Clients',
    contents_readonly_notice: 'Read-only',
    clients_readonly_notice: 'Read-only',
    dash_detail_empty: 'No breakdown yet.',
    dash_agent_kind_orchestrator: 'Orchestrator',
    dash_agent_kind_success_cases: 'Success cases',
    dash_agent_kind_proposals: 'Proposals',
    dash_agent_kind_clients: 'Clients (corpus)',
    dash_agent_kind_other: 'Custom',
    dash_agent_kind_other_named: '{name}',
    dash_agents_strategies_line: 'Strategies: {list}',
    dash_industry_unknown: 'No industry',
    global_search_ph: 'Search everything…',
    global_search_no_results: 'No results.',
    global_search_group_agents: 'Agents',
    global_search_group_contents: 'Contents',
    global_search_group_clients: 'Clients',
    batch_selected: '{n} selected',
    batch_delete_selected: 'Delete selected',
    batch_delete_confirm: 'Delete {n} selected items?',
    batch_deleting: 'Deleting {done} of {total}…',
    batch_done: '{n} items deleted.',
    batch_sync_selected: 'Sync selected',
    batch_sync_confirm: 'Sync {n} selected agents?',
    batch_syncing: 'Syncing {done} of {total}…',
    batch_sync_done: '{n} agents synced.',
    batch_agents_delete_confirm: 'Delete {n} selected agents?',
    batch_agents_deleting: 'Deleting {done} of {total}…',
    batch_agents_delete_done: '{done}/{total} agents deleted.',
    export_csv: 'Export CSV',
    import_csv: 'Import CSV',
    export_done: 'Export completed.',
    export_no_data: 'No data to export.',
    import_empty: 'The CSV file is empty.',
    import_preview_title: 'Import preview',
    import_preview_rows: '{n} rows to import.',
    import_confirm: 'Import {n} rows',
    import_cancel: 'Cancel',
    import_progress: 'Importing {done} of {total}…',
    import_done: '{n} rows imported.',
    import_errors: '({n} with errors)',
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
    static_consult_heading: 'Conversation with the assistant',
    static_consult_lead:
      'Messages stay above; only that area scrolls. Enter sends; Shift+Enter adds a new line.',
    static_drive_explorer_heading: 'Drive explorer',
    static_drive_explorer_lead:
      'Browse your folders and files (read-only, same account as signed in). Files open in a new tab.',
    btn_mi_drive: 'My Drive',
    btn_back: 'Back',
    btn_load_more: 'Load more',
    lbl_chat_input_sronly: 'Your message',
    chat_new_conversation: 'New conversation',
    chat_empty_hint:
      'No messages yet. Type below and tap send to see the assistant reply.',
    chat_thinking: 'The assistant is typing…',
    chat_no_relevant_content: 'I couldn\'t find relevant information in my knowledge base to answer your query. Could you rephrase it or ask a more specific question?',
    chat_sr_you: 'You',
    chat_sr_agent: 'Assistant',
    chat_refs_title: 'Related sources',
    chat_refs_open_link: 'Open file',
    chat_ref_not_found: 'I could not find that file in Drive.',
    home_chat_banner_setup:
      'The assistant is not available right now. If this keeps happening, contact your Aviators admin.',
    lbl_question_sronly: 'Question',
    ph_question: 'Type your message…',
    ask_agent_btn: 'Send',
    ask_btn: 'Send with documents',
    static_drive_files_heading: 'Context files',
    static_drive_files_lead:
      'Select up to 5 recent files to include in this answer.',
    page_agents_title: 'Agent administration',
    page_agents_lead:
      'Each agent defines the Globant profile name, model instructions, and sources to index. Save changes and sync when you are ready.',
    page_agents_readonly_lead:
      'Read-only view of agent configuration. You can inspect definition, prompt, and sources without editing or syncing.',
    admin_agent_sec_profile_heading: 'Agent profile',
    admin_agent_sec_profile_lead:
      'Globant RAG profile name. It must be unique among your agents.',
    admin_agent_sec_prompt_heading: 'Instructions',
    admin_agent_sec_prompt_lead:
      'Optional template that guides how retrieved context is used when answering.',
    admin_agent_sec_api_heading: 'Agent API config (v2)',
    admin_agent_sec_api_lead:
      'These fields store the editable agent definition for create/update through API: model, strategy, prompt, and LLM parameters.',
    admin_agent_sec_actions_heading: 'Save and sync',
    admin_agent_sec_actions_lead:
      'Save profile, instructions, and PDF selection first. Then sync to upload them to the Globant index. Delete removes the agent from Aviators.',
    admin_agent_sec_sources_heading: 'Sources for the index',
    admin_agent_sec_sources_lead:
      'Drag or choose PDFs here; they upload to your Drive and appear as chips below.',
    admin_agent_sec_indexed_lead:
      'Remote Globant listing for this profile. Refresh the list after syncing.',
    admin_agent_dropzone_aria: 'Drop PDF files here',
    admin_agent_dropzone_hint:
      'Drop one or more PDFs here, or choose files on your computer.',
    btn_admin_agent_upload_pdf: 'Choose PDF',
    btn_go_agents: 'Go to Agents',
    admin_upload_progress: 'Uploading file {current} of {total}…',
    admin_upload_done_added:
      '{n} file(s) added to the selection. Save the agent to persist.',
    err_admin_upload_only_pdf: 'Only PDF files can be uploaded for this corpus.',
    err_admin_upload_empty: 'Empty file: «{name}».',
    err_admin_upload_decode: 'Could not read file «{name}».',
    err_admin_upload_too_large:
      'File «{name}» exceeds the maximum allowed size.',
    err_admin_upload_mime:
      'Unsupported type for the corpus («{name}»: {mime}). Use PDF.',
    err_admin_upload_failed: 'Could not upload «{name}».',
    admin_sec_title: 'Agents',
    admin_agent_new: 'New agent',
    admin_agent_seed_defaults: 'Generate default agents',
    lbl_admin_agent_profile: 'Profile name',
    ph_admin_agent_profile: 'e.g. my-aviators-corpus',
    lbl_admin_agent_prompt: 'Agent instructions',
    lbl_admin_agent_api_id_or_name: 'idOrName (update/upsert)',
    ph_admin_agent_api_id_or_name: 'e.g. DeepResearcher or UUID',
    lbl_admin_agent_api_name: 'Agent name (API)',
    ph_admin_agent_api_name: 'e.g. aviators-success-cases',
    lbl_admin_agent_api_model: 'LLM model',
    ph_admin_agent_api_model: 'e.g. gpt-4o',
    lbl_admin_agent_api_strategy: 'Reasoning strategy',
    ph_admin_agent_api_strategy: 'e.g. Chain of Thought',
    lbl_admin_agent_api_max_tokens: 'Max tokens',
    lbl_admin_agent_api_timeout: 'Timeout (seconds)',
    lbl_admin_agent_api_temperature: 'Temperature',
    lbl_admin_agent_api_access_scope: 'Access scope',
    lbl_admin_agent_api_sharing_scope: 'Sharing scope',
    lbl_admin_agent_api_status: 'Status',
    lbl_admin_agent_api_automatic_publish:
      'Automatically publish when running update/upsert',
    lbl_admin_agent_api_job_description: 'Job description',
    lbl_admin_agent_api_description: 'Description',
    lbl_admin_agent_api_avatar: 'Avatar URL',
    ph_admin_agent_api_avatar: 'https://...',
    lbl_admin_agent_api_prompt_context: 'Prompt context',
    opt_admin_agent_private: 'private',
    opt_admin_agent_public: 'public',
    opt_admin_agent_sharing_organization: 'organization',
    opt_admin_agent_sharing_none: 'none',
    opt_admin_agent_sharing_everybody: 'everybody',
    opt_admin_agent_status_active: 'active',
    opt_admin_agent_status_inactive: 'inactive',
    admin_agent_prompt_hint_html:
      'Optional. Use <code>{context}</code> and <code>{question}</code> in the template when needed. Empty = default.',
    btn_admin_agent_save: 'Save agent',
    btn_admin_agent_sync: 'Sync index',
    btn_admin_agent_delete: 'Delete agent',
    btn_admin_agent_refresh_docs: 'Refresh documents',
    admin_agent_globant_docs: 'Indexed documents',
    admin_agent_empty_select: 'Pick an agent from the list or create a new one.',
    admin_agent_list_empty: 'No agents yet.',
    agents_ro_empty_select:
      'Select an agent from the list to inspect its configuration.',
    agents_ro_detail_heading: 'Agent details',
    admin_agent_last_sync_label: 'Last sync',
    agents_ro_sources_label: 'Index sources',
    admin_busy_agent_save: 'Saving agent…',
    admin_busy_agent_seed: 'Generating default agents…',
    admin_agent_seed_loader_hint:
      'If needed, the registry file is created in Drive and any missing default agents are added. This may take a few seconds.',
    admin_busy_agent_sync: 'Syncing index (may take a while)…',
    admin_busy_agent_delete: 'Deleting…',
    admin_agent_saved: 'Agent saved in Aviators and Globant.',
    admin_agent_seed_done_added:
      'Created {n} missing default agent(s).',
    admin_agent_seed_done_noop:
      'All default agents already exist.',
    admin_agent_last_sync: 'Last sync: {date}',
    admin_agent_sync_done:
      'Done: profile «{profile}» · uploaded {uploaded}/{total}.',
    err_admin_agent_payload: 'Invalid agent data.',
    err_admin_agent_profile_name:
      'Profile name must be 2–80 characters: letters, digits, underscore or hyphen; must start with a letter or digit.',
    err_admin_agent_duplicate: 'An agent with profile «{name}» already exists.',
    err_admin_agent_api_model_required:
      'To save to Globant API you must provide an LLM model.',
    err_admin_agent_api_id:
      'Missing idOrName to save in Globant API.',
    err_admin_agent_id: 'Agent id is required.',
    err_admin_agent_not_found: 'That agent was not found.',
    err_admin_agent_seed:
      'Could not create or verify default agents.',
    confirm_delete_agent_registry:
      'Remove this agent from Aviators? If it exists in Globant (RAG mode), the remote profile will be deleted too.',
    admin_agent_delete_modal_title: 'Delete this agent?',
    admin_agent_delete_modal_cancel: 'Cancel',
    admin_agent_delete_modal_confirm: 'Yes, delete',
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
    btn_close: 'Close',
    chip_folder: 'FOLDER',
    chip_file: 'FILE',
    chip_remove_aria: 'Remove',
    admin_need_email_drive: 'You need a session with email to browse Drive.',
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
    gc_view_file: 'View',
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
    orch_step_routing: 'Analyzing your query…',
    orch_step_delegating: 'Delegating to {agent}…',
    orch_step_answering: '{agent} is answering…',
    orch_step_multi: 'Querying {agents}…',
    orch_routed_badge: 'Answered by {agent}',
    orch_no_results:
      'None of the agents found relevant content in their index for this query.',
    err_ask_agent: 'Error calling the API.',
    ask_max_docs: 'You can select at most {max} documents.',
    consult_heading_globant: 'Ask the agent',
    consult_heading_gemini: 'Ask with Gemini and documents',
    consult_heading_none: 'Questions (no model configured)',
    drive_heading_globant:
      'Drive pickers hidden: with Globant you query the configured profile/agent.',
    drive_heading_gemini: 'Files for this answer',
    drive_heading_plain: 'Files',
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
    err_orchestrator_missing:
      'The orchestrator agent was not found in configuration.',
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
    meta_filter_profile: 'profile = {profile}',
    meta_orchestrator_selected_agent:
      'Routed to {agent} · confidence {confidence}',
    meta_provider_gemini_api: 'Gemini API',
    llm_gemini_system_preamble:
      'Answer in English using only information from the documents. If something is not there, say so clearly. You may use bullet points.',
    llm_gemini_section_question: '--- QUESTION ---',
    llm_gemini_section_documents: '--- DOCUMENTS ---',
    llm_gemini_doc_heading: '### {name}\n',
    llm_gemini_between_docs: '\n\n---\n',
    llm_gemini_block_read_error: '### id {id}\n_Error: {err}_',
    page_clients_title: 'Clients',
    page_clients_lead:
      'Manage your client portfolio. Add metadata like industry, country, and main contact.',
    clients_btn_new: 'New client',
    clients_btn_back_list: 'Back to list',
    clients_th_name: 'Name',
    clients_th_industry: 'Industry',
    clients_th_country: 'Country',
    clients_th_contact: 'Contact',
    clients_th_actions: 'Actions',
    clients_lbl_name: 'Client name',
    clients_lbl_industry: 'Industry',
    clients_lbl_country: 'Country',
    clients_lbl_contact_name: 'Contact name',
    clients_lbl_contact_email: 'Contact email',
    clients_lbl_notes: 'Notes',
    clients_btn_save: 'Save client',
    clients_btn_delete: 'Delete',
    clients_btn_cancel: 'Cancel',
    clients_busy_loading: 'Loading clients…',
    clients_busy_saving: 'Saving client…',
    clients_busy_deleting: 'Deleting client…',
    clients_saved: 'Client saved.',
    clients_deleted: 'Client deleted.',
    clients_err_name_required: 'Client name is required.',
    clients_confirm_delete: 'Delete this client permanently?',
    clients_no_items: 'No clients registered.',
    clients_load_more: 'Load more',
    clients_showing_of: 'Showing {shown} of {total}.',
    contents_client_combo_new: '+ Add new client',
    contents_client_combo_placeholder: 'Select client…',
    contents_load_more: 'Load more',
    contents_showing_of: 'Showing {shown} of {total}.',
    page_metrics_title: 'Metrics',
    page_metrics_lead:
      'Operational dashboard for chat usage, unanswered questions, and performance by agent, client and industry.',
    metrics_range_label: 'Window',
    metrics_range_30d: 'Last 30 days',
    metrics_range_90d: 'Last 90 days',
    metrics_range_12m: 'Last 12 months',
    metrics_refresh_btn: 'Refresh metrics',
    metrics_reset_btn: 'Reset metrics',
    metrics_reset_confirm:
      'This will wipe all metrics history. Do you want to continue?',
    metrics_reset_busy: 'Resetting metrics…',
    metrics_reset_done: 'Metrics reset complete.',
    metrics_reset_error: 'Metrics could not be reset.',
    metrics_overview_heading: 'Overview',
    metrics_overview_lead:
      'Top-level indicators to understand total question volume and unanswered requests.',
    metrics_total_questions: 'Questions',
    metrics_total_unanswered: 'Unanswered',
    metrics_trend_heading: 'Time trend',
    metrics_trend_lead:
      'Daily evolution of questions and unanswered requests for the selected window.',
    metrics_agent_usage_heading: 'Usage by agent',
    metrics_agent_usage_lead:
      'How many questions were routed to each agent in the selected period.',
    metrics_leaderboards_heading: 'Leaderboards',
    metrics_leaderboards_lead:
      'Adoption rankings by user and catalog performance by client/industry.',
    metrics_lb_users: 'People using chat (questions)',
    metrics_lb_agents: 'Questions by agent',
    metrics_lb_success_client: 'Success cases by client',
    metrics_lb_success_industry: 'Success cases by industry',
    metrics_lb_proposal_client: 'Proposals by client',
    metrics_lb_proposal_industry: 'Proposals by industry',
    metrics_unanswered_heading: 'Unanswered queries',
    metrics_unanswered_lead:
      'Question history where the system had insufficient content to answer.',
    metrics_th_date: 'Date',
    metrics_th_user: 'User',
    metrics_th_agent: 'Agent',
    metrics_th_question: 'Question',
    metrics_th_reason: 'Reason',
    metrics_loading_dashboard: 'Loading metrics dashboard…',
    metrics_loading_unanswered: 'Loading unanswered queries…',
    metrics_loaded: 'Metrics updated.',
    metrics_load_error: 'Metrics could not be loaded.',
    metrics_empty: 'No data to display.',
    metrics_pagination_info: 'Showing {from}–{to} of {total}.',
    metrics_pagination_empty: 'No records.',
    pagination_prev: 'Previous',
    pagination_next: 'Next',
    err_metrics_only:
      'Only admin, manager, presales, tech, or client partner users can view metrics.',
    err_metrics_reset_only:
      'Only administrators can reset metrics.',
    context_files_loading: 'Loading context files…',
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
 * Pack de textos para un locale (cliente / getI18nPack).
 * @param {'es'|'en'} locale
 * @return {Object<string, string>}
 */
function UiStrings_getClientPackForLocale(locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var src = UI_STRINGS[loc] || UI_STRINGS.es;
  /** @type {Object<string, string>} */
  var out = {};
  for (var k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  }
  out._locale = loc;
  return out;
}

/**
 * Objeto plano para HtmlService (un idioma activo).
 * @return {Object<string, string>}
 */
function UiStrings_getClientPack_() {
  return UiStrings_getClientPackForLocale(UiStrings_activeLocale_());
}

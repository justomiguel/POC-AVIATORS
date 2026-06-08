/**
 * @fileoverview Catálogo único de textos de UI (es/en). No duplicar mensajes en HTML/JS en bruto.
 * Cambiá APP_UI_LOCALE para el idioma por defecto de la plantilla y del servidor.
 */

/** @type {'es'|'en'} */
var APP_UI_LOCALE = 'es';

var UI_STRINGS = {
  es: {
    app_title: 'Aviators',
    app_startup_loading: 'Preparando la aplicación…',
    app_startup_i18n: 'Cargando textos…',
    app_startup_i18n_sub_meta:
      'Torre de control: autorizando plan de vuelo lingüístico…',
    app_startup_i18n_sub1: 'Compartimiento 1: menús y navegación a bordo…',
    app_startup_i18n_sub2: 'Compartimiento 2: formularios y estados vacíos…',
    app_startup_i18n_sub3: 'Compartimiento 3: mensajes de error y pistas técnicas…',
    app_startup_session: 'Cargando roles y agentes…',
    app_startup_session_sub:
      'Sincronizando permisos y configuración de agentes…',
    app_startup_failed: 'No se pudieron cargar los textos. Recargá la página.',
    nav_home: 'Chat General',
    nav_chat: 'Chat',
    nav_section_consult: 'Consultar',
    nav_section_knowledge: 'Conocimiento',
    nav_section_admin: 'Administración',
    nav_group_chat_modes: 'Modos de Chat',
    nav_explore: 'Explorar',
    chat_mode_general: 'General',
    chat_mode_onboarding: 'Onboarding',
    chat_mode_globant_offering: 'Globant Offering',
    chat_mode_proposals: 'Propuestas',
    chat_mode_tabs_aria: 'Modo de consulta',
    theme_toggle_aria: 'Cambiar tema claro u oscuro',
    nav_onboarding: 'Onboarding',
    nav_globant_offering: 'Globant Offering',
    nav_proposal_building: 'Armado de propuestas',
    nav_agents: 'Agentes',
    nav_contents: 'Contenidos',
    nav_tags: 'Tags',
    nav_clients: 'Clientes',
    nav_metrics: 'Métricas',
    nav_knowledge_graph: 'Grafo de Conocimiento',
    nav_settings: 'Configuración',
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
      '<p>Su único objetivo es <strong>clasificar tu consulta</strong> y decidir qué agente(s) deben responder. No es un experto “de memoria”: cumple la función de enrutamiento.</p><p>Si la misma pregunta podría atenderse desde más de un repositorio, puede disparar <strong>varios agentes en paralelo</strong> (por ejemplo, “¿qué hicimos con el cliente X?” puede mezclar casos de éxito y propuestas).</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>Success cases</strong>: historias de implementación, resultados y referencias por industria o tecnología.</li><li><strong>Propuestas</strong>: propuestas comerciales y conocimiento de <strong>Globant</strong> (Studios, offerings como AI Pods, modelos de engagement) además de alcance, entregables, cronograma, pricing y RFP.</li><li><strong>Clientes</strong>: nómina de cuentas, proyectos activos o en mantenimiento y estado de la relación.</li><li><strong>Onboarding</strong>: dominio aviación/aerolíneas y metodología interna del Aviation Studio para nuevos integrantes.</li><li><strong>Conversación general</strong>: saludos, uso de Aviators y mensajes institucionales del orquestador.</li></ul>',
    faq_agent_success_cases_title: 'Success cases',
    faq_agent_success_cases_detail_html:
      '<p>Responde <strong>solo</strong> con lo que esté en el repositorio indexado de success cases del estudio; no usa conocimiento externo como verdad documentada.</p><p>El foco son casos concretos y comparables: contexto, problema, solución implementada, resultados y aprendizajes, en tono ejecutivo y accionable, con <strong>respuestas desarrolladas</strong> (no resúmenes de una línea). Cuando aplica, estructura en bloques tipo Caso, Contexto, Solución, Impacto y Riesgos. Si varios casos encajan, resume cada uno con puntos clave y ofrece profundizar en uno.</p><p>Si el índice no contiene nada pertinente, la respuesta deja claro que <strong>no hay material alineado</strong> en lugar de inventar clientes, métricas o nombres de proyecto.</p>',
    faq_agent_proposals_title: 'Propuestas comerciales',
    faq_agent_proposals_detail_html:
      '<p>Se apoya en el repositorio indexado de <strong>propuestas comerciales</strong> y material sobre <strong>Globant</strong>: Studios (áreas de expertise), offerings (AI Pods, modelos comerciales, engagement models) y posicionamiento comercial cuando esté indexado.</p><p>Orienta la respuesta a preventa y entrega: alcance, supuestos, entregables, fases, riesgos y próximos pasos, con <strong>detalle alineado</strong> a lo documentado. Distingue hechos del índice frente a inferencias; no inventa precios, capacidades de studio ni detalles de offering sin respaldo.</p><p>Sin material relevante en el índice, comunica que <strong>no encontró coincidencias</strong> en lugar de fabricar ofertas o definiciones de Globant.</p>',
    faq_agent_clients_title: 'Clientes y proyectos',
    faq_agent_clients_detail_html:
      '<p>Responde sobre la <strong>cartera de clientes</strong> usando el roster Salesforce y el maestro en <strong>Supabase</strong> (nómina, industria, cuentas activas, owner, status), el <strong>catálogo</strong> vectorizado de Aviators y, cuando existan, PDFs en el índice RAG de clientes.</p><p>Para listados o filtros (p. ej. aviación, activos) prioriza los datos del roster en BD; para una cuenta concreta combina roster, catálogo y documentos indexados. No mezcla clientes sin evidencia en el contexto de esa respuesta; si el nombre es ambiguo, conviene aclarar la entidad antes de afirmar.</p><p>Cuando aplica, organiza en: Cliente, Owner, Portfolio, Estado, Oportunidades, Industria. No debe inventar contratos, revenue, alcance ni fechas. Si no hay datos en roster, catálogo ni RAG para lo pedido, indica <strong>falta de información</strong> en lugar de suponer datos comerciales.</p>',
    faq_agent_onboarding_title: 'Onboarding',
    faq_agent_onboarding_detail_html:
      '<p>Toma como fuente el <strong>repositorio indexado de onboarding</strong> que incluye conceptos de aviación, modelos de negocio de aerolíneas, terminología de dominio (PSS, DCS, NDC, GDS, loyalty, ancillary, etc.) y metodología del Aviation Studio.</p><p>Objetivo: ayudar a nuevos integrantes y al equipo a comprender la industria de aviación y cómo opera el estudio. Explica conceptos de forma clara y didáctica, usando ejemplos del material indexado cuando estén disponibles.</p><p>Si el concepto o tema no aparece en el índice, indica que <strong>no hay información indexada</strong> en lugar de inventar definiciones o procesos.</p>',
    faq_agents_admin_note:
      'Los administradores pueden ajustar instrucciones, perfiles Globant y carpetas de Drive en la sección Agentes; esta descripción refleja el comportamiento previsto por defecto en el código del sistema.',
    faq_q_what: '¿Qué es Aviators?',
    faq_a_what:
      'Es una Web App de Google Apps Script pensada para equipos que quieren conversar con modelos de IA sobre documentación propia: el conocimiento vive en Drive y en flujos de “Contenidos” que indexan PDFs en agentes RAG. Según tu rol, también gestionás el registro de agentes, la cartera en “Clientes” y el chat en Inicio, con orquestación hacia especialistas cuando el modo de despliegue lo habilita.',
    faq_q_flow: '¿Cómo empiezo después de iniciar sesión?',
    faq_a_flow:
      'Usá la barra lateral para ir a Inicio (tablero y chat), o a Agentes, Contenidos y Clientes si aparecen en tu menú.',
    faq_q_chat: '¿Cómo funciona el chat de Inicio?',
    faq_a_chat:
      'Escribís tu pregunta en el área de mensajes y enviás. El modo de consulta técnico (Globant RAG, Assistant o Gemini según configuración) aparece en el cartel superior del chat. Cuando el despliegue usa varios perfiles indexados, un orquestador puede dirigir la pregunta a uno o más agentes —success cases, propuestas o clientes— según el tema. Podés mantener turnos sucesivos en la misma conversación.',
    faq_q_drive_ctx: '¿Qué son los archivos de contexto o Drive?',
    faq_a_drive_ctx:
      'En el chat, la lista de documentos de contexto corresponde a la cuenta de Google bajo la que corre la aplicación (quien desplegó Aviators), para pedir menos permisos a cada visitante. Podés marcar hasta el límite permitido y formatos que la integración acepte.',
    faq_q_contents: '¿Qué hago en Contenidos?',
    faq_a_contents:
      'Creás o editás ítems de conocimiento: elegís el tipo (propuesta, success case, cliente), subís un PDF, pedís extraer metadata con IA, revisás los campos y guardás para indexar en el agente correspondiente.',
    faq_q_agents_clients: '¿Qué son Agentes y Clientes?',
    faq_a_agents_clients:
      'En Agentes, quien administra el proyecto registra cada especialista (perfil Globant, instrucciones, carpetas y archivos de Drive que alimentan el índice) y lanza la sincronización. La pantalla Clientes es la cartera operativa (industria, contacto, notas) alineada al negocio. El detalle de qué responde cada agente en el chat está en la sección “Agentes del chat” arriba.',
    faq_q_visibility: '¿Por qué no veo Agentes, Contenidos o Clientes?',
    faq_a_visibility:
      'Esas secciones dependen del <code>role_key</code> en la tabla <code>roles</code> de la BD. Si solo ves visitante, tu email no tiene fila en esa tabla.',
    faq_q_roles: '¿Qué roles existen y qué puede hacer cada uno?',
    faq_a_roles_html:
      '<p>Los permisos se asignan en la tabla <strong>roles</strong> de la BD (<code>email</code>, <code>role_key</code>, <code>role_label</code>). El menú y las acciones dependen de <code>role_key</code>:</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>visitante</strong> (sin fila): acceso básico (Inicio/FAQ), chat acotado.</li><li><strong>admin</strong>: acceso completo con escritura (Agentes, Contenidos, Clientes y Métricas).</li><li><strong>presales</strong>: escritura en Contenidos/Clientes y lectura de Métricas.</li><li><strong>manager</strong>: lectura de Métricas y navegación general.</li><li><strong>tech</strong> / <strong>client_partner</strong>: lectura en Agentes, Contenidos, Clientes y Métricas.</li></ul><p class="mt-2">Si necesitás cambiar de rol, pedilo a quien administra la tabla <code>roles</code> en la BD.</p>',
    faq_q_misc: '¿Dónde cambio idioma o tema oscuro?',
    faq_a_misc:
      'Idioma y modo claro/oscuro están al pie del panel lateral.',
    page_contents_title: 'Contenidos del agente',
    page_contents_lead:
      'Subí contenido, extraé metadata, revisá y guardá para indexar automáticamente en el agente correspondiente.',
    page_tags_title: 'Tags del catálogo',
    page_tags_lead:
      'Explorá las etiquetas extraídas de los documentos. Hacé clic en un tag para ver el contenido asociado; si tenés permiso de edición, podés fusionar etiquetas duplicadas.',
    page_knowledge_graph_title: 'Grafo de Conocimiento',
    page_knowledge_graph_lead:
      'El grafo se guarda en Supabase y se actualiza al subir o editar contenidos. Usá la pestaña Grafo para explorar el mapa y Entidades para ver el inventario y entender cada tipo de nodo y relación.',
    kg_guide_heading: 'Cómo explorar (en 4 pasos)',
    kg_guide_lead:
      'No hace falta ser técnico: el dibujo muestra una parte del mapa de relaciones guardado en Supabase. Estos pasos alcanzan para la mayoría de las búsquedas.',
    kg_guide_step_1: 'Elegí un cliente, industria o nombre y tocá «Aplicar filtros».',
    kg_guide_step_2:
      'Hacé clic en un punto del dibujo o en la lista «Nodos visibles» de la derecha. Doble clic centra la entidad y muestra sus relaciones hasta la profundidad máxima.',
    kg_guide_step_3: 'Usá la lupa sobre el dibujo para encontrar un nombre y Enter para ir saltando.',
    kg_guide_step_4: 'Si se ve muy cargado, bajá la profundidad o filtrá por un solo cliente.',
    kg_filters_heading: 'Acotar la vista',
    kg_filters_toggle: 'Filtros y alcance',
    kg_side_toggle: 'Panel de nodos',
    kg_side_close: 'Cerrar panel',
    kg_side_tab_detail: 'Detalle',
    kg_side_tab_nodes: 'Nodos',
    kg_legend_toggle: 'Leyenda',
    kg_filters_lead:
      'Elegí desde dónde empezar. Cuanto más amplio el filtro, más puntos intentará mostrar la pantalla (hasta un tope por rendimiento).',
    kg_filter_content_type: 'Tipo de contenido',
    kg_filter_content_type_all: 'Todos',
    kg_filter_industry: 'Industria',
    kg_filter_industry_all: 'Todas',
    kg_filter_client: 'Cliente',
    kg_filter_client_all: 'Todos',
    kg_filter_search: 'Buscar nodo',
    kg_filter_search_placeholder: 'Nombre, tag, cliente…',
    kg_filter_depth: 'Cuántos saltos de conexión',
    kg_depth_hint:
      'Cada salto incluye vecinos del foco (documentos → cliente → tags, etc.). Más saltos = más puntos y más lento en el navegador.',
    kg_depth_opt_1: '1 — solo vecinos directos',
    kg_depth_opt_2: '2 — recomendado',
    kg_depth_opt_3: '3 — red amplia',
    kg_depth_opt_4: '4 — máximo permitido',
    kg_filter_density: 'Detalle del grafo',
    kg_density_opt_compact: 'Compacto (80 nodos)',
    kg_density_opt_normal: 'Normal (150 nodos)',
    kg_density_opt_wide: 'Amplio (250 nodos)',
    kg_density_opt_compact_fmt: 'Compacto ({count} nodos)',
    kg_density_opt_normal_fmt: 'Normal ({count} nodos)',
    kg_density_opt_wide_fmt: 'Amplio ({count} nodos)',
    kg_depth_opt_n_fmt: '{n} saltos',
    kg_depth_meter_label: 'Nivel de profundidad elegido',
    kg_depth_meter_aria: 'Indicador de profundidad del grafo',
    kg_depth_meter_live: 'Profundidad configurada: {depth} de {max} saltos',
    kg_scope_summary:
      'Profundidad {depth}/{maxDepth} · {shown}/{maxNodes} nodos',
    kg_scope_truncated:
      'Hay más relaciones guardadas que no entraron en esta vista. Bajá la profundidad, filtrá por cliente o usá «Centrar en selección».',
    kg_filter_node_types: 'Tipos de nodo visibles',
    kg_btn_apply: 'Aplicar filtros',
    kg_btn_reset: 'Restablecer',
    kg_btn_focus: 'Centrar en selección',
    kg_btn_rebuild: 'Sincronizar desde Supabase',
    kg_btn_rebuild_scratch: 'Reconstruir desde cero',
    kg_sync_admin_lead:
      'Sincronizar actualiza el grafo sin borrarlo. Reconstruir desde cero vacía nodos y aristas en Supabase y vuelve a generar todo (embeddings, semántica, entidades) en segundo plano.',
    kg_rebuild_scratch_confirm_title: 'Reconstruir grafo desde cero',
    kg_rebuild_scratch_confirm:
      'Se borrarán todos los nodos y relaciones del grafo en Supabase. El catálogo de contenidos no se toca. Después se encolará un rebuild completo en segundo plano. Esta acción no se puede deshacer.',
    kg_rebuild_scratch_confirm_phrase: 'RECONSTRUIR',
    kg_rebuild_scratch_busy: 'Vaciando grafo y encolando rebuild…',
    kg_rebuild_scratch_done:
      'Grafo vaciado. Rebuild en segundo plano iniciado (etapa {phase}). Podés seguir el progreso en el banner.',
    kg_rebuild_scratch_queued:
      'Grafo vaciado. El rebuild completo arranca en ~{minutes} min (trigger en segundo plano). Seguí el progreso en el banner.',
    kg_rebuild_scratch_error: 'No se pudo reconstruir el grafo desde cero.',
    kg_btn_open_content: 'Ver en catálogo',
    kg_busy_loading: 'Cargando grafo…',
    kg_busy_loading_filters_fmt: 'Solicitando vista · {filters}',
    kg_busy_loading_stats_fmt:
      'Leídos {loadedNodes} nodos y {loadedEdges} aristas en Supabase · vista: {selectedNodes} nodos, {selectedEdges} aristas · profundidad {depth} · semillas {seeds}',
    kg_busy_step_server: 'En el servidor: resolviendo semillas y filtros…',
    kg_busy_step_nodes_db: 'En el servidor: leyendo nodos del grafo en Supabase…',
    kg_busy_step_edges_db: 'En el servidor: leyendo aristas del grafo en Supabase…',
    kg_busy_step_bfs: 'En el servidor: expandiendo vecinos (BFS) hasta el tope elegido…',
    kg_loading_filter_all: 'sin filtros (vista global)',
    kg_loading_filter_client: 'cliente: {name}',
    kg_loading_filter_industry: 'industria: {name}',
    kg_loading_filter_type: 'tipo: {name}',
    kg_loading_filter_search: 'búsqueda: «{q}»',
    kg_loading_filter_depth: 'profundidad {depth}/{max}',
    kg_loading_filter_nodes: 'hasta {max} nodos',
    kg_loading_filter_focus: 'centrado en selección',
    kg_loader_step_fmt: 'Paso {step} de {total}',
    kg_loader_status_loading: 'Cargando vista del grafo · {filters}',
    kg_loader_step1_title: 'Preparando la consulta',
    kg_loader_step1_why:
      'El servidor interpreta tus filtros y elige desde qué nodos empezar (semillas). No modifica datos.',
    kg_loader_step1_eta: 'Siguiente: leer nodos guardados en Supabase.',
    kg_loader_step2_title: 'Leyendo nodos',
    kg_loader_step2_why:
      'Trae el inventario de nodos del grafo (contenidos, clientes, tags, etc.) ya persistido en Supabase.',
    kg_loader_step2_eta: 'Siguiente: leer las relaciones entre nodos.',
    kg_loader_step3_title: 'Leyendo aristas',
    kg_loader_step3_why:
      'Carga las relaciones guardadas (pertenece a, tag, industria, etc.) para poder recorrer el grafo.',
    kg_loader_step3_eta: 'Siguiente: elegir el subconjunto visible con BFS.',
    kg_loader_step4_title: 'Armando la vista',
    kg_loader_step4_why:
      'En memoria expande vecinos según profundidad y tope de nodos. Solo lectura; no es una sincronización.',
    kg_loader_step4_eta: 'Cuando termine verás conteos y luego el dibujo del mapa.',
    kg_loader_step5_title: 'Vista lista en el servidor',
    kg_loader_step5_why: 'Datos recibidos. Ahora el navegador dibuja el mapa con vis-network.',
    kg_loader_step5_eta: 'Casi listo: layout y ajuste de cámara.',
    kg_loader_render_title: 'Dibujando en el navegador',
    kg_loader_render_why:
      'Calcula posiciones y dibuja nodos y líneas. En grafos grandes puede tardar unos segundos.',
    kg_loader_render_eta: 'Termina al estabilizar el layout o en unos segundos como máximo.',
    kg_loader_done_title: 'Listo',
    kg_loader_done_msg: 'El mapa ya está dibujado.',
    kg_loader_done_why: 'Podés explorar, filtrar y hacer clic en nodos.',
    kg_loader_done_eta: 'Este mensaje desaparece solo.',
    kg_loader_done_status: 'Grafo listo para explorar.',
    kg_busy_render: 'Dibujando el mapa…',
    kg_busy_rebuild: 'Reconstruyendo grafo… {done}/{total}',
    kg_busy_rebuild_phase: '{phase}: {done} ok · {failed} fallos',
    kg_busy_rebuild_verbose:
      'Sincronización {phaseNum}/{phaseTotal}: {phase} · este lote: {batchDone} ok · total: {totalDone} · fallos: {failed}. {hint}',
    kg_rebuild_hint_more_phases: 'Después siguen más etapas hasta terminar; al final se cargará la vista.',
    kg_rebuild_hint_finishing: 'Últimas etapas; al terminar se abrirá el grafo automáticamente.',
    kg_rebuild_status_start:
      'Sincronizando catálogo → grafo en Supabase. No es la carga de la vista; puede tardar varios minutos.',
    kg_pending_sync_msg:
      'Quedó una sincronización del grafo sin terminar (etapa {phaseNum}/{phaseTotal}: {phase}, {done} procesados, {failed} fallos). Podés reanudarla o descartar el progreso y solo ver el grafo actual.',
    kg_pending_sync_bg_msg:
      'Sincronización en segundo plano (etapa {phaseNum}/{phaseTotal}: {phase}, {done} procesados, {failed} fallos). Trigger programado: {trigger}. Podés seguir explorando el grafo; no hace falta esperar.',
    kg_pending_sync_scratch_queued:
      'Grafo vaciado; el rebuild completo se encola en ~{minutes} min. El primer lote arranca cuando dispare el trigger.',
    kg_pending_sync_batch_detail:
      'Último lote ({phase}): +{done} ok, {failed} fallos · offset {skip} · acumulado en etapa: {total}.',
    kg_pending_sync_last_error:
      'Error en etapa {phase}: {detail}',
    kg_bg_sync_trigger_yes: 'sí, continúa solo',
    kg_bg_sync_trigger_client: 'sí, el navegador reanuda solo',
    kg_bg_sync_trigger_no: 'no (reanudá manualmente)',
    kg_bg_sync_auto_resuming: 'Reanudando sincronización en segundo plano…',
    kg_bg_sync_starting: 'Programando sincronización en segundo plano…',
    kg_bg_sync_enqueued:
      'Sync en segundo plano activa ({phase}, {processed} en el primer lote). El grafo en pantalla es lectura; Supabase se actualiza en background.',
    kg_bg_sync_aligned: 'El grafo ya está alineado con Supabase; no hace falta sincronizar.',
    kg_bg_sync_error: 'No se pudo programar la sincronización en segundo plano.',
    kg_pending_sync_resume_btn: 'Reanudar sincronización',
    kg_pending_sync_discard_btn: 'Descartar y ver grafo',
    kg_pending_sync_discard_busy: 'Descartando progreso de sincronización…',
    kg_pending_sync_discard_error: 'No se pudo descartar el progreso de sincronización.',
    kg_busy_rebuild_next_phase: 'Siguiente etapa: {phase}…',
    kg_phase_contents: 'Contenidos',
    kg_phase_clients: 'Clientes',
    kg_phase_salesforce: 'Salesforce',
    kg_phase_embeddings: 'Embeddings del catálogo',
    kg_phase_semantic: 'Vínculos semánticos (embeddings)',
    kg_phase_entities: 'Entidades de negocio (IA)',
    kg_phase_stale: 'Limpieza de nodos obsoletos',
    kg_phase_prune: 'Poda de referencias',
    kg_empty: 'No hay nodos con estos filtros, o el grafo aún no se generó. Probá otros filtros o «Sincronizar desde Supabase» (una vez).',
    kg_truncated:
      'Solo se muestran {shown} de hasta {max} elementos. Hay más en Supabase: bajá profundidad o filtrá por cliente.',
    kg_error_load: 'No se pudo cargar el grafo.',
    kg_rebuild_done: 'Grafo sincronizado: {done} contenidos, {failed} fallos.',
    kg_sync_auto_start:
      'El grafo no está alineado con Supabase ({graph} de {catalog} contenidos). Sincronizando…',
    kg_status_cached: 'Vista restaurada desde caché de sesión.',
    kg_status_ready: 'Grafo en Supabase ({graph} contenidos indexados). Podés explorar sin volver a sincronizar.',
    kg_status_behind:
      'Grafo cargado ({graph}/{catalog} contenidos). Faltan {missing} en el índice; al guardar contenido se actualiza solo, o usá «Sincronizar desde Supabase».',
    kg_status_missing_embeddings:
      'Embeddings: {withEmb}/{catalog} contenidos listos. Faltan {missing} para vínculos semánticos; usá «Sincronizar desde Supabase» (etapa embeddings).',
    kg_status_stale:
      'Hay {stale} nodos obsoletos en Supabase. Usá «Sincronizar desde Supabase» para limpiar (no hace falta en cada visita).',
    kg_status_empty:
      'El grafo aún no tiene contenidos. Ejecutá «Sincronizar desde Supabase» una vez; después se mantiene al editar el catálogo.',
    kg_sync_resume: 'Reanudando sincronización del grafo (progreso guardado)…',
    kg_rebuild_timeout_hint:
      'Si se cortó por tiempo, volvé a sincronizar: el trabajo ya hecho quedó guardado en Supabase y se reanuda por etapas.',
    kg_stale_removed: 'Se quitaron {n} nodos de contenidos ya borrados.',
    kg_detail_heading: 'Detalle del nodo',
    kg_detail_type: 'Tipo',
    kg_detail_meta: 'Metadata',
    kg_detail_edges_out: 'Relaciones salientes',
    kg_detail_edges_in: 'Relaciones entrantes',
    kg_detail_relation: 'Relación',
    kg_edge_to: '→ {label}',
    kg_edge_from: '← {label}',
    kg_busy_vis: 'Cargando motor del grafo…',
    kg_error_vis_lib: 'No se pudo cargar el visor del grafo. Recargá la página.',
    err_kg_forbidden: 'No tenés permiso para ver el grafo de conocimiento.',
    kg_legend_heading: 'Leyenda',
    kg_legend_lead:
      'Forma y color por tipo de nodo; el grosor y color de las líneas indican la relación. Pasá el cursor para resaltar vecinos.',
    kg_legend_edges_heading: 'Relaciones',
    kg_simple_legend_heading: 'Qué ves en el dibujo',
    kg_simple_legend_lead: 'Colores y formas resumidos. Pasá el cursor sobre un punto para ver sus vecinos.',
    kg_simple_types_heading: 'Cada forma es…',
    kg_simple_links_heading: 'Cada línea significa…',
    kg_simple_type_content: 'Un documento del catálogo (propuesta, caso, etc.)',
    kg_simple_type_client: 'Un cliente del maestro',
    kg_simple_type_client_label: 'Nombre de cliente sin ficha en el maestro',
    kg_simple_type_industry: 'Una industria o sector',
    kg_simple_type_tag: 'Una etiqueta compartida',
    kg_simple_type_stage: 'Etapa de una propuesta',
    kg_simple_type_pricing_model: 'Modelo comercial de una propuesta',
    kg_simple_rel_belongs_to: 'Este documento está vinculado a ese cliente',
    kg_simple_rel_tagged_with: 'Comparte esta etiqueta',
    kg_simple_rel_in_industry: 'Pertenece a esta industria',
    kg_simple_rel_related_content: 'Propuesta y caso de éxito relacionados (mismo cliente)',
    kg_simple_rel_has_stage: 'La propuesta está en esta etapa',
    kg_simple_rel_has_pricing_model: 'La propuesta usa este modelo comercial',
    kg_simple_rel_similar_to: 'Documentos parecidos por significado (embedding)',
    kg_simple_rel_delivers: 'El documento ofrece o describe este servicio',
    kg_simple_rel_uses_technology: 'El documento usa o menciona esta tecnología',
    kg_simple_rel_achieved: 'El documento reporta este resultado',
    kg_simple_rel_addresses_theme: 'El documento aborda este tema de negocio',
    kg_simple_type_offering: 'Una oferta, studio o línea de servicio',
    kg_simple_type_technology: 'Una tecnología, plataforma o stack',
    kg_simple_type_outcome: 'Un resultado o KPI de negocio',
    kg_simple_type_theme: 'Un tema o problema transversal',
    kg_filter_min_weight: 'Fuerza mínima del vínculo',
    kg_min_weight_all: 'Todos los vínculos',
    kg_min_weight_65: 'Medio (≥ 65 %)',
    kg_min_weight_78: 'Fuerte (≥ 78 %)',
    kg_min_weight_85: 'Muy fuerte (≥ 85 %)',
    kg_edge_weight_fmt: '{pct} %',
    kg_edge_source_structural: 'Estructural',
    kg_edge_source_embedding: 'Semántico',
    kg_edge_source_llm: 'Extraído por IA',
    kg_graph_toolbar_heading: 'Vista del grafo',
    kg_graph_stats: '{nodes} nodos · {edges} aristas',
    kg_layout_label: 'Disposición',
    kg_layout_auto: 'Automática',
    kg_layout_hierarchical: 'Jerárquica',
    kg_layout_force: 'Fuerza',
    kg_show_labels: 'Etiquetas',
    kg_btn_fit: 'Encajar',
    kg_btn_fit_aria: 'Ajustar el grafo al área visible',
    kg_btn_zoom_in_aria: 'Acercar',
    kg_btn_zoom_out_aria: 'Alejar',
    kg_graph_find_label: 'Buscar en el grafo visible',
    kg_graph_find_placeholder: 'Nombre o id de nodo…',
    kg_graph_find_prev_aria: 'Coincidencia anterior',
    kg_graph_find_next_aria: 'Siguiente coincidencia',
    kg_graph_find_no_match: 'Sin coincidencias',
    kg_graph_find_match: '{current} de {total}',
    kg_graph_find_total: '{total} coincidencias',
    kg_nodes_heading: 'Nodos visibles',
    kg_nodes_lead: 'Lista del subgrafo cargado. Clic para centrar y ver detalle.',
    kg_nodes_filter_label: 'Filtrar lista de nodos',
    kg_nodes_filter_placeholder: 'Filtrar por nombre…',
    kg_nodes_empty: 'Ningún nodo coincide con el filtro.',
    kg_focus_no_selection: 'Seleccioná un nodo en el grafo o en la lista.',
    kg_rel_belongs_to: 'Pertenece a cliente',
    kg_rel_in_industry: 'Industria',
    kg_rel_tagged_with: 'Etiqueta',
    kg_rel_has_stage: 'Etapa (propuesta)',
    kg_rel_has_pricing_model: 'Modelo comercial',
    kg_rel_related_content: 'Contenido relacionado (propuesta ↔ caso)',
    kg_rel_similar_to: 'Similar semánticamente',
    kg_rel_delivers: 'Ofrece',
    kg_rel_uses_technology: 'Usa tecnología',
    kg_rel_achieved: 'Logró resultado',
    kg_rel_addresses_theme: 'Aborda tema',
    kg_type_content: 'Contenido',
    kg_type_client: 'Cliente',
    kg_type_client_label: 'Nombre de cliente (sin maestro)',
    kg_type_industry: 'Industria',
    kg_type_tag: 'Tag',
    kg_type_stage: 'Etapa',
    kg_type_pricing_model: 'Modelo de precio',
    kg_type_offering: 'Oferta / studio',
    kg_type_technology: 'Tecnología',
    kg_type_outcome: 'Resultado',
    kg_type_theme: 'Tema',
    kg_tabs_aria: 'Secciones del grafo de conocimiento',
    kg_tab_graph: 'Grafo',
    kg_tab_entities: 'Entidades',
    kg_entities_intro_heading: 'Cómo está armado el grafo',
    kg_entities_intro_lead:
      'El grafo combina tres capas: estructura del catálogo, similitud semántica entre documentos y entidades de negocio extraídas por IA. Abajo ves el inventario completo, sin secciones colapsables.',
    kg_entities_layer_structural_title: 'Capa estructural',
    kg_entities_layer_structural_lead:
      'Clientes, industrias, tags, etapas y modelos comerciales que vienen del catálogo y de Salesforce.',
    kg_entities_layer_semantic_title: 'Capa semántica',
    kg_entities_layer_semantic_lead:
      'Enlaces similar_to entre documentos según embeddings: descubre piezas parecidas aunque no compartan cliente.',
    kg_entities_layer_conceptual_title: 'Capa conceptual',
    kg_entities_layer_conceptual_lead:
      'Ofertas, tecnologías, resultados y temas extraídos por IA desde el texto de cada documento.',
    kg_entities_flow_source_title: 'Entran documentos y clientes',
    kg_entities_flow_source_lead:
      'Propuestas, casos, onboarding y cuentas se guardan como puntos del mapa.',
    kg_entities_flow_classify_title: 'Se clasifican por señales',
    kg_entities_flow_classify_lead:
      'Industria, tags, etapa y modelo comercial agrupan materiales parecidos.',
    kg_entities_flow_discover_title: 'Se descubre contexto',
    kg_entities_flow_discover_lead:
      'Las conexiones muestran clientes, temas y piezas relacionadas para navegar desde un punto concreto.',
    kg_entities_catalog_heading: 'Catálogo de tipos',
    kg_entities_catalog_lead:
      'Cada tarjeta muestra el significado del tipo y cuántos nodos o relaciones hay hoy en Supabase, agrupados por capa.',
    kg_entities_types_panel_heading: 'Tipos de nodo',
    kg_entities_types_panel_lead:
      'Qué puede aparecer como punto en el grafo. Los conteos son nodos persistidos.',
    kg_entities_layer_group_structural: 'Estructural',
    kg_entities_layer_group_semantic: 'Semántica',
    kg_entities_layer_group_conceptual: 'Conceptual',
    kg_entities_catalog_totals: '{nodes} nodos · {edges} relaciones guardadas',
    kg_entities_relations_heading: 'Tipos de relación',
    kg_entities_relations_lead:
      'Cómo se conectan los nodos. Cada fila indica el significado de la arista y cuántas hay guardadas.',
    kg_entities_count_fmt: '{count} en el índice',
    kg_entity_desc_content:
      'Documento del catálogo Aviators: propuesta, caso de éxito, ficha de cliente u onboarding. Se crea al guardar o indexar contenido.',
    kg_entity_desc_client:
      'Cliente del maestro de cuentas (Salesforce/Supabase). Agrupa documentos y vínculos comerciales bajo un mismo identificador.',
    kg_entity_desc_client_label:
      'Nombre de cliente mencionado en un documento cuando aún no existe ficha en el maestro. Sirve para no perder la relación hasta sincronizar la cuenta.',
    kg_entity_desc_industry:
      'Industria o sector (p. ej. aviación, retail). Los contenidos y clientes pueden compartir la misma industria.',
    kg_entity_desc_tag:
      'Etiqueta extraída o asignada a documentos. Conecta propuestas, casos y onboarding que hablan del mismo tema.',
    kg_entity_desc_stage:
      'Etapa comercial de una propuesta (p. ej. discovery, negociación). Solo aplica a nodos de tipo propuesta.',
    kg_entity_desc_pricing_model:
      'Modelo de precio o engagement de una propuesta (p. ej. time & materials, fixed price).',
    kg_entity_desc_offering:
      'Oferta, studio o línea de servicio extraída del documento por IA (capa conceptual del grafo).',
    kg_entity_desc_technology:
      'Tecnología, plataforma o stack mencionado en el documento (extraído por IA).',
    kg_entity_desc_outcome:
      'Resultado de negocio o KPI reportado (p. ej. reducción de costos, mejora de conversión).',
    kg_entity_desc_theme:
      'Tema o problema de negocio transversal (p. ej. detección de fraude, forecasting).',
    kg_entity_rel_desc_belongs_to:
      'Un contenido o nombre de cliente apunta al cliente del maestro al que pertenece.',
    kg_entity_rel_desc_tagged_with:
      'Un contenido comparte la misma etiqueta con otros documentos.',
    kg_entity_rel_desc_in_industry:
      'Un contenido o cliente está clasificado en esa industria.',
    kg_entity_rel_desc_related_content:
      'Propuesta y caso de éxito del mismo cliente quedan enlazados para explorar el contexto comercial.',
    kg_entity_rel_desc_similar_to:
      'Dos documentos son semánticamente parecidos según embeddings (pueden cruzar clientes e industrias).',
    kg_entity_rel_desc_delivers:
      'El contenido describe o entrega esa oferta o línea de servicio.',
    kg_entity_rel_desc_uses_technology:
      'El contenido menciona o implementa esa tecnología.',
    kg_entity_rel_desc_achieved:
      'El contenido reporta ese resultado o KPI.',
    kg_entity_rel_desc_addresses_theme:
      'El contenido aborda ese tema o problema de negocio.',
    kg_entity_rel_desc_has_stage:
      'La propuesta está en esa etapa del ciclo comercial.',
    kg_entity_rel_desc_has_pricing_model:
      'La propuesta declara ese modelo comercial.',
    kg_entities_browse_heading: 'Inventario de entidades',
    kg_entities_browse_lead:
      'Busca un nodo por nombre, filtra por tipo y abre la entidad en el grafo desde la tabla.',
    kg_entities_filter_type: 'Tipo de entidad',
    kg_entities_filter_type_all: 'Todos los tipos',
    kg_entities_filter_search: 'Buscar por nombre',
    kg_entities_filter_search_placeholder: 'Nombre, etiqueta, cliente…',
    kg_entities_col_name: 'Nombre',
    kg_entities_col_type: 'Tipo',
    kg_entities_col_meta: 'Detalle',
    kg_entities_col_actions: 'Acciones',
    kg_entities_meta_content_type: 'Tipo de contenido: {type}',
    kg_entities_btn_view_graph: 'Ver en grafo',
    kg_entities_empty: 'No hay entidades que coincidan con el filtro.',
    kg_entities_busy_catalog: 'Cargando catálogo de entidades…',
    kg_entities_busy_list: 'Cargando entidades…',
    kg_entities_error_catalog: 'No se pudo cargar el catálogo de entidades.',
    kg_entities_error_list: 'No se pudo cargar el listado de entidades.',
    tags_cloud_heading: 'Nube de tags',
    tags_cloud_lead:
      'Explorá el catálogo visualmente: tamaño y color por popularidad. Clic en cualquier etiqueta para ver los documentos vinculados.',
    tags_cloud_hint: 'El tamaño refleja cuántos documentos comparten el tag.',
    tags_cloud_search_placeholder: 'Buscar etiqueta…',
    tags_cloud_stat_tags: '{n} etiquetas',
    tags_cloud_stat_top: 'Más popular: {tag}',
    tags_cloud_spotlight_label: 'Tag destacado',
    tags_cloud_spotlight_meta: '{n} documentos en el catálogo',
    tags_cloud_spotlight_btn: 'Explorar',
    tags_cloud_no_match: 'Ninguna etiqueta coincide con la búsqueda.',
    tags_busy_loading: 'Cargando tags…',
    tags_busy_browse: 'Cargando contenidos…',
    tags_cloud_empty: 'Aún no hay tags en el catálogo. Subí contenido con etiquetas desde Contenidos.',
    tags_browse_title: 'Contenido con {tag}',
    tags_browse_lead:
      'Listado de documentos que incluyen esta etiqueta. Podés abrir el detalle o filtrar por tipo.',
    tags_browse_back: 'Volver a la nube',
    tags_browse_empty: 'No hay contenidos con este tag.',
    tags_filter_type: 'Tipo',
    tags_btn_open: 'Ver detalle',
    tags_col_title: 'Título',
    tags_col_type: 'Tipo',
    tags_col_client: 'Cliente',
    tags_col_updated: 'Actualizado',
    tags_count_badge: '{n} docs',
    tags_merge_mode_btn: 'Fusionar etiquetas',
    tags_merge_mode_exit: 'Salir de fusión',
    tags_merge_bar_label: '{n} seleccionadas',
    tags_merge_btn: 'Fusionar',
    tags_merge_clear: 'Limpiar selección',
    tags_merge_confirm:
      '¿Fusionar {sources} en {target}? Se actualizarán los documentos del catálogo. Esta acción no se puede deshacer.',
    tags_merge_busy: 'Fusionando etiquetas…',
    tags_merge_ok: 'Fusión lista: {target} en {n} documento(s).',
    tags_merge_select_min: 'Seleccioná al menos dos etiquetas para fusionar.',
    err_tags_merge_min: 'Indicá al menos dos etiquetas distintas para fusionar.',
    err_tags_merge_failed: 'No se pudo completar la fusión de etiquetas.',
    tags_suggest_btn: 'Sugerencias Globant AI',
    tags_suggest_heading: 'Fusiones sugeridas',
    tags_suggest_lead:
      'Se detectan grafías duplicadas en el catálogo y Globant AI propone sinónimos. El tag canónico será el más usado; revisá cada grupo antes de fusionar.',
    tags_suggest_busy: 'Buscando fusiones sugeridas…',
    tags_suggest_empty: 'No hay fusiones sugeridas en este momento.',
    tags_suggest_reason_spelling:
      'La misma etiqueta aparece con distintas grafías en el catálogo.',
    tags_suggest_apply: 'Fusionar grupo',
    tags_suggest_dismiss: 'Descartar',
    tags_suggest_refresh: 'Actualizar sugerencias',
    err_tags_suggest_failed: 'No se pudieron obtener sugerencias de fusión.',
    contents_btn_new: 'Nuevo contenido',
    contents_btn_back_list: 'Volver a la lista',
    contents_editor_title_new: 'Nuevo contenido',
    contents_editor_title_edit: 'Editar contenido',
    contents_editor_title_view: 'Ver contenido',
    contents_editor_subtitle_view: 'Vista de solo lectura: podés revisar todos los campos pero no modificarlos.',
    contents_editor_readonly_banner: 'Modo solo lectura. No tenés permiso para editar este contenido.',
    contents_tooltip_view_detail: 'Ver detalle',
    contents_btn_view_file: 'Ver PDF',
    contents_editor_subtitle_new:
      'Elegí el tipo, subí el PDF y revisá los datos antes de guardar.',
    contents_editor_subtitle_edit:
      'Ajustá los datos o reemplazá el archivo para reindexar.',
    contents_step_type: 'Tipo',
    contents_step_file: 'Archivo',
    contents_step_review: 'Revisión',
    contents_type_helper:
      'Esto define a qué agente se va a indexar el contenido.',
    contents_dropzone_title: 'Arrastrá PDFs o elegí uno o más',
    contents_dropzone_aria: 'Zona para soltar PDFs o elegir archivos',
    err_contents_upload_too_large:
      'El archivo «{name}» supera el tamaño máximo permitido ({max_mb} MB).',
    err_contents_repair_drive_project_only:
      'Reparar desde Drive solo aplica a casos de éxito u onboarding con PDF en la carpeta del proyecto.',
    err_contents_repair_drive_success_only:
      'Reparar desde Drive solo aplica a casos de éxito u onboarding con PDF en la carpeta del proyecto.',
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
    contents_type_onboarding: 'Onboarding',
    contents_legend_title: 'Agentes:',
    contents_col_title: 'Título',
    contents_col_type: 'Tipo',
    contents_col_client: 'Cliente',
    contents_col_updated: 'Actualizado',
    contents_col_rag_status: 'Estado RAG',
    contents_col_actions: 'Acciones',
    contents_rag_status_success: 'Indexado',
    contents_rag_status_failed: 'Error',
    contents_rag_status_processing: 'Procesando',
    contents_rag_status_pending: 'Pendiente',
    contents_rag_status_missing: 'Sin documento',
    contents_btn_edit: 'Editar',
    contents_row_open_aria: 'Abrir {title} en vista de detalle',
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
    contents_step_analyzing_inline: 'Subiendo y analizando el PDF con IA…',
    contents_extract_phase_common:
      'Título, resumen, cliente, industria y hashtags…',
    contents_extract_phase_challenge: 'Challenge (problema de negocio)…',
    contents_extract_phase_solution: 'Solution (enfoque y entrega)…',
    contents_extract_phase_impact: 'Impacto, métricas, evidencia y notas…',
    contents_extract_phase_proposal:
      'Stage, modelo de pricing, esfuerzo y timeline…',
    contents_extract_phase_proposal_commercial:
      'Stage, pricing, esfuerzo, timeline y probabilidad…',
    contents_extract_phase_proposal_scope:
      'Studio, tópico, alcance y notas de entrega…',
    contents_extract_phase_client:
      'Estado de cuenta, proyectos activos y health score…',
    contents_extract_phase_onboarding: 'Tópico, categoría y audiencia…',
    contents_extract_phase_generic:
      'Campos comunes y específicos del documento…',
    contents_extract_pass_progress: 'Pasada {current} de {total}: {phase}',
    contents_batch_upload_extracting_detail:
      'Extrayendo {current} de {total}: {name} — {phase}',
    contents_batch_step_heading: 'Lote PDF · archivo {current} de {total}',
    contents_batch_step_read: 'Paso 1: leyendo el PDF en el navegador…',
    contents_batch_step_extract: 'Paso 2: extrayendo metadata con IA…',
    contents_batch_step_save: 'Paso 3: guardando e indexando en el catálogo…',
    contents_batch_counter_analyzed: '{analyzed} de {total} con metadata extraída',
    contents_batch_counter_analyzed_saved:
      '{analyzed} extraídos · {saved} guardados de {total}',
    contents_batch_counter_file: 'Archivo {current} / {total}',
    contents_batch_file_label: '{name}',
    contents_btn_cancel_upload: 'Cancelar',
    contents_cancel_confirm:
      'Se descartará el archivo subido y los datos extraídos. ¿Continuar?',
    contents_cancelled: 'Operación cancelada.',
    contents_form_heading: 'Revisá y completá los datos',
    contents_form_lead:
      'Completá cada campo con su etiqueta. Los bloques inferiores dependen del tipo de contenido elegido.',
    contents_lbl_client_new: 'Nombre del cliente nuevo',
    contents_client_toggle_aria: 'Alternar entre lista de clientes y alta rápida',
    contents_lbl_title: 'Título',
    contents_lbl_summary: 'Resumen',
    contents_lbl_client: 'Cliente',
    contents_lbl_industry: 'Industria',
    contents_sc_industry_heading: 'Industria del caso de éxito',
    contents_sc_industry_lead:
      'Elegí la industria de entrada antes de subir el PDF. Se usará para clasificar el contenido y asignar el cliente genérico si el documento no nombra una cuenta.',
    contents_sc_industry_continue: 'Continuar al archivo',
    contents_success_industry_field_hint:
      'Es la misma industria que elegiste al cargar el PDF. Podés cambiarla aquí antes de guardar.',
    contents_err_industry_required: 'Elegí una industria antes de subir el PDF.',
    contents_err_proposal_material_kind: 'Elegí el tipo de material de propuesta.',
    contents_err_proposal_studio_required: 'Indicá qué Studio Globant describe el documento.',
    contents_err_proposal_offering_required: 'Elegí el offering (AI Pods, T&M, etc.).',
    contents_lbl_tags: 'Hashtags',
    contents_ph_add_tag: '#nuevoTag',
    contents_btn_add_tag: 'Agregar',
    contents_specific_proposal_heading: 'Campos de propuesta',
    contents_specific_proposal_lead:
      'Clasificá el material (propuesta comercial, Studio, offering, corporativo) y su temática. Al guardar, el PDF se archiva en Drive bajo Propuestas/Catalogo/ con esa estructura.',
    contents_proposal_material_kind: 'Tipo de material',
    contents_proposal_kind_commercial: 'Propuesta comercial (cliente / RFP)',
    contents_proposal_kind_studio: 'Globant Studio',
    contents_proposal_kind_offering: 'Offering (AI Pods, modelos de engagement)',
    contents_proposal_kind_corporate: 'Material corporativo Globant',
    contents_proposal_kind_other: 'Otro',
    contents_proposal_topic: 'Temática',
    contents_proposal_topic_ph: 'Ej: aviación, loyalty, cloud, transformación con IA',
    contents_proposal_studio: 'Studio Globant',
    contents_proposal_studio_ph: 'Ej: Aviation Studio, AI Studio, Edge Studio',
    contents_proposal_offering: 'Offering',
    contents_specific_success_heading: 'Campos de success case',
    contents_specific_onboarding_heading: 'Campos de onboarding',
    contents_onboarding_topic: 'Tópico',
    contents_onboarding_topic_ph: 'Ej: PSS, NDC, Loyalty, Revenue Management',
    contents_onboarding_category: 'Categoría',
    contents_onboarding_category_ph: 'Ej: Negocio, Aerolínea, Dominio, Concepto',
    contents_onboarding_audience: 'Audiencia',
    contents_onboarding_audience_ph: 'Ej: Nuevos integrantes, Técnicos, Comercial',
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
    contents_extraction_done_confidence:
      'Metadata extraída (confianza {confidence}). Revisá y ajustá antes de guardar.',
    contents_confidence_high: 'alta',
    contents_confidence_medium: 'media',
    contents_confidence_low: 'baja',
    contents_extraction_warnings_prefix: 'Advertencias:',
    contents_warn_title_from_filename: 'Título inferido del nombre del archivo.',
    contents_warn_client_from_catalog: 'Cliente ajustado al catálogo existente.',
    contents_warn_industry_not_in_catalog:
      'Industria del documento descartada: no coincide con el catálogo de clientes.',
    contents_warn_client_from_filename: 'Cliente inferido del nombre del archivo.',
    contents_warn_client_created:
      'Cliente nuevo creado en el maestro (no había coincidencia cercana en el catálogo).',
    contents_warn_client_generic_industry:
      'Sin cuenta en el documento: asignado al cliente genérico de la industria detectada.',
    contents_warn_tags_enriched:
      'Tags ampliados con temas detectados en el documento (mejor para la nube de tags).',
    contents_warn_challenge_from_summary:
      'Challenge inferido del resumen porque el documento no trajo secciones separadas.',
    contents_warn_summary_from_notes:
      'El resumen se amplió con alcance/notas del documento para mejorar búsqueda y embeddings.',
    contents_warn_extraction_pass_empty: 'Pasada {pass} sin datos extraídos.',
    contents_warn_extraction_pass_failed: 'Pasada {pass} falló: {detail}',
    contents_uploaded: 'Archivo subido. Ahora podés extraer metadata.',
    contents_saved: 'Contenido guardado.',
    contents_similar_check_busy: 'Comparando con el catálogo…',
    contents_similar_title: 'Posible duplicado',
    contents_similar_lead:
      'La metadata de este success case se parece mucho a contenido que ya está en el catálogo:',
    contents_similar_lead_continue:
      'El borrador extraído se parece mucho a contenido que ya está en el catálogo:',
    contents_similar_item: '• {title} — {client} ({pct}% similar)',
    contents_similar_confirm: '¿Guardar igualmente?',
    contents_similar_confirm_continue: '¿Continuar igualmente?',
    contents_similar_batch_file: 'Archivo: {name}',
    contents_similar_declined: 'No se agregó: posible duplicado en catálogo.',
    contents_similar_batch_declined:
      '{n} archivo(s) no guardado(s) tras aviso de duplicado.',
    contents_similar_review_title: 'Revisión de posibles duplicados',
    contents_similar_review_lead:
      'Estos archivos ya se cargaron, pero se parecen a casos existentes. Marcá los que quieras eliminar del catálogo o conservá todos.',
    contents_similar_review_keep_all: 'Mantener todos',
    contents_similar_review_delete_selected: 'Eliminar marcados',
    contents_similar_review_delete_busy: 'Eliminando casos marcados…',
    contents_similar_review_deleted: 'Se eliminaron {n} caso(s) marcado(s) como duplicado.',
    contents_similar_review_item_heading: '{title}',
    contents_similar_review_item_file: 'Archivo: {name}',
    contents_similar_review_item_delete: 'Eliminar del catálogo',
    contents_similar_review_batch_done:
      'Lote finalizado. {n} archivo(s) con posibles duplicados para revisar.',
    contents_external_url_mapping_heading: 'URL por archivo (recomendado en lote)',
    contents_external_url_mapping_lead:
      'Cargá mapping.json (uno por PDF, clave fileName → externalUrl). Cada success case guardará su propia drive_file_url sin copiar el PDF a Drive.',
    contents_external_url_mapping_pick: 'Elegir mapping.json',
    contents_external_url_mapping_loaded: '{n} URL(s) cargadas desde mapping.json',
    contents_external_url_mapping_invalid: 'mapping.json inválido o sin entradas externalUrl.',
    contents_external_url_mapping_read_err: 'No se pudo leer mapping.json.',
    contents_external_url_label: 'URL externa (fallback, un solo archivo)',
    contents_external_url_placeholder: 'https://…',
    contents_external_url_lead:
      'Si no usás mapping.json, podés pegar una URL acá como respaldo (un archivo). Con mapping.json, cada PDF toma su URL según fileName.',
    err_content_duplicate_similar:
      'Metadata muy similar a un success case existente. Revisá el catálogo antes de guardar.',
    contents_deleted: 'Contenido eliminado.',
    contents_confirm_delete:
      'Se eliminará del catálogo y del índice del agente. ¿Continuar?',
    contents_batch_upload_extracting: 'Extrayendo {current} de {total}: {name}',
    contents_batch_upload_saving: 'Guardando {current} de {total}: {name}',
    contents_batch_done_all_ok: 'Se cargaron {n} archivos correctamente.',
    contents_batch_done_partial: '{ok} archivos cargados; {fail} fallaron.',
    contents_batch_skipped_non_pdf: 'Se omitieron {n} archivo(s) que no son PDF.',
    contents_batch_err_replace_one_file: 'Al editar solo podés reemplazar un PDF a la vez.',
    contents_batch_too_many: 'Elegí como máximo {max} archivos por lote.',
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
    contents_btn_reindex_metadata: 'Actualizar metadata',
    contents_btn_reextract: 'Re-extraer metadata',
    contents_busy_reindexing_metadata: 'Actualizando metadata en RAG…',
    contents_busy_reextracting: 'Releyendo PDF y extrayendo metadata con IA…',
    contents_reindex_metadata_done: 'Metadata actualizada.',
    contents_reextract_done: 'Metadata extraída de nuevo. Revisá los campos y guardá.',
    contents_reindex_metadata_failed: 'No se pudo actualizar la metadata.',
    contents_confirm_reextract:
      '¿Volver a analizar el PDF con IA? Se sobrescribirán los campos del formulario. No se guarda hasta pulsar Guardar.',
    contents_err_reextract_no_file: 'No hay PDF en Drive para re-analizar.',
    err_contents_reextract_no_file:
      'Este contenido no tiene un PDF asociado en Drive para re-analizar.',
    err_contents_reextract_file_missing:
      'El PDF ya no existe en Drive. Reparar índice o subí un archivo nuevo.',
    contents_tooltip_edit: 'Editar',
    contents_tooltip_view: 'Abrir archivo',
    contents_tooltip_repair: 'Reindexar desde Drive',
    contents_tooltip_reindex_meta: 'Actualizar metadata',
    contents_tooltip_delete: 'Eliminar',
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
    login_footnote:
      'Al continuar, Google puede pedir permiso para ver tu correo, nombre y foto de perfil del directorio de tu organización.',
    visitor_title: 'Sin rol asignado',
    visitor_body:
      'No tenés un rol asignado, así que el acceso es limitado. Si necesitás más funciones, pedí acceso a quien administre Aviators.',
    visitor_body_html:
      'No tenés un rol asignado, así que el acceso es limitado. Podés <strong>solicitar acceso</strong> indicando el rol que necesitás y el motivo; un administrador revisará tu pedido.',
    visitor_request_access_btn: 'Solicitar acceso',
    nav_request_access: 'Solicitar acceso',
    page_request_access_title: 'Solicitar acceso',
    page_request_access_lead:
      'Completá el formulario para que un administrador de Aviators reciba tu pedido. Te avisaremos cuando se asigne un rol.',
    access_request_form_heading: 'Tu solicitud',
    access_request_form_lead:
      'Elegí el rol que necesitás. El motivo es opcional. Solo podés tener una solicitud pendiente a la vez.',
    access_request_role_label: 'Rol deseado',
    access_request_role_placeholder: 'Seleccioná un rol…',
    access_request_reason_label: 'Motivo (opcional)',
    access_request_reason_ph: 'Ej.: necesito cargar propuestas para el equipo de presales…',
    access_request_reason_empty: '(sin indicar)',
    access_request_submit_btn: 'Enviar solicitud',
    access_request_busy_submit: 'Enviando solicitud…',
    access_request_submit_done: 'Solicitud enviada. Un administrador la revisará pronto.',
    access_request_pending_title: 'Ya tenés una solicitud pendiente',
    access_request_pending_detail: 'Pediste el rol {role} el {date}. Te avisaremos cuando se resuelva.',
    access_request_err_not_visitor: 'Ya tenés un rol asignado; no hace falta solicitar acceso.',
    access_request_err_reason: 'Indicá el motivo de la solicitud.',
    access_request_err_reason_long: 'El motivo es demasiado largo (máx. 2000 caracteres).',
    access_request_err_pending: 'Ya tenés una solicitud pendiente.',
    access_request_err_supabase: 'No se pudo registrar la solicitud. Contactá a quien administra Aviators.',
    access_request_mail_subject: 'Aviators · nueva solicitud de acceso',
    access_request_mail_body:
      'Un visitante envió una solicitud de acceso en Aviators.\n\n' +
      'Email: {email}\n' +
      'Nombre: {name}\n' +
      'Rol solicitado: {role}\n' +
      'Motivo:\n{reason}\n\n' +
      'ID solicitud: {id}\n' +
      'Abrir Aviators: {url}\n\n' +
      'Revisá la solicitud en Configuración → Usuarios → Solicitudes.',
    access_request_mail_url_missing: '(URL de la Web App no disponible)',
    home_welcome_title: 'Bienvenido a la suite agéntica de Aviators',
    home_welcome_lead_html:
      'Para más información de uso ir al <a href="#" data-nav-page="faq" class="font-medium text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">FAQ</a>, o hacé una pregunta directamente.',
    page_onboarding_title: 'Onboarding · Aviation Studio',
    page_onboarding_lead_html:
      'Consultá conceptos de aviación, terminología de dominio y metodología del estudio. Todas las respuestas provienen del <strong>agente de onboarding</strong> y su repositorio indexado.',
    page_onboarding_chat_lead:
      'Preguntá sobre PSS, NDC, loyalty, procesos del studio u otros temas de onboarding. Siempre responde el agente especializado.',
    onboarding_consult_heading: 'Conversación con el agente de onboarding',
    onboarding_consult_lead:
      'Escribí tu pregunta abajo. No se enruta al orquestador: cada mensaje lo responde el agente de onboarding con su corpus indexado.',
    page_globant_offering_title: 'Globant Offering',
    page_globant_offering_lead_html:
      'Consultá offerings comerciales, Studios de Globant, AI Pods y material indexado del agente de propuestas. Todas las respuestas provienen de ese agente especializado.',
    page_globant_offering_chat_lead:
      'Preguntá sobre offerings, studios, casos de éxito o cómo armar una propuesta comercial. Siempre responde el agente de propuestas con su corpus indexado.',
    globant_offering_consult_heading: 'Conversación con el agente de propuestas',
    globant_offering_consult_lead:
      'Escribí tu pregunta abajo. No se enruta al orquestador: cada mensaje lo responde el agente de propuestas.',
    chat_empty_hint_globant_offering:
      'Preguntá sobre offerings de Globant, studios recomendados, AI Pods o redacción comercial. Usá los prompts rápidos o escribí tu consulta.',
    page_proposal_building_title: 'Armado de propuestas',
    page_proposal_building_lead_html:
      'Seguí los pasos: cargá uno o más documentos del cliente, validá el brief y el match con el catálogo, configurá el deck y revisá los <strong>Studios</strong> recomendados. Para consultas al agente, usá <strong>Globant Offering</strong>.',
    page_proposal_building_chat_lead:
      'Flujo guiado por pasos; el chat con el agente de propuestas está en Globant Offering.',
    pb_consult_heading: 'Brief y conversación',
    pb_consult_lead:
      'El brief se valida en los pasos del armado. Para conversar con el agente, abrí Globant Offering.',
    chat_empty_hint_proposal_building:
      'Usá Globant Offering para consultar al agente de propuestas.',
    pb_btn_open_globant_offering: 'Abrir Globant Offering',
    pb_studios_next_hint:
      '¿Querés afinar redacción, pricing o próximos pasos? Abrí Globant Offering y consultá al agente de propuestas.',
    pb_btn_validate_brief: 'Validar brief',
    pb_btn_confirm_brief: 'Confirmar brief',
    pb_btn_add_scope_item: 'Agregar ítem',
    pb_btn_remove_scope_item: 'Quitar',
    pb_btn_add_milestone: 'Agregar hito',
    pb_btn_continue_industry: 'Continuar',
    pb_btn_start_building: 'Armar propuesta',
    pb_btn_continue_deck_options: 'Continuar',
    pb_deck_options_heading: 'Contenido del deck',
    pb_deck_options_lead:
      'Elegí qué secciones incluir en la presentación. La agenda se arma automáticamente según lo que conservés.',
    pb_lbl_include_globant: '¿Incluir sección «Somos Globant»?',
    pb_include_globant_lead:
      'Si elegís no, se quitan las slides 4 a 8 de la plantilla (quiénes somos).',
    pb_lbl_include_airlines_studio: '¿Incluir información del studio de Aerolíneas?',
    pb_include_airlines_studio_lead:
      'Si elegís no, se quitan las slides del studio de aerolíneas (9 a 11 en la plantilla).',
    pb_option_yes: 'Sí, incluir',
    pb_option_no: 'No, omitir',
    pb_agenda_item_globant: 'Somos Globant',
    pb_agenda_item_airlines_studio: 'Studio de Aerolíneas',
    pb_agenda_item_understanding: 'Nuestro entendimiento',
    pb_agenda_item_solution: 'Nuestra solución',
    pb_agenda_item_success_cases: 'Casos de éxito',
    pb_agenda_line_fmt: '{label}',
    pb_validation_heading: 'Validar brief extraído',
    pb_validation_lead:
      'Revisá y corregí lo extraído de todos los documentos. Este brief guía el deck, los studios y el asesor.',
    pb_lbl_client: 'Cliente',
    pb_ph_client: 'Nombre del cliente (si aplica)',
    pb_lbl_scope_items: 'Qué pide el cliente / alcance',
    pb_lbl_scope_title: 'Ítem',
    pb_ph_scope_title: 'Título corto del pedido',
    pb_ph_scope_desc: 'Nuestro entendimiento de lo solicitado',
    pb_lbl_commercial_model: 'Modelo comercial',
    pb_lbl_milestones: 'Fechas e hitos',
    pb_lbl_milestone_label: 'Hito',
    pb_lbl_milestone_date: 'Fecha',
    pb_ph_milestone_label: 'Ej. Go-live, entrega fase 1',
    pb_ph_milestone_date: 'Ej. 2026-09-30 o Q3 2026',
    pb_lbl_detected_language: 'Idioma detectado',
    pb_lang_es: 'Español',
    pb_lang_en: 'English',
    pb_industry_heading: 'Industria, idioma y deck base',
    pb_industry_lead:
      'Elegí la industria y el idioma de redacción de la propuesta. Por ahora solo está disponible el deck de Aerolíneas en español.',
    pb_lbl_industry: 'Industria',
    pb_lbl_proposal_language: 'Idioma de la propuesta',
    pb_proposal_language_lead: 'Define en qué idioma se redactará el deck y el contenido generado con IA.',
    pb_option_unavailable: 'Próximamente',
    pb_industry_airlines: 'Aerolíneas',
    pb_industry_logistics: 'Logística',
    pb_deck_airlines: 'Deck base · Aerolíneas',
    pb_deck_logistics: 'Deck base · Logística',
    pb_deck_selected: 'Deck seleccionado: {deck}',
    pb_busy_extracting: 'Extrayendo brief del material…',
    pb_busy_resolving_deck: 'Preparando deck base…',
    pb_busy_creating_deck: 'Creando y personalizando presentación en Drive…',
    pb_busy_creating_deck_title: 'Creando propuesta',
    pb_create_step_label: 'Paso {current} de {total}',
    pb_step_compose_understanding: 'Redactando nuestro entendimiento con IA…',
    pb_step_copy_deck: 'Copiando plantilla en Drive…',
    pb_step_compose_success_rationales: 'Explicando por qué encajan los casos de éxito con IA…',
    pb_step_customize_slides: 'Personalizando slides y casos de éxito…',
    pb_deck_created_line: 'Presentación creada en Drive: {name}',
    pb_deck_open_link_md: 'Abrir presentación: [{name}]({url})',
    pb_deck_success_cases_line: 'Casos de éxito incluidos: {count}',
    pb_client_fallback_label: 'Cliente',
    pb_understanding_fallback: 'Alcance a confirmar con el cliente.',
    pb_understanding_intro:
      'Nuestro cliente {client} está solicitando lo siguiente:',
    pb_deck_title_fallback: 'Alcance de la propuesta',
    pb_success_case_link_label: 'Ver caso de éxito',
    pb_success_case_why_label: 'Por qué incluimos este caso en la propuesta:',
    pb_success_case_rationale_fallback:
      'Referencia alineada con la industria y el alcance validado del brief.',
    pb_success_case_summary_fallback: 'Caso de éxito relevante para esta propuesta.',
    pb_success_case_title_fallback: 'Caso de éxito',
    pb_err_slides_api_unavailable:
      'Falta habilitar el servicio avanzado de Google Slides en el proyecto Apps Script.',
    pb_err_deck_not_google_slides:
      'La plantilla del deck debe ser una presentación de Google Slides (no PowerPoint u otro formato).',
    pb_warn_template_slide_missing:
      'La plantilla no tiene la slide {slide} para casos de éxito; se omitió esa sección.',
    pb_warn_no_success_cases:
      'No se encontraron casos de éxito aplicables; se quitó la slide plantilla de casos.',
    pb_warn_success_slide_clone_failed:
      'No se pudieron clonar las slides de casos de éxito en la presentación.',
    pb_err_deck_template_missing:
      'Falta configurar la plantilla base del deck (PROPOSAL_DECK_AIRLINES_ID o PROPOSAL_DECK_LOGISTICS_ID en Propiedades del script).',
    pb_err_deck_template_not_found:
      'No se encontró la plantilla base del deck en Drive. Verificá el ID configurado.',
    pb_err_extract: 'No se pudo extraer el brief.',
    pb_err_extract_empty: 'Escribí un mensaje o adjuntá material antes de validar el brief.',
    pb_err_industry_required: 'Elegí una industria (aerolíneas o logística).',
    pb_err_attachment_mime: 'Formato no admitido para «{name}» ({mime}).',
    pb_warn_extract_sparse: 'Poca información detectada; completá los campos manualmente.',
    pb_status_building_ready:
      'Brief validado · {industry} · {deck}. Podés seguir conversando para armar la propuesta.',
    pb_status_intake: 'Paso 1: cargá material y validá el brief.',
    pb_status_materials: 'Paso 1 · Materiales: subí todos los documentos del RFP o brief.',
    pb_status_brief: 'Paso 2 · Brief: confirmá cliente, alcance y fechas extraídas.',
    pb_status_configure: 'Paso 3 · Configuración: industria, idioma y secciones del deck.',
    pb_status_building_progress: 'Paso 4 · Creando presentación en Drive…',
    pb_status_studios: 'Paso 5 · Studios: revisá qué áreas de Globant encajan con la propuesta.',
    pb_stepper_aria: 'Pasos del armado de propuestas',
    pb_step_materials: 'Materiales',
    pb_step_brief: 'Brief',
    pb_step_configure: 'Configurar',
    pb_step_deck: 'Deck',
    pb_step_studios: 'Studios',
    pb_step_advisor: 'Asesor',
    pb_materials_heading: 'Material de entrada',
    pb_materials_lead:
      'Subí todos los documentos relevantes (RFP, anexos, notas). Los analizamos en conjunto antes de validar el brief.',
    pb_lbl_materials_files: 'Archivos',
    pb_lbl_materials_notes: 'Contexto adicional (opcional)',
    pb_ph_materials_notes: 'Ej. prioridades del cliente, restricciones, contactos clave…',
    pb_materials_formats: 'PDF, Word, texto, CSV o imagen. Podés seleccionar varios archivos.',
    pb_btn_analyze_materials: 'Analizar materiales',
    pb_materials_count: '{count} archivo(s) listo(s) para analizar.',
    pb_material_status_pending: 'Pendiente',
    pb_material_status_done: 'Analizado',
    pb_material_status_error: 'Error',
    pb_busy_extracting_file: 'Extrayendo {name} ({current}/{total})…',
    pb_busy_merging_briefs: 'Unificando brief de todos los documentos…',
    pb_lbl_project_summary: 'Resumen del pedido',
    pb_ph_project_summary: 'Síntesis ejecutiva detectada en los materiales',
    pb_lbl_technology_hints: 'Tecnologías y dominios detectados',
    pb_story_extracted_heading: 'Lo que dice el material',
    pb_story_extracted_lead: 'Nombre y contexto extraídos de los documentos analizados.',
    pb_story_unknown_client: '(cliente no detectado)',
    pb_story_catalog_heading: 'Catálogo de clientes',
    pb_story_catalog_match_lead: 'Encontramos una coincidencia en la base de Aviators.',
    pb_story_catalog_nomatch_lead: 'No hay match exacto. Podés elegir un cliente sugerido o editar el nombre.',
    pb_story_industry_line: 'Industria: {industry}',
    pb_story_subindustry_line: 'Sub-industria: {sub}',
    pb_story_score_line: 'Confianza del match: {score}%',
    pb_building_heading: 'Presentación en Drive',
    pb_building_lead: 'La plantilla se copió y personalizó con el entendimiento y casos de éxito relevantes.',
    pb_building_ready_line: 'Deck listo: {name} · Casos de éxito: {cases}',
    pb_btn_open_deck: 'Abrir presentación',
    pb_studios_heading: 'Studios recomendados',
    pb_studios_lead:
      'El agente de propuestas y el catálogo indexado sugieren qué Globant Studios deberían acoplarse a esta oportunidad.',
    pb_busy_recommend_studios: 'Consultando studios con el agente de propuestas…',
    pb_studios_empty: 'No se generaron recomendaciones de studios.',
    pb_btn_continue_advisor: 'Continuar al asesor',
    pb_studio_fallback_rationale: 'Studio presente en el catálogo indexado de propuestas.',
    pb_err_studios: 'No se pudieron recomendar studios.',
    pb_err_use_builder: 'Usá los pasos del armado arriba; el chat del asesor se habilita al final.',
    pb_business_context_heading: 'Contexto comercial',
    pb_business_context_lead:
      'Datos de negocio extraídos del material. Completá o corregí lo que falte antes de armar el deck.',
    pb_lbl_rfp_deadline: 'Fecha límite de entrega (RFP)',
    pb_ph_rfp_deadline: 'Ej. 2026-07-15 o «15 de julio 2026»',
    pb_lbl_budget_amount: 'Presupuesto (monto)',
    pb_ph_budget_amount: 'Ej. 250000 o «200k–300k USD»',
    pb_lbl_budget_currency: 'Moneda',
    pb_ph_budget_currency: 'Ej. USD, EUR, ARS',
    pb_lbl_budget_notes: 'Notas de presupuesto',
    pb_ph_budget_notes: 'Ej. tope máximo, exclusión de impuestos, por fases',
    pb_lbl_stakeholders: 'Stakeholders / contactos',
    pb_btn_add_stakeholder: 'Agregar contacto',
    pb_ph_stakeholder_name: 'Nombre',
    pb_ph_stakeholder_role: 'Cargo / rol',
    pb_ph_stakeholder_org: 'Empresa o área',
    pb_ph_stakeholder_email: 'Email (opcional)',
    pb_lbl_business_objectives: 'Objetivos de negocio',
    pb_ph_business_objectives: 'Un objetivo por línea',
    pb_lbl_constraints: 'Restricciones y condiciones',
    pb_ph_constraints: 'Una restricción por línea',
    pb_btn_open_studio_catalog: 'Ver en catálogo',
    pb_btn_open_studio_kg: 'Ver en grafo',
    pb_btn_open_studio_drive: 'Abrir en Drive',
    pb_pricing_time_and_materials: 'Time & Materials',
    pb_pricing_staff_augmentation: 'Staff Augmentation',
    pb_pricing_fixed_price: 'Fixed Price',
    pb_pricing_subscription: 'Subscription',
    pb_pricing_ai_pods: 'AI Pods',
    orch_step_proposal_building_answering: 'Armando propuesta con el agente…',
    chat_empty_hint_onboarding:
      'Ej.: ¿Qué es PSS? · ¿Cómo funciona NDC? · Metodología del Aviation Studio',
    orch_step_onboarding_answering: 'El agente de onboarding está respondiendo…',
    orch_step_globant_offering_answering: 'El agente de propuestas está respondiendo…',
    dashboard_title: 'Chat general',
    dashboard_lead:
      'Escribí abajo y seguí la conversación arriba. Las respuestas aparecen como mensajes.',
    session_no_role_line: 'No tenés un rol asignado.',
    session_role_err_supabase:
      'No se pudo leer tu rol desde la BD. Si el problema continúa, contactá a quien administra Aviators.',
    busy_connecting: 'Conectando…',
    session_check: 'Cargando roles y agentes…',
    role_label_visitor: 'Visitante',
    role_option_admin: 'Admin',
    role_option_presales: 'Presales',
    role_option_manager: 'Manager',
    role_option_tech: 'Tech',
    role_option_client_partner: 'Client Partner',
    role_option_miembro: 'Miembro',
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
    home_orchestrator_ok: 'Orquestador activo',
    home_orchestrator_missing_registry: 'Orquestador no configurado en Aviators.',
    home_orchestrator_missing_remote:
      'El perfil RAG del orquestador ({profile}) no está en Globant. Creá o sincronizá los agentes por defecto.',
    home_orchestrator_unknown:
      'No se pudo verificar el orquestador en Globant. Revisá la conexión o los agentes.',
    admin_agent_badge_remote_missing: 'Sin perfil RAG en Globant',
    admin_agent_badge_hub_missing: 'Sin Agent en Globant Hub',
    dash_contents_title: 'Contenidos',
    dash_clients_title: 'Clientes',
    contents_readonly_notice: 'Solo lectura',
    clients_readonly_notice: 'Solo lectura',
    dash_detail_empty: 'Sin desglose todavía.',
    dash_agent_kind_orchestrator: 'Orquestador',
    dash_agent_kind_success_cases: 'Success cases',
    dash_agent_kind_proposals: 'Propuestas',
    dash_agent_kind_clients: 'Clientes (corpus)',
    dash_agent_kind_onboarding: 'Onboarding',
    dash_agent_kind_other: 'Personalizado',
    dash_agent_kind_other_named: '{name}',
    dash_agents_strategies_line: 'Estrategias: {list}',
    dash_industry_unknown: 'Sin industria',
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
    contents_batch_industry_label: 'Industria',
    contents_batch_industry_apply: 'Asignar industria',
    contents_batch_industry_confirm:
      '¿Asignar la industria «{industry}» a {n} caso(s) de éxito seleccionado(s)?',
    contents_batch_industry_busy: 'Asignando industria…',
    contents_batch_industry_done: 'Industria asignada en {n} caso(s) de éxito.',
    contents_batch_industry_partial:
      '{ok} actualizado(s); {skip} omitido(s) (no son success case o no encontrados); {fail} con error.',
    contents_batch_industry_pick: 'Elegí una industria para asignar.',
    contents_batch_industry_none_sc: 'Ningún success case seleccionado.',
    contents_batch_client_label: 'Cliente',
    contents_batch_client_apply: 'Asignar cliente',
    contents_batch_client_confirm:
      '¿Asignar el cliente «{client}» a {n} caso(s) de éxito seleccionado(s)?',
    contents_batch_client_busy: 'Asignando cliente…',
    contents_batch_client_done: 'Cliente asignado en {n} caso(s) de éxito.',
    contents_batch_client_partial:
      'Cliente: {ok} actualizado(s), {skip} omitido(s), {fail} error(es).',
    contents_batch_client_pick: 'Elegí un cliente del catálogo.',
    contents_batch_client_unknown: 'Cliente no encontrado en el maestro de clientes.',
    label_no_email: '(sin email)',
    label_em_dash: '—',
    err_generic: 'Error.',
    err_drive_root_not_configured:
      'Falta configurar DRIVE_ROOT_FOLDER_ID en Propiedades del script de Apps Script (carpeta raíz de Drive para PDFs de casos de éxito y onboarding).',
    err_supabase_not_configured:
      'Falta configurar Supabase (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Propiedades del script).',
    err_salesforce_sheet_not_configured:
      'Falta configurar SALESFORCE_ACCOUNTS_SPREADSHEET_ID en Propiedades del script (ID de la planilla Airlines Accounts).',
    err_scriptapp_scope:
      'Faltan permisos para gestionar triggers (script.scriptapp). Volvé a autorizar la Web App tras actualizar el despliegue.',
    admin_sf_sync_trigger_scope_required:
      'No se puede verificar el trigger: falta autorizar el permiso script.scriptapp (nueva versión de la app).',
    err_supabase_sheets_disabled:
      'El backend en planillas está deshabilitado. Configurá AVIATORS_DATA_BACKEND=supabase.',
    err_role_supabase: 'No se pudo consultar roles en Supabase.',
    err_supabase_http: 'Error de comunicación con Supabase.',
    err_supabase_json: 'Respuesta inválida de Supabase.',
    err_server_code: 'Error del servidor ({code}).',
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
    chat_progress_sr: 'Progreso de la consulta',
    chat_step_preparing: 'Preparando contexto…',
    chat_step_searching_index: 'Buscando en el índice de conocimiento…',
    chat_step_reading_sources: 'Leyendo fuentes relevantes…',
    chat_step_generating: 'Generando respuesta…',
    chat_step_loading_context: 'Preparando documentos seleccionados…',
    chat_step_consulting_model: 'Consultando el modelo…',
    chat_step_composing: 'Redactando la respuesta…',
    chat_attach_btn: 'Adjuntar PDF',
    chat_attach_hint:
      'Opcional: adjuntá un PDF para analizarlo. No se guarda; el orquestador lo procesa y lo compara con el catálogo.',
    chat_attach_remove: 'Quitar adjunto',
    chat_attach_selected: 'Adjunto: {name}',
    chat_ephemeral_need_prompt: 'Escribí qué querés analizar del documento adjunto.',
    chat_step_ephemeral_validating: 'Validando documento…',
    chat_step_ephemeral_matching: 'Buscando contenidos similares en el catálogo…',
    chat_step_ephemeral_analyzing: 'Analizando documento con IA…',
    busy_ephemeral_doc: 'Analizando documento adjunto…',
    err_ephemeral_doc_payload: 'Adjunto inválido.',
    err_ephemeral_doc_empty: 'El archivo adjunto está vacío.',
    err_ephemeral_doc_mime: 'Formato no admitido para «{name}» ({mime}). Usá PDF.',
    err_ephemeral_doc_too_large: 'El archivo supera {max_mb} MB.',
    err_ephemeral_doc_not_eligible:
      'Solo se aceptan RFP o documentos de empresas de logística, aerolíneas o aeropuertos.',
    meta_ephemeral_doc_analyzed: 'Documento analizado: {name}',
    chat_no_relevant_content: 'No encontré información relevante en mi base de conocimiento para responder tu consulta. ¿Podrías reformularla o hacer una pregunta más específica?',
    chat_sr_you: 'Vos',
    chat_sr_agent: 'Asistente',
    chat_refs_title: 'Fuentes relacionadas',
    chat_refs_summary: 'Fuentes relacionadas ({count})',
    chat_refs_open_link: 'Abrir archivo',
    chat_ref_action_drive: 'Ver PDF',
    chat_ref_action_view_pdf: 'Ver PDF en la app',
    chat_ref_action_catalog: 'Ver ficha',
    chat_ref_file_url_label: 'Archivo',
    chat_ref_open_url: 'Abrir enlace del archivo',
    chat_ref_action_client: 'Ver cliente',
    chat_ref_resolving_link: 'Resolviendo enlace del documento…',
    chat_ref_type_selected_file: 'Documento Drive',
    chat_ref_catalog_denied: 'No tenés permiso para ver Contenidos.',
    chat_ref_agents_denied: 'No tenés permiso para ver Agentes.',
    chat_ref_agent_not_in_list: 'No encontré el agente «{profile}» en el listado.',
    chat_ref_not_found: 'No encontré el archivo en Drive.',
    pdf_viewer_title: 'Documento',
    pdf_viewer_loading: 'Cargando PDF…',
    pdf_viewer_error: 'No se pudo mostrar el PDF.',
    pdf_viewer_open_external: 'Abrir en Drive',
    pdf_viewer_open_ficha: 'Ver ficha del contenido',
    pdf_viewer_use_external:
      'No se pudo incrustar el PDF aquí. Usá «Abrir en Drive» o abrilo en una pestaña nueva.',
    home_chat_banner_setup:
      'El asistente no está disponible por ahora. Si el problema sigue, contactá a quien administra Aviators.',
    ph_question: 'Escribí tu mensaje…',
    ask_agent_btn: 'Enviar',
    ask_btn: 'Enviar con documentos',
    static_drive_files_heading: 'Archivos de contexto',
    static_drive_files_lead:
      'La lista muestra documentos de la cuenta de Google con la que corre Aviators (dueño del despliegue), no archivos privados de cada visitante. Marcá hasta 5 para incluir en esta respuesta.',
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
      'Primero guardá perfil e instrucciones. Los PDF que elegís desde tu equipo se indexan en Globant al subirlos (no van a Drive). Las carpetas/archivos de Drive siguen requiriendo sincronizar el corpus. Eliminar saca el agente del registro en Aviators.',
    admin_agent_sec_sources_heading: 'Fuentes para el índice',
    admin_agent_sec_sources_lead:
      'Arrastrá o elegí PDF del equipo: se indexan en el perfil RAG de Globant (Enterprise AI) y aparecen como chips. Completá antes el nombre del perfil. Si agregás carpetas o archivos desde Drive, usá solo ese tipo de fuente en este agente o bien solo PDF locales — no mezclar.',
    admin_agent_sec_indexed_lead:
      'Listado remoto en Globant para este perfil. Refrescá la lista después de sincronizar.',
    admin_agent_tab_general: 'General',
    admin_agent_tab_api: 'API Globant',
    admin_agent_tab_sources: 'Fuentes',
    admin_agent_tabs_aria: 'Secciones del agente',
    admin_agent_dropzone_aria: 'Zona para arrastrar archivos PDF',
    admin_agent_dropzone_hint:
      'Arrastrá uno o varios PDF aquí, o elegí archivos en tu equipo.',
    admin_agent_pdf_max_size_hint: 'Tamaño máximo por PDF desde esta pantalla: {mb} MB.',
    btn_admin_agent_upload_pdf: 'Elegir PDF',
    btn_go_agents: 'Ir a Agentes',
    admin_upload_progress: 'Subiendo archivo {current} de {total}…',
    admin_upload_progress_globant:
      'Indexando en Globant archivo {current} de {total}… (puede tardar)',
    admin_upload_done_added:
      'Se añadieron {n} PDF al índice RAG de Globant. Guardá el agente para persistir la selección.',
    err_admin_upload_only_pdf:
      'Solo se pueden subir archivos PDF para este corpus.',
    err_admin_upload_profile_required:
      'Indicá el nombre del perfil del agente antes de subir PDF desde tu equipo.',
    err_admin_agent_sync_mixed_sources:
      'No podés mezclar en el mismo agente carpetas o archivos de Drive con PDF subidos directo a Globant. Usá solo un tipo de fuente o separá en dos agentes.',
    admin_agent_sync_rag_only_note:
      'Los PDF locales ya están en Globant; solo se actualizó la marca de sincronización.',
    err_admin_upload_empty: 'Archivo vacío: «{name}».',
    err_admin_upload_decode: 'No se pudo leer el archivo «{name}».',
    err_admin_upload_too_large:
      'El archivo «{name}» supera el tamaño máximo permitido ({max_mb} MB). No se indexa nada en Globant hasta que uses un PDF más chico.',
    err_admin_upload_rpc_lost:
      'No se completó la subida (suele pasar si el PDF supera el límite o la red corta). Máximo {max_mb} MB por archivo. No se creó índice parcial en Globant.',
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
    admin_agent_sidebar_empty_title: 'Empezá con tu primer agente',
    admin_agent_sidebar_empty_lead:
      'Cada agente une un perfil Globant, instrucciones del modelo y fuentes para indexar. Creá uno a mano o generá los predeterminados del proyecto.',
    admin_agent_ro_sidebar_empty_title: 'Sin agentes configurados',
    admin_agent_ro_sidebar_empty_lead:
      'Cuando existan agentes, vas a poder consultar su configuración desde esta lista.',
    admin_agent_editor_selected: 'Agente seleccionado',
    admin_agent_editor_new: 'Nuevo agente',
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
    admin_agent_seed_done_globant:
      'Se sincronizaron {g} agente(s) en Globant Agents API (prompt context/instructions).',
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
    err_admin_agent_api_model_invalid:
      'El modelo «{model}» no está en el catálogo API. Ejemplos válidos: {samples}.',
    err_admin_agent_api_strategy_invalid:
      'La estrategia «{strategy}» no está en el catálogo API. Ejemplos: {samples}.',
    err_admin_agent_api_id:
      'Falta idOrName para guardar en Globant API.',
    err_admin_agent_id: 'Falta el identificador del agente.',
    err_admin_agent_not_found: 'No se encontró ese agente.',
    err_admin_agent_save: 'No se pudo guardar el agente en Globant.',
    err_admin_agent_seed:
      'No se pudieron crear o verificar los agentes por defecto.',
    confirm_delete_agent_registry:
      '¿Eliminar este agente de Aviators? Si existe en Globant (modo RAG), también se pedirá borrar el perfil allí.',
    admin_agent_delete_modal_title: '¿Eliminar este agente?',
    admin_agent_delete_modal_cancel: 'Cancelar',
    admin_agent_delete_modal_confirm: 'Sí, eliminar',
    confirm_dialog_cancel: 'Cancelar',
    confirm_dialog_confirm: 'Continuar',
    confirm_dialog_type_label: 'Escribí {phrase} para confirmar',
    admin_reset_all_confirm_title: 'Restablecer todos los datos',
    admin_reset_all_confirm_phrase: 'RESTABLECER',
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
    chip_file_globant: 'GLOBANT',
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
    globant_hint_document_chat:
      'Análisis de PDFs adjuntos: Chat Assistant permanente (defecto aviators-document-files, autocreado con POST /v1/assistant) + /v1/files + /v1/assistant/chat. Cada PDF se borra con DELETE /v1/files/{id} al terminar; el assistant queda.',
    globant_hint_rag:
      'Tras Actualizar verás cada agente (perfil RAG). Docs = archivos indexados. «Eliminar agente» borra el perfil en Globant.',
    globant_hint_no_key:
      'Aquí aparecen datos sólo cuando el script tiene GLOBANT_AGENTS_API_KEY y el modo es Globant.',
    llm_meta_asst: 'Globant Assistant (/v1/chat) · perfil/asistente {hint} · {loc}',
    llm_meta_rag: 'Globant RAG (/v1/search) · perfil/asistente {hint} · {loc}',
    llm_hint_asst_long:
      'Modo Assistant: GLOBANT_API_MODE=assistant + GLOBANT_AGENTS_API_KEY + GLOBANT_RAG_PROFILE_NAME (ej. cv-extractor). Chat: /v1/assistant/chat. PDFs adjuntos y extracción usan /v1/files (multipart). Opcional: GLOBANT_FILES_ASSISTANT_NAME para carpeta dedicada de análisis temporal; GLOBANT_RAG_SKIP_UPLOAD=true; GLOBANT_RAG_EXECUTE_MAX_RETRIES.',
    llm_hint_rag_long:
      'Modo RAG: «Preguntar al agente» usa /v1/search/execute. Indexación al guardar contenidos: /v1/search/profile/.../document. Extracción de PDFs y adjuntos del chat usan /v1/files + /v1/assistant/chat (no inline). Clave GLOBANT_AGENTS_API_KEY. Opcional: GLOBANT_FILES_ASSISTANT_NAME, GLOBANT_RAG_PROFILE_NAME, GLOBANT_RAG_DOCUMENT_ID, GLOBANT_RAG_SKIP_UPLOAD.',
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
    err_falta_globant_project_id:
      'Falta GLOBANT_PROJECT_ID en Propiedades del script (header ProjectId obligatorio en Agents API v4).',
    err_globant_agent_upsert_project_hint:
      'Confirmá GLOBANT_PROJECT_ID (mismo proyecto que en Glob.AI OS) y que el header ProjectId se envíe en cada upsert.',
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
    err_globant_api_no_detail: 'Sin detalle en la respuesta del servidor.',
    err_globant_api_auth_hint:
      'Verificá GLOBANT_AGENTS_API_KEY y GLOBANT_PROJECT_ID en Propiedades del script.',
    err_globant_rag_execute_400_hint:
      'Suele indicar perfil RAG mal configurado (p. ej. LLM incompleto tras sincronizar). En Admin → Agentes, abrí el agente Clientes, pulsá Guardar (actualiza el perfil en Globant) y, si tenés PDFs en Drive, Sincronizar documentos. El chat de clientes también puede responder vía roster Supabase si RAG falla.',
    err_globant_rag_execute_profile: 'Perfil: {profile}',
    err_globant_agent_upsert_hint:
      'Sugerencias: revisá que el modelo exista en el catálogo API (p. ej. openai/gpt-5, no un alias inventado), que la estrategia sea válida, que idOrName coincida con el perfil, y que el prompt no supere límites del proveedor.',
    err_globant_agent_upsert_model: 'Modelo enviado: {model}',
    err_globant_agent_upsert_id: 'idOrName enviado: {id}',
    err_globant_agent_upsert_strategy: 'Estrategia enviada: {strategy}',
    error_dialog_title: 'Error',
    error_dialog_close: 'Cerrar',
    error_dialog_detail_heading: 'Detalle técnico',
    err_globant_assistant_empty_file:
      'Archivo vacío para Globant Assistant upload.',
    err_globant_document_upload_no_id:
      'Globant /v1/files no devolvió identificador del archivo subido.',
    err_globant_document_too_large:
      'El archivo "{name}" supera el máximo de {max_mb} MB para análisis en Globant.',
    err_globant_assistant_not_found:
      'Globant no encontró el Chat Assistant «{assistant}». Revisá GLOBANT_FILES_ASSISTANT_NAME o borrá la propiedad para que Aviators recree aviators-document-files.',
    err_globant_files_assistant_required:
      'No se pudo resolver el Chat Assistant para análisis de PDFs (/v1/files + /v1/assistant/chat).',
    err_globant_files_assistant_create:
      'No se pudo crear el Chat Assistant permanente en Globant (POST /v1/assistant).',
    globant_files_assistant_description:
      'Aviators — análisis temporal de PDFs vía /v1/files (contenidos, chat adjunto, propuestas).',
    globant_files_assistant_prompt:
      'Sos un asistente de análisis de documentos. Leé el archivo subido a tu carpeta y respondé con precisión. Si piden JSON, devolvé solo JSON válido sin markdown.',
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
      'Chat con agentes RAG: GLOBANT_RAG_PROFILE_NAME. PDFs adjuntos: assistant aviators-document-files (autocreado; override con GLOBANT_FILES_ASSISTANT_NAME).',
    llm_ui_config_hint_document_chat:
      'PDFs adjuntos: /v1/files + assistant permanente (aviators-document-files). Cada archivo se borra al terminar; el assistant queda.',
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
    meta_provider_globant_hub_agent: 'Globant Agents API (Hub)',
    meta_provider_globant_hub_agent_fallback:
      'Globant Agents API (Hub) · fallback chat',
    meta_filter_hub_agent: 'Agent Hub: {agent}',
    meta_filter_hub_agent_fallback: 'Agent Hub (fallback): {agent}',
    err_globant_hub_agent_empty: 'El Agent Hub respondió sin texto.',
    err_globant_hub_agent_run:
      'No se pudo ejecutar el Agent Hub. Publicá el agente (automaticPublish) o revisá permisos de ejecución externa.',
    meta_filter_assistant_no_rag:
      'modo Assistant (sin filtro documento RAG)',
    meta_filter_rag_doc_id: 'id = {id}',
    meta_filter_rag_full_profile: 'sin filtro (perfil completo)',
    meta_filter_profile: 'perfil = {profile}',
    meta_orchestrator_selected_agent:
      'Enrutado a {agent} · confianza {confidence}',
    meta_filter_client_docs: 'Filtrando por {client} ({count} docs)',
    meta_filter_direct_context: 'Contexto directo: {client} ({count} docs)',
    meta_filter_knowledge_graph: 'Grafo: {count} docs relacionados',
    meta_filter_roster_context: 'Roster BD: {count} cuentas',
    clients_roster_direct_count:
      'En el roster de Aviators (Salesforce / Supabase) hay {total} cuentas que coinciden con tu consulta ({active} activas{inactivePart}).{filterNote}{truncNote}',
    clients_roster_direct_count_inactive_part: ', {inactive} inactivas',
    clients_roster_direct_count_none:
      'No hay cuentas en el roster que coincidan con los filtros inferidos de tu consulta.',
    clients_roster_direct_filter_aviation:
      ' Filtro: aviación (Passenger Airlines / aerolíneas de pasajeros).',
    clients_roster_direct_filter_aerospace:
      ' Filtro: aeropuertos y agencias aeroespaciales.',
    clients_roster_direct_list_intro:
      '**{total}** cuentas en el roster de Aviators:{filterNote}',
    clients_roster_direct_list_owner_intro:
      '**{total}** cuentas con vendedor / client partner / account owner «{owner}» en el roster de Aviators:{filterNote}',
    clients_roster_direct_count_none_owner:
      'No hay cuentas en el roster para el vendedor / client partner / account owner «{owner}».',
    clients_roster_direct_owner:
      '**{account}** — vendedor / client partner / account owner: **{owner}**.',
    clients_roster_direct_owner_none:
      'No hay vendedor / client partner / account owner registrado para **{account}**.',
    clients_roster_direct_list_inactive_tag: '_(inactiva)_',
    clients_roster_direct_filter_industry: ' Filtro: industria «{industry}».',
    clients_roster_direct_filter_sub_industry:
      ' Filtro: subindustria «{subIndustry}».',
    clients_roster_direct_filter_active: ' Solo cuentas activas.',
    clients_roster_direct_filter_inactive: ' Solo cuentas inactivas.',
    clients_roster_direct_filter_owner:
      ' Vendedor / client partner / account owner «{owner}».',
    clients_roster_direct_trunc:
      ' El total refleja todas las coincidencias (el detalle listado está limitado a {cap} filas).',
    clients_roster_oppty_direct: '**{account}** (roster Salesforce):\n{lines}',
    clients_roster_oppty_direct_none:
      '**{account}** está en el roster pero no hay fechas de oportunidades registradas en la última sincronización.',
    clients_roster_oppty_line_last_created: '• Última oportunidad creada: {date}',
    clients_roster_oppty_line_last_won: '• Última oportunidad ganada: {date}',
    clients_roster_oppty_line_first_won: '• Primera oportunidad ganada: {date}',
    clients_roster_oppty_line_last_worked: '• Última oportunidad trabajada: {date}',
    meta_filter_orchestrator_catalog: 'Catálogo de contenidos ({count} filas)',
    meta_provider_globant_chat: 'Globant Chat',
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
      'Gestioná tu cartera de clientes: buscá, filtrá por industria o subindustria y revisá cada cuenta con su logo y contacto.',
    clients_btn_new: 'Nuevo cliente',
    clients_editor_title_view: 'Ver cliente',
    clients_editor_subtitle_view: 'Vista de solo lectura: podés revisar los datos del cliente pero no modificarlos.',
    clients_btn_edit: 'Editar',
    clients_row_open_aria: 'Abrir {name} en vista de detalle',
    clients_editor_readonly_banner: 'Modo solo lectura. No tenés permiso para editar este cliente.',
    clients_tooltip_view_detail: 'Ver detalle',
    clients_tooltip_edit: 'Editar',
    clients_btn_back_list: 'Volver a la lista',
    clients_th_logo: 'Logo',
    clients_th_name: 'Nombre',
    clients_th_industry: 'Industria',
    clients_th_sub_industry: 'Subindustria',
    clients_th_country: 'País',
    clients_th_contact: 'Contacto',
    clients_th_actions: 'Acciones',
    clients_logo_heading: 'Logo del cliente',
    clients_logo_lead:
      'Subí PNG, JPEG, WebP o GIF (máx. 400 KB). Se guarda en la base de datos y se muestra en la lista.',
    clients_btn_pick_logo: 'Elegir imagen',
    clients_btn_remove_logo: 'Quitar logo',
    clients_err_logo_invalid: 'Formato de imagen no válido. Usá PNG, JPEG, WebP o GIF.',
    clients_err_logo_too_large: 'La imagen supera el tamaño máximo (400 KB).',
    clients_lbl_name: 'Nombre del cliente',
    clients_lbl_industry: 'Industria',
    clients_lbl_sub_industry: 'Subindustria',
    clients_filter_search: 'Buscar',
    clients_filter_search_placeholder: 'Nombre, contacto, país…',
    clients_filter_industry: 'Industria',
    clients_filter_industry_all: 'Todas las industrias',
    clients_filter_sub_industry: 'Subindustria',
    clients_filter_sub_industry_all: 'Todas las subindustrias',
    clients_filter_sub_industry_placeholder: 'Filtrar por subindustria…',
    clients_filter_clear: 'Limpiar filtros',
    clients_industry_placeholder: 'Seleccionar industria…',
    clients_industry_tourism_agencies: 'Agencias de Turismo',
    clients_industry_logistics: 'Logistica',
    clients_industry_aerospace_agencies: 'Agencias AeroEspaciales',
    clients_industry_airports: 'Aeropuertos',
    clients_industry_airlines: 'Aerolineas',
    clients_lbl_country: 'País',
    clients_lbl_contact_name: 'Nombre del contacto',
    clients_lbl_contact_email: 'Email del contacto',
    clients_lbl_notes: 'Notas',
    clients_btn_save: 'Guardar cliente',
    clients_btn_delete: 'Eliminar',
    clients_btn_cancel: 'Cancelar',
    clients_busy_loading: 'Cargando clientes…',
    clients_busy_opening: 'Abriendo cliente…',
    clients_busy_saving: 'Guardando cliente…',
    clients_busy_deleting: 'Eliminando cliente…',
    clients_saved: 'Cliente guardado.',
    clients_deleted: 'Cliente eliminado.',
    clients_err_name_required: 'El nombre del cliente es requerido.',
    clients_err_industry_invalid:
      'La industria debe coincidir con un valor ya presente en el catálogo de clientes (o dejarse vacía).',
    clients_err_sub_industry_invalid:
      'La subindustria debe coincidir con un valor ya presente en el catálogo de clientes (o dejarse vacía).',
    err_client_id_invalid:
      'No se pudo eliminar: identificador de cliente inválido. Recargá la lista e intentá de nuevo.',
    clients_confirm_delete: '¿Eliminar este cliente permanentemente?',
    clients_no_items: 'No hay clientes registrados.',
    clients_no_results: 'Ningún cliente coincide con los filtros.',
    clients_load_more: 'Cargar más',
    clients_showing_of: 'Mostrando {shown} de {total}.',
    contents_client_combo_new: '+ Agregar nuevo cliente',
    contents_client_combo_placeholder: 'Seleccionar cliente…',
    contents_load_more: 'Cargar más',
    contents_showing_of: 'Mostrando {shown} de {total}.',
    contents_pagination_page_size: 'Por página',
    page_metrics_title: 'Métricas',
    page_metrics_lead:
      'Seguimiento operativo del uso del chat, no respondidas y desempeño por agente, cliente e industria.',
    metrics_tabs_aria: 'Secciones de métricas',
    metrics_tab_overview: 'Panorama',
    metrics_tab_rankings: 'Rankings',
    metrics_tab_queue: 'Cola',
    metrics_lb_subtab_usage: 'Uso del chat',
    metrics_lb_subtab_success: 'Success cases',
    metrics_lb_subtab_proposals: 'Propuestas',
    page_settings_title: 'Configuración',
    page_settings_lead:
      'Administrá permisos, usuarios y ajustes operativos de la plataforma.',
    settings_tabs_aria: 'Secciones de configuración',
    settings_tab_general: 'General',
    settings_tab_roles: 'Permisos',
    settings_tab_users: 'Usuarios',
    settings_tab_agents: 'Agentes',
    settings_tab_chat: 'Chat',
    settings_tab_salesforce: 'Salesforce',
    settings_tab_data: 'Datos',
    settings_kg_limits_heading: 'Grafo de conocimiento',
    settings_kg_limits_lead:
      'Definí los topes que usa el explorador del grafo: nodos por vista, profundidad BFS y presets de densidad. Los cambios se guardan en Supabase y aplican para todos los usuarios.',
    settings_kg_limits_busy_load: 'Cargando límites del grafo…',
    settings_kg_limits_busy_save: 'Guardando límites del grafo…',
    settings_kg_limits_save_btn: 'Guardar límites',
    settings_kg_limits_saved: 'Límites del grafo guardados.',
    settings_kg_limits_error_load: 'No se pudieron cargar los límites del grafo.',
    settings_kg_limits_error_save: 'No se pudieron guardar los límites del grafo.',
    settings_kg_max_nodes_default: 'Nodos por defecto',
    settings_kg_max_nodes_cap: 'Tope máximo de nodos',
    settings_kg_hub_seed_limit: 'Semillas hub (vista global)',
    settings_kg_depth_default: 'Profundidad por defecto',
    settings_kg_depth_cap: 'Profundidad máxima',
    settings_kg_density_compact: 'Densidad compacta (nodos)',
    settings_kg_density_normal: 'Densidad normal (nodos)',
    settings_kg_density_wide: 'Densidad amplia (nodos)',
    err_kg_limits_invalid: 'Los límites del grafo no son válidos. Revisá los valores e intentá de nuevo.',
    settings_users_subtab_visitors: 'Visitantes',
    settings_users_subtab_requests: 'Solicitudes',
    settings_users_subtab_bulk: 'Acceso masivo',
    settings_users_subtab_members: 'Con rol',
    role_config_sec_heading: 'Roles y permisos',
    role_config_sec_lead:
      'Definí qué puede ver y hacer cada rol. Las capacidades están separadas en solo lectura y escritura: arrastralas a la zona correspondiente de cada columna.',
    role_config_roles_heading: 'Roles disponibles',
    role_config_roles_lead:
      'Cada columna representa un rol con dos zonas: lectura arriba y escritura abajo. Podés crear roles personalizados o eliminar los que no tengan usuarios asignados.',
    role_config_pool_heading: 'Capacidades disponibles',
    role_config_pool_lead:
      'Arrastrá cada chip a la zona de lectura o escritura del rol. Para quitar, arrastrá de vuelta al panel o usá la × en el chip.',
    role_config_pool_read_heading: 'Solo lectura',
    role_config_pool_read_lead:
      'Ver pantallas y datos sin modificar (Agentes, catálogo, métricas).',
    role_config_pool_write_heading: 'Escritura',
    role_config_pool_write_lead:
      'Crear, editar, borrar o administrar (agentes, catálogo, usuarios, reset).',
    role_config_col_read_label: 'Lectura',
    role_config_col_write_label: 'Escritura',
    role_config_add_btn: 'Nuevo rol',
    role_config_save_btn: 'Guardar permisos',
    role_config_delete_btn: 'Eliminar rol',
    role_config_delete_confirm:
      '¿Eliminar el rol «{key}»? Solo se puede si no tiene usuarios asignados.',
    role_config_users_count: '{count} usuario(s)',
    role_config_system_badge: 'Sistema',
    role_config_add_title: 'Nuevo rol',
    role_config_add_key_ph: 'Clave (ej. auditor)',
    role_config_add_label_es_ph: 'Nombre en español',
    role_config_add_label_en_ph: 'Nombre en inglés',
    role_config_add_confirm: 'Crear rol',
    role_config_busy_load: 'Cargando roles…',
    role_config_busy_save: 'Guardando permisos…',
    role_config_busy_add: 'Creando rol…',
    role_config_busy_delete: 'Eliminando rol…',
    role_config_save_done: 'Permisos guardados.',
    role_config_add_done: 'Rol creado.',
    role_config_delete_done: 'Rol eliminado.',
    role_config_err_generic: 'No se pudo completar la operación.',
    role_config_err_invalid: 'Configuración inválida.',
    role_config_err_empty: 'Debe haber al menos un rol.',
    role_config_err_no_admin: 'Debe existir el rol admin.',
    role_config_err_key: 'Clave de rol inválida.',
    role_config_err_dup: 'Ya existe un rol con esa clave.',
    role_config_err_not_found: 'Rol no encontrado.',
    role_config_err_admin_delete: 'No se puede eliminar el rol admin.',
    role_config_err_system: 'No se puede eliminar un rol del sistema.',
    role_config_err_in_use: 'Hay {count} usuario(s) con este rol. Reasignálos antes de eliminar.',
    role_config_drop_hint: 'Soltá aquí',
    role_perm_view_agents: 'Ver Agentes',
    role_perm_view_agents_desc: 'Acceso de lectura a la pantalla Agentes.',
    role_perm_manage_agents: 'Administrar Agentes',
    role_perm_manage_agents_desc: 'Crear, editar, sincronizar y borrar agentes.',
    role_perm_view_catalog: 'Ver Contenidos',
    role_perm_view_catalog_desc:
      'Ver listado y abrir el detalle de cada contenido (campos en solo lectura).',
    role_perm_view_tags: 'Ver Tags',
    role_perm_view_tags_desc:
      'Acceso a la pantalla Tags: nube de etiquetas y contenidos asociados.',
    role_perm_view_clients: 'Ver Clientes',
    role_perm_view_clients_desc:
      'Ver listado y ficha de clientes en solo lectura (cartera / maestro).',
    role_perm_view_knowledge_graph: 'Ver Grafo de Conocimiento',
    role_perm_view_knowledge_graph_desc:
      'Explorar el grafo de relaciones del catálogo (sin reconstruir ni administrar).',
    role_perm_write_catalog: 'Editar Contenidos y Clientes',
    role_perm_write_catalog_desc:
      'Alta, edición y borrado de contenidos y de la cartera de clientes.',
    role_perm_view_metrics: 'Ver Métricas',
    role_perm_view_metrics_desc: 'Acceso a la pantalla de métricas.',
    role_perm_reset_metrics: 'Restablecer datos',
    role_perm_reset_metrics_desc: 'Borrado masivo de datos operativos (zona peligrosa).',
    role_perm_manage_users: 'Gestionar usuarios',
    role_perm_manage_users_desc: 'Asignar roles a visitantes y usuarios.',
    role_perm_view_onboarding: 'Ver Onboarding',
    role_perm_view_onboarding_desc:
      'Acceso a la sección Onboarding y al agente de onboarding (chat y prompts sugeridos).',
    role_perm_view_proposal_building: 'Ver Armado de propuestas',
    role_perm_view_proposal_building_desc:
      'Acceso a la sección de armado de propuestas, validación de brief y chat con el agente de propuestas.',
    role_perm_manage_unanswered_queue: 'Gestionar cola no respondidas',
    role_perm_manage_unanswered_queue_desc:
      'Asignar y cambiar estado de consultas sin respuesta en Métricas.',
    role_perm_sync_salesforce: 'Sincronizar Salesforce',
    role_perm_sync_salesforce_desc:
      'Ejecutar sync del roster Airlines Accounts y ver la pestaña Salesforce en Configuración.',
    err_onboarding_forbidden: 'No tenés permiso para usar el agente de onboarding.',
    err_proposal_building_forbidden: 'No tenés permiso para usar Armado de propuestas.',
    err_catalog_forbidden: 'No tenés permiso para ver Contenidos.',
    err_tags_forbidden: 'No tenés permiso para ver Tags.',
    err_clients_forbidden: 'No tenés permiso para ver Clientes.',
    admin_users_sec_heading: 'Visitantes y usuarios',
    admin_users_sec_lead:
      'Los visitantes son cuentas que entraron sin fila en la tabla de roles. Convertilos asignándoles un rol; quedarán registrados como usuarios con acceso según ese rol.',
    admin_users_visitors_heading: 'Visitantes pendientes',
    admin_users_visitors_lead:
      'Personas que iniciaron sesión sin rol. Elegí un rol y confirmá para darles acceso.',
    admin_users_requests_heading: 'Solicitudes de acceso',
    admin_users_requests_lead:
      'Pedidos enviados por visitantes. Podés asignar el rol solicitado o descartar la solicitud.',
    admin_users_col_requested_role: 'Rol pedido',
    admin_users_col_reason: 'Motivo',
    admin_users_col_requested_at: 'Fecha',
    admin_users_no_requests: 'No hay solicitudes pendientes.',
    admin_users_no_requests_filtered: 'No hay solicitudes con este filtro.',
    admin_users_requests_status_filter_lbl: 'Estado',
    admin_users_requests_status_pending: 'Pendientes',
    admin_users_requests_status_all: 'Todas',
    admin_users_requests_status_approved: 'Aprobadas',
    admin_users_requests_status_dismissed: 'Descartadas',
    admin_users_dismiss_request_btn: 'Descartar',
    admin_users_dismiss_request_confirm: '¿Descartar esta solicitud de acceso?',
    admin_users_dismiss_request_done: 'Solicitud descartada.',
    admin_users_busy_dismiss_request: 'Descartando solicitud…',
    admin_users_bulk_heading: 'Asignar rol a una lista',
    admin_users_bulk_lead:
      'Pegá una lista de contactos (formato de invitación de correo: Nombre <email@dominio.com>, …). Solo se usan las direcciones de correo. Se asigna el mismo rol a todos.',
    admin_users_bulk_role_label: 'Rol a asignar',
    admin_users_bulk_paste_label: 'Lista de personas',
    admin_users_bulk_paste_ph:
      'Ej.: Ana López <ana@empresa.com>, otro@empresa.com, …',
    admin_users_bulk_preview_none: 'No se detectaron correos en el texto.',
    admin_users_bulk_preview_count: '{count} correo(s) detectado(s).',
    admin_users_bulk_assign_btn: 'Asignar acceso',
    admin_users_bulk_busy: 'Asignando acceso ({done}/{total})…',
    admin_users_bulk_busy_parse: 'Analizando lista…',
    admin_users_bulk_confirm:
      '¿Asignar el rol «{role}» a {count} cuenta(s)? Esta acción actualiza la tabla de roles en Supabase.',
    admin_users_bulk_done:
      'Listo: {success} de {total} con rol «{role}».{failedPart}',
    admin_users_bulk_done_failed_part: ' {failed} con error (ver detalle abajo).',
    admin_users_bulk_err_no_emails: 'No se encontró ningún correo en el texto pegado.',
    admin_users_bulk_err_too_many: 'Demasiados correos (máximo {max} por operación).',
    admin_users_bulk_err_role: 'Elegí un rol antes de asignar.',
    admin_users_bulk_err_paste: 'Pegá la lista de personas primero.',
    admin_users_roles_heading: 'Usuarios con rol',
    admin_users_roles_lead:
      'Cuentas con permisos asignados. Podés cambiar el rol o quitarlo (vuelven a visitante).',
    admin_users_col_email: 'Email',
    admin_users_col_name: 'Nombre',
    admin_users_col_last_seen: 'Último acceso',
    admin_users_col_visits: 'Visitas',
    admin_users_col_role: 'Rol',
    admin_users_col_updated: 'Actualizado',
    admin_users_col_actions: 'Acciones',
    admin_users_search_ph: 'Buscar por email o nombre…',
    admin_users_assign_btn: 'Asignar rol',
    admin_users_update_btn: 'Guardar rol',
    admin_users_remove_btn: 'Quitar rol',
    admin_users_remove_confirm:
      '¿Quitar el rol de {email}? Volverá a visitante hasta que le asignes uno nuevo.',
    admin_users_no_visitors: 'No hay visitantes pendientes.',
    admin_users_no_roles: 'No hay usuarios con rol.',
    admin_users_busy_loading: 'Cargando usuarios…',
    admin_users_busy_assign: 'Asignando rol…',
    admin_users_busy_update: 'Actualizando rol…',
    admin_users_busy_remove: 'Quitando rol…',
    admin_users_assign_done: 'Rol asignado.',
    admin_users_update_done: 'Rol actualizado.',
    admin_users_remove_done: 'Rol quitado.',
    admin_users_err_email: 'Email inválido.',
    admin_users_err_role: 'Rol no permitido.',
    admin_users_err_generic: 'No se pudo completar la operación.',
    admin_users_select_role: 'Elegir rol…',
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
    admin_reset_all_heading: 'Restablecer todo',
    admin_reset_all_lead:
      'Borra todas las filas de las tablas operativas en la BD (catálogo de contenidos, métricas, clientes y catálogo API de agentes). Los roles y secretos del script no se modifican. Esta acción no se puede deshacer.',
    admin_reset_all_btn: 'Restablecer todo',
    admin_reset_all_confirm:
      'Vas a borrar TODOS los datos operativos en la BD (contenidos, métricas, clientes, catálogo API). Los roles no se tocan. ¿Confirmás?',
    admin_reset_all_busy: 'Restableciendo datos…',
    admin_reset_all_done: 'Datos operativos restablecidos.',
    admin_reset_all_error: 'No se pudo restablecer todo.',
    admin_embeddings_sec_heading: 'Embeddings semánticos',
    admin_embeddings_sec_lead:
      'Regenera solo los vectores del catálogo (pgvector). Para el grafo completo — embeddings, semántica y entidades — usá «Sincronizar desde Supabase» en Grafo de conocimiento.',
    admin_embeddings_rebuild_btn: 'Regenerar embeddings',
    admin_embeddings_busy: 'Regenerando embeddings… {done}/{total}',
    admin_embeddings_done: 'Embeddings actualizados: {done} filas ({failed} fallidas).',
    admin_embeddings_error: 'No se pudieron regenerar los embeddings.',
    admin_sf_sync_sec_heading: 'Roster Salesforce (Airlines Accounts)',
    admin_sf_sync_sec_lead:
      'Importa o actualiza desde la planilla configurada (Sheet1): maestro de clientes y catálogo para el agente Clientes. El sync automático corre una vez al día; usá «Sincronizar ahora» para forzar una corrida.',
    admin_sf_sync_schedule_lbl: 'Programación automática:',
    admin_sf_sync_schedule_value:
      'Cada día a las {hour}:00 (zona horaria del proyecto Apps Script).',
    admin_sf_sync_trigger_lbl: 'Trigger instalado:',
    admin_sf_sync_trigger_on: 'Sí — sync diario activo',
    admin_sf_sync_trigger_off: 'No activo',
    admin_sf_sync_last_lbl: 'Última sincronización:',
    admin_sf_sync_last_none: 'Nunca registrada',
    admin_sf_sync_last_line:
      '{at} — {status} ({accounts} cuentas, {inactivated} inactivadas)',
    admin_sf_sync_emb_pending_suffix: '· {pending} embeddings pendientes',
    admin_sf_sync_emb_continuation_scheduled: '(indexación automática en curso)',
    admin_sf_sync_sheet_missing: 'Falta SALESFORCE_ACCOUNTS_SPREADSHEET_ID en propiedades del script.',
    admin_sf_sync_activate_auto_btn: 'Activar sync automático',
    admin_sf_sync_activate_auto_busy: 'Activando sync automático…',
    admin_sf_sync_activate_auto_done:
      'Sync automático activado (cada día a las {hour}:00, zona del proyecto Apps Script).',
    admin_sf_sync_activate_auto_error: 'No se pudo activar el sync automático.',
    admin_sf_sync_btn: 'Sincronizar ahora',
    admin_sf_sync_busy: 'Sincronizando roster Salesforce…',
    admin_sf_sync_busy_reading: 'Leyendo planilla y guardando cuentas…',
    admin_sf_sync_busy_embeddings: 'Indexando búsqueda semántica… ({done}/{total})',
    admin_sf_sync_done:
      'Sync completado: {accounts} cuentas, {inactivated} inactivadas, {embeddings} indexados para búsqueda.',
    admin_sf_sync_done_with_failures:
      'Sync completado: {accounts} cuentas, {inactivated} inactivadas, {embeddings} indexados ({failed} con error).',
    admin_sf_sync_skipped: 'Sin cambios detectados en la planilla (no se actualizó nada).',
    admin_sf_sync_error: 'No se pudo sincronizar el roster Salesforce.',
    admin_clients_dedupe_btn: 'Fusionar clientes duplicados',
    admin_clients_dedupe_busy: 'Fusionando clientes con el mismo nombre (acentos)…',
    admin_clients_dedupe_done:
      'Fusionados {groups} grupo(s): {removed} registro(s) eliminado(s), {contents} contenido(s) actualizado(s).',
    admin_clients_dedupe_none: 'No hay duplicados por variación de acentos en el maestro de clientes.',
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
    metrics_unanswered_heading: 'Cola de no respondidas',
    metrics_unanswered_lead:
      'Pendientes operativas: asigná responsable, marcá contenido faltante o cerrá cuando esté resuelta. Al resolver desaparecen de esta cola.',
    metrics_queue_filter_label: 'Estado',
    metrics_queue_filter_all: 'Todas pendientes',
    metrics_queue_filter_open: 'Abiertas',
    metrics_queue_filter_missing: 'Contenido faltante',
    metrics_th_queue_status: 'Estado',
    metrics_th_assigned: 'Asignado',
    metrics_th_actions: 'Acciones',
    metrics_queue_status_open: 'Abierta',
    metrics_queue_status_missing: 'Falta contenido',
    metrics_queue_unassigned: 'Sin asignar',
    metrics_queue_assign_ph: 'Responsable…',
    metrics_queue_btn_assign: 'Asignar',
    metrics_queue_btn_missing: 'Falta contenido',
    metrics_queue_btn_resolve: 'Resuelta',
    metrics_queue_btn_upload: 'Subir PDF',
    metrics_queue_busy_assign: 'Asignando…',
    metrics_queue_busy_status: 'Actualizando cola…',
    metrics_queue_done_assign: 'Consulta asignada.',
    metrics_queue_done_missing: 'Marcada como contenido faltante.',
    metrics_queue_done_resolve: 'Consulta resuelta y quitada de la cola.',
    metrics_queue_confirm_resolve: '¿Marcar como resuelta? Se quitará de la cola operativa.',
    metrics_queue_upload_denied: 'Necesitás permiso de edición en Contenidos para subir un PDF.',
    err_metrics_queue_only: 'Solo admin o presales pueden gestionar la cola de no respondidas.',
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
    chat_feedback_up: 'Útil',
    chat_feedback_down: 'No fue útil',
    chat_feedback_done: 'Gracias por tu feedback',
    chat_feedback_error: 'No se pudo guardar el feedback',
    chat_action_copy: 'Copiar respuesta',
    chat_action_regenerate: 'Regenerar respuesta',
    chat_action_reformulate: 'Reformular pregunta',
    chat_copy_done: 'Respuesta copiada al portapapeles',
    chat_copy_error: 'No se pudo copiar al portapapeles',
    chat_regenerate_busy: 'Regenerando respuesta…',
    chat_regenerate_no_attachment: 'No hay adjunto para repetir el análisis del documento.',
    chat_export_btn: 'Exportar',
    chat_export_markdown: 'Descargar Markdown',
    chat_export_pdf: 'Exportar conversación (PDF)',
    chat_export_pdf_turn: 'Exportar respuesta (PDF)',
    chat_export_busy: 'Generando PDF…',
    chat_export_empty: 'No hay mensajes para exportar',
    chat_export_done: 'PDF descargado',
    chat_export_error: 'No se pudo generar el PDF',
    chat_export_title: 'Consulta Aviators',
    chat_export_turn_title: 'Respuesta Aviators',
    chat_export_doc_subtitle: 'Generado el {date}',
    chat_export_footer: 'Documento generado con Aviators',
    chat_action_export_pdf: 'Exportar PDF',
    err_chat_export_empty: 'No hay mensajes para exportar a PDF.',
    err_chat_export_pdf: 'No se pudo generar el archivo PDF. Intentá de nuevo.',
    err_pdf_not_available: 'No hay un PDF disponible para este contenido.',
    err_pdf_drive: 'No se pudo leer el archivo desde Drive.',
    err_pdf_globant_onboarding:
      'No hay enlace disponible para este documento de onboarding en Globant.',
    chat_history_untitled: 'Sin título',
    chat_history_heading: 'Conversaciones anteriores',
    chat_history_open_btn: 'Historial',
    chat_history_empty: 'Sin conversaciones guardadas',
    chat_history_loading: 'Cargando historial…',
    chat_history_delete: 'Eliminar conversación',
    chat_history_save_error: 'No se pudo guardar la conversación',
    chat_history_load_error: 'No se pudo cargar la conversación',
    chat_quick_prompts_label: 'Preguntas frecuentes',
    chat_quick_prompts_onboarding_label: 'Temas de onboarding',
    chat_quick_prompts_globant_offering_label: 'Temas de Globant Offering',
    admin_quick_prompts_sec_heading: 'Prompts rápidos (Inicio)',
    admin_quick_prompts_sec_lead:
      'Preguntas sugeridas en el chat de Inicio (orquestador). Cada prompt tiene texto en español e inglés.',
    admin_globant_offering_quick_prompts_sec_heading: 'Prompts rápidos (Globant Offering)',
    admin_globant_offering_quick_prompts_sec_lead:
      'Sugerencias del chat Globant Offering. Se muestran al iniciar una conversación nueva con el agente de propuestas.',
    admin_globant_offering_quick_prompts_save_btn: 'Guardar prompts de Globant Offering',
    admin_onboarding_quick_prompts_sec_heading: 'Prompts rápidos (Onboarding)',
    admin_onboarding_quick_prompts_sec_lead:
      'Preguntas sugeridas en la sección Onboarding. Siempre las responde el agente de onboarding con su corpus indexado.',
    admin_onboarding_quick_prompts_save_btn: 'Guardar prompts de onboarding',
    admin_quick_prompts_save_btn: 'Guardar prompts',
    admin_quick_prompts_add_btn: 'Agregar prompt',
    admin_quick_prompts_save_busy: 'Guardando prompts…',
    admin_quick_prompts_save_done: 'Prompts guardados.',
    admin_quick_prompts_save_error: 'No se pudieron guardar los prompts.',
    admin_quick_prompts_lbl_es: 'Español',
    admin_quick_prompts_lbl_en: 'Inglés',
    admin_quick_prompts_ph_es: 'Pregunta en español…',
    admin_quick_prompts_ph_en: 'Question in English…',
    admin_quick_prompts_delete_btn: 'Eliminar',
    err_quick_prompts_parse: 'Los prompts no tienen un formato válido.',
  },
  en: {
    app_title: 'Aviators',
    app_startup_loading: 'Starting the app…',
    app_startup_i18n: 'Loading labels…',
    app_startup_i18n_sub_meta: 'Control tower: clearing the linguistic flight plan…',
    app_startup_i18n_sub1: 'Cargo bay 1: menus and navigation aboard…',
    app_startup_i18n_sub2: 'Cargo bay 2: forms and empty states…',
    app_startup_i18n_sub3: 'Cargo bay 3: errors and technical hints…',
    app_startup_session: 'Loading roles and agents…',
    app_startup_session_sub: 'Syncing permissions and agent configuration…',
    app_startup_failed: 'Could not load labels. Please reload the page.',
    nav_home: 'General chat',
    nav_chat: 'Chat',
    nav_section_consult: 'Consult',
    nav_section_knowledge: 'Knowledge',
    nav_section_admin: 'Administration',
    nav_group_chat_modes: 'Chat modes',
    nav_explore: 'Explore',
    chat_mode_general: 'General',
    chat_mode_onboarding: 'Onboarding',
    chat_mode_globant_offering: 'Globant Offering',
    chat_mode_proposals: 'Proposals',
    chat_mode_tabs_aria: 'Consultation mode',
    theme_toggle_aria: 'Switch light or dark theme',
    nav_onboarding: 'Onboarding',
    nav_globant_offering: 'Globant Offering',
    nav_proposal_building: 'Proposal building',
    nav_agents: 'Agents',
    nav_contents: 'Content',
    nav_tags: 'Tags',
    nav_clients: 'Clients',
    nav_metrics: 'Metrics',
    nav_knowledge_graph: 'Knowledge Graph',
    nav_settings: 'Settings',
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
      '<p>Its only job is to <strong>classify your question</strong> and decide which agent(s) should answer. It is not a subject-matter “memory expert”—it routes traffic.</p><p>If one question could be answered from more than one corpus, it may call <strong>multiple agents in parallel</strong> (for example, “what did we do for client X?” may combine success stories and proposals).</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>Success cases</strong>: delivery stories, outcomes and references by industry or technology.</li><li><strong>Proposals</strong>: commercial proposals and <strong>Globant</strong> knowledge (Studios, offerings such as AI Pods, engagement models) plus scope, deliverables, schedule, pricing and RFPs.</li><li><strong>Clients</strong>: account roster, active or maintenance projects and relationship status.</li><li><strong>Onboarding</strong>: aviation/airline domain and Aviation Studio internal onboarding for newcomers.</li><li><strong>General chat</strong>: greetings, Aviators platform usage and institutional orchestrator corpus.</li></ul>',
    faq_agent_success_cases_title: 'Success cases',
    faq_agent_success_cases_detail_html:
      '<p>Answers <strong>only</strong> from the studio’s indexed success-case repository; it does not treat the open web as vetted knowledge.</p><p>The goal is concrete, comparable cases: context, problem, implemented solution, outcomes and learnings, in an executive, actionable tone, with <strong>developed replies</strong> (not one-line summaries). When useful, it uses blocks like Case, Context, Solution, Impact and Risks. If several cases fit, it summarizes each with key points and offers to go deeper on one.</p><p>If the index has no relevant material, the reply makes clear there is <strong>no aligned content</strong> rather than inventing clients, metrics or project names.</p>',
    faq_agent_proposals_title: 'Commercial proposals',
    faq_agent_proposals_detail_html:
      '<p>Grounds in the indexed <strong>commercial proposal</strong> corpus and <strong>Globant</strong> material: Studios (expertise areas), offerings (AI Pods, commercial models, engagement types) and sales positioning when indexed.</p><p>It frames answers around presales and delivery: scope, assumptions, deliverables, phases, risks and next steps—with <strong>detail faithful</strong> to retrieved documents. It must not invent prices, studio capabilities or offering details without index support.</p><p>With no matching material, it reports <strong>no relevant hits</strong> instead of fabricating offers or Globant definitions.</p>',
    faq_agent_clients_title: 'Clients and projects',
    faq_agent_clients_detail_html:
      '<p>Answers about the <strong>client portfolio</strong> using the Salesforce roster and master in <strong>Supabase</strong> (roster, industry, active accounts, owner, status), Aviators <strong>catalog</strong> vector search, and indexed client PDFs in RAG when available.</p><p>For lists or filters (e.g. aviation, active accounts) it prioritizes live roster data; for a specific account it combines roster, catalog, and indexed documents. It does not mix clients without evidence in that turn’s context; ambiguous names should be clarified before stating facts.</p><p>When helpful, it organizes by: Account, Owner, Portfolio, Status, Opportunities, Industry. It must not invent contracts, revenue, scope or dates. If roster, catalog and RAG have nothing for the request, it signals <strong>missing information</strong> instead of guessing commercial details.</p>',
    faq_agent_onboarding_title: 'Onboarding',
    faq_agent_onboarding_detail_html:
      '<p>Sources from the <strong>indexed onboarding repository</strong> which includes aviation concepts, airline business models, domain terminology (PSS, DCS, NDC, GDS, loyalty, ancillary, etc.) and Aviation Studio methodology.</p><p>Goal: help new joiners and the team understand the aviation industry and how the studio operates. Explains concepts clearly and didactically, using examples from indexed material when available.</p><p>If the concept or topic is not in the index, it indicates <strong>no indexed information</strong> rather than inventing definitions or processes.</p>',
    faq_agents_admin_note:
      'Administrators can edit prompts, Globant profiles and Drive folders under Agents; this page reflects the default behavior shipped with the system.',
    faq_q_what: 'What is Aviators?',
    faq_a_what:
      'A Google Apps Script web app for teams that want AI conversations anchored in their own documents: knowledge lives in Drive and in Content workflows that index PDFs into RAG agents. Depending on your role you also manage the agent registry, the Clients portfolio and Home chat, with orchestration to specialists when the deployment enables it.',
    faq_q_flow: 'What should I do right after signing in?',
    faq_a_flow:
      'Use the sidebar for Home (dashboard and chat), or Agents, Content and Clients if they appear.',
    faq_q_chat: 'How does Home chat work?',
    faq_a_chat:
      'Type in the message area and send. The technical consultation mode (Globant RAG, Assistant or Gemini depending on setup) is shown in the banner above the chat. When several indexed profiles are enabled, an orchestrator may route the question to one or more agents—success cases, proposals or clients—based on the topic. You can keep multiple turns in one thread.',
    faq_q_drive_ctx: 'What about Drive or context files?',
    faq_a_drive_ctx:
      'In Home chat, the context file list comes from the Google account that runs the app (who deployed Aviators), so visitors are asked for fewer permissions. You can select up to the allowed limit and formats the integration accepts.',
    faq_q_contents: 'What do I do under Content?',
    faq_a_contents:
      'Create or edit knowledge items: pick a type (proposal, success case, client), upload a PDF, run AI metadata extraction, review fields, then save to index into the right agent.',
    faq_q_agents_clients: 'What are Agents and Clients?',
    faq_a_agents_clients:
      'Under Agents, project admins register each specialist (Globant profile, prompts, Drive folders and files feeding the index) and run sync jobs. Clients is the operational account view (industry, contacts, notes) aligned with the business. For what each chat agent answers, see the “Chat agents” section above.',
    faq_q_visibility: "Why don't I see Agents, Content or Clients?",
    faq_a_visibility:
      'Those areas depend on <code>role_key</code> in the <code>roles</code> table in the database. If you only see visitor, your email has no row there.',
    faq_q_roles: 'What roles exist and what can each one do?',
    faq_a_roles_html:
      '<p>Permissions come from the <strong>roles</strong> table in the database (<code>email</code>, <code>role_key</code>, <code>role_label</code>). Menus and actions use <code>role_key</code>:</p><ul class="mt-2 list-disc space-y-1 pl-5"><li><strong>visitante</strong> (no row): basic access (Home/FAQ), constrained chat.</li><li><strong>admin</strong>: full write access (Agents, Content, Clients and Metrics).</li><li><strong>presales</strong>: write in Content/Clients, read Metrics.</li><li><strong>manager</strong>: Metrics read and general navigation.</li><li><strong>tech</strong> / <strong>client_partner</strong>: read-only across Agents, Content, Clients and Metrics.</li></ul><p class="mt-2">For a role change, contact whoever administers the <code>roles</code> table in the database.</p>',
    faq_q_misc: 'Where do I change language or dark mode?',
    faq_a_misc:
      'Locale and light/dark mode are at the bottom of the sidebar.',
    page_contents_title: 'Agent content',
    page_contents_lead:
      'Upload content, extract metadata, review and save it to auto-index into the matching agent.',
    page_tags_title: 'Catalog tags',
    page_tags_lead:
      'Browse tags extracted from documents. Click a tag to see related content; with edit permission you can merge duplicate tags.',
    page_knowledge_graph_title: 'Knowledge Graph',
    page_knowledge_graph_lead:
      'The graph is stored in Supabase and updates when you save catalog content. Use the Graph tab to explore the map and Entities to browse the inventory and learn what each node and relation type means.',
    kg_guide_heading: 'How to explore (4 steps)',
    kg_guide_lead:
      'No technical background needed: the drawing shows a slice of the relationship map stored in Supabase. These steps cover most searches.',
    kg_guide_step_1: 'Pick a client, industry, or name and click «Apply filters».',
    kg_guide_step_2:
      'Click a dot on the drawing or an item in the «Visible nodes» list on the right. Double-click focuses the entity and shows its relationships up to maximum depth.',
    kg_guide_step_3: 'Use the search box above the drawing and press Enter to jump between matches.',
    kg_guide_step_4: 'If it feels crowded, lower depth or filter by a single client.',
    kg_filters_heading: 'Narrow the view',
    kg_filters_toggle: 'Filters & scope',
    kg_side_toggle: 'Node panel',
    kg_side_close: 'Close panel',
    kg_side_tab_detail: 'Detail',
    kg_side_tab_nodes: 'Nodes',
    kg_legend_toggle: 'Legend',
    kg_filters_lead:
      'Choose where to start. Broader filters try to show more dots (up to a performance cap in the browser).',
    kg_filter_content_type: 'Content type',
    kg_filter_content_type_all: 'All',
    kg_filter_industry: 'Industry',
    kg_filter_industry_all: 'All',
    kg_filter_client: 'Client',
    kg_filter_client_all: 'All',
    kg_filter_search: 'Search node',
    kg_filter_search_placeholder: 'Name, tag, client…',
    kg_filter_depth: 'How many connection hops',
    kg_depth_hint:
      'Each hop adds neighbors from your focus (documents → client → tags, etc.). More hops = more dots and slower rendering.',
    kg_depth_opt_1: '1 — direct neighbors only',
    kg_depth_opt_2: '2 — recommended',
    kg_depth_opt_3: '3 — wider network',
    kg_depth_opt_4: '4 — maximum allowed',
    kg_filter_density: 'Graph detail',
    kg_density_opt_compact: 'Compact (80 nodes)',
    kg_density_opt_normal: 'Normal (150 nodes)',
    kg_density_opt_wide: 'Wide (250 nodes)',
    kg_density_opt_compact_fmt: 'Compact ({count} nodes)',
    kg_density_opt_normal_fmt: 'Normal ({count} nodes)',
    kg_density_opt_wide_fmt: 'Wide ({count} nodes)',
    kg_depth_opt_n_fmt: '{n} hops',
    kg_depth_meter_label: 'Selected depth level',
    kg_depth_meter_aria: 'Graph depth indicator',
    kg_depth_meter_live: 'Configured depth: {depth} of {max} hops',
    kg_scope_summary:
      'Depth {depth}/{maxDepth} · {shown}/{maxNodes} nodes',
    kg_scope_truncated:
      'More saved relationships did not fit in this view. Lower depth, filter by client, or use «Focus selection».',
    kg_filter_node_types: 'Visible node types',
    kg_btn_apply: 'Apply filters',
    kg_btn_reset: 'Reset',
    kg_btn_focus: 'Focus selection',
    kg_btn_rebuild: 'Sync from Supabase',
    kg_btn_rebuild_scratch: 'Rebuild from scratch',
    kg_sync_admin_lead:
      'Sync updates the graph without wiping it. Rebuild from scratch clears all nodes and edges in Supabase, then regenerates everything (embeddings, semantic, entities) in the background.',
    kg_rebuild_scratch_confirm_title: 'Rebuild graph from scratch',
    kg_rebuild_scratch_confirm:
      'All graph nodes and relationships in Supabase will be deleted. The content catalog is not affected. A full background rebuild will then be queued. This cannot be undone.',
    kg_rebuild_scratch_confirm_phrase: 'REBUILD',
    kg_rebuild_scratch_busy: 'Clearing graph and queueing rebuild…',
    kg_rebuild_scratch_done:
      'Graph cleared. Background rebuild started ({phase} stage). Track progress in the banner.',
    kg_rebuild_scratch_queued:
      'Graph cleared. Full rebuild starts in ~{minutes} min (background trigger). Track progress in the banner.',
    kg_rebuild_scratch_error: 'Could not rebuild the graph from scratch.',
    kg_btn_open_content: 'View in catalog',
    kg_busy_loading: 'Loading graph…',
    kg_busy_loading_filters_fmt: 'Requesting view · {filters}',
    kg_busy_loading_stats_fmt:
      'Read {loadedNodes} nodes and {loadedEdges} edges from Supabase · view: {selectedNodes} nodes, {selectedEdges} edges · depth {depth} · seeds {seeds}',
    kg_busy_step_server: 'On server: resolving seeds and filters…',
    kg_busy_step_nodes_db: 'On server: loading graph nodes from Supabase…',
    kg_busy_step_edges_db: 'On server: loading graph edges from Supabase…',
    kg_busy_step_bfs: 'On server: expanding neighbors (BFS) up to your cap…',
    kg_loading_filter_all: 'no filters (global view)',
    kg_loading_filter_client: 'client: {name}',
    kg_loading_filter_industry: 'industry: {name}',
    kg_loading_filter_type: 'type: {name}',
    kg_loading_filter_search: 'search: “{q}”',
    kg_loading_filter_depth: 'depth {depth}/{max}',
    kg_loading_filter_nodes: 'up to {max} nodes',
    kg_loading_filter_focus: 'focused on selection',
    kg_loader_step_fmt: 'Step {step} of {total}',
    kg_loader_status_loading: 'Loading graph view · {filters}',
    kg_loader_step1_title: 'Preparing the query',
    kg_loader_step1_why:
      'The server applies your filters and picks seed nodes. This does not modify data.',
    kg_loader_step1_eta: 'Next: read nodes stored in Supabase.',
    kg_loader_step2_title: 'Reading nodes',
    kg_loader_step2_why:
      'Fetches the graph node inventory (content, clients, tags, etc.) already stored in Supabase.',
    kg_loader_step2_eta: 'Next: read relationships between nodes.',
    kg_loader_step3_title: 'Reading edges',
    kg_loader_step3_why:
      'Loads saved relationships (belongs to, tag, industry, etc.) to traverse the graph.',
    kg_loader_step3_eta: 'Next: build the visible subset with BFS.',
    kg_loader_step4_title: 'Building the view',
    kg_loader_step4_why:
      'Expands neighbors in memory by depth and node cap. Read-only—not a sync job.',
    kg_loader_step4_eta: 'When done you will see counts, then the map drawing.',
    kg_loader_step5_title: 'View ready on server',
    kg_loader_step5_why: 'Data received. The browser will now draw the map with vis-network.',
    kg_loader_step5_eta: 'Almost there: layout and camera fit.',
    kg_loader_render_title: 'Drawing in the browser',
    kg_loader_render_why:
      'Computes positions and draws nodes and edges. Large graphs may take a few seconds.',
    kg_loader_render_eta: 'Finishes when layout stabilizes or within a few seconds.',
    kg_loader_done_title: 'Done',
    kg_loader_done_msg: 'The map is drawn.',
    kg_loader_done_why: 'You can explore, filter, and click nodes.',
    kg_loader_done_eta: 'This message will dismiss automatically.',
    kg_loader_done_status: 'Graph ready to explore.',
    kg_busy_render: 'Drawing the map…',
    kg_busy_rebuild: 'Rebuilding graph… {done}/{total}',
    kg_busy_rebuild_phase: '{phase}: {done} ok · {failed} failed',
    kg_busy_rebuild_verbose:
      'Sync {phaseNum}/{phaseTotal}: {phase} · this batch: {batchDone} ok · total: {totalDone} · failed: {failed}. {hint}',
    kg_rebuild_hint_more_phases: 'More steps follow; the view loads automatically when finished.',
    kg_rebuild_hint_finishing: 'Final steps; the graph will open when complete.',
    kg_rebuild_status_start:
      'Syncing catalog → graph in Supabase. This is not the view load; it may take several minutes.',
    kg_pending_sync_msg:
      'A graph sync did not finish (step {phaseNum}/{phaseTotal}: {phase}, {done} processed, {failed} failed). Resume it or discard progress and view the current graph.',
    kg_pending_sync_bg_msg:
      'Background sync running (step {phaseNum}/{phaseTotal}: {phase}, {done} processed, {failed} failed). Trigger scheduled: {trigger}. You can keep exploring; no need to wait.',
    kg_pending_sync_scratch_queued:
      'Graph cleared; full rebuild queues in ~{minutes} min. The first batch runs when the trigger fires.',
    kg_pending_sync_batch_detail:
      'Last batch ({phase}): +{done} ok, {failed} failed · offset {skip} · stage total: {total}.',
    kg_pending_sync_last_error:
      'Error in step {phase}: {detail}',
    kg_bg_sync_trigger_yes: 'yes, continues automatically',
    kg_bg_sync_trigger_client: 'yes, the browser resumes automatically',
    kg_bg_sync_trigger_no: 'no (resume manually)',
    kg_bg_sync_auto_resuming: 'Resuming background sync…',
    kg_bg_sync_starting: 'Scheduling background sync…',
    kg_bg_sync_enqueued:
      'Background sync active ({phase}, {processed} in the first batch). The on-screen graph is read-only; Supabase updates in the background.',
    kg_bg_sync_aligned: 'The graph is already aligned with Supabase; no sync needed.',
    kg_bg_sync_error: 'Could not schedule background sync.',
    kg_pending_sync_resume_btn: 'Resume sync',
    kg_pending_sync_discard_btn: 'Discard and view graph',
    kg_pending_sync_discard_busy: 'Discarding sync progress…',
    kg_pending_sync_discard_error: 'Could not discard sync progress.',
    kg_busy_rebuild_next_phase: 'Next step: {phase}…',
    kg_phase_contents: 'Contents',
    kg_phase_clients: 'Clients',
    kg_phase_salesforce: 'Salesforce',
    kg_phase_embeddings: 'Catalog embeddings',
    kg_phase_semantic: 'Semantic links (embeddings)',
    kg_phase_entities: 'Business entities (AI)',
    kg_phase_stale: 'Removing stale nodes',
    kg_phase_prune: 'Pruning references',
    kg_empty: 'No nodes match these filters, or the graph was never built. Try other filters or run «Sync from Supabase» once.',
    kg_truncated:
      'Showing {shown} of up to {max} items. More exists in Supabase—lower depth or filter by client.',
    kg_error_load: 'Could not load the graph.',
    kg_rebuild_done: 'Graph synced: {done} contents, {failed} failures.',
    kg_sync_auto_start:
      'Graph out of sync with Supabase ({graph} of {catalog} contents). Syncing…',
    kg_status_cached: 'View restored from session cache.',
    kg_status_ready: 'Graph loaded from Supabase ({graph} content nodes indexed). You can explore without syncing again.',
    kg_status_behind:
      'Graph loaded ({graph}/{catalog} contents). {missing} missing from the index; saving content updates it, or use «Sync from Supabase».',
    kg_status_missing_embeddings:
      'Embeddings: {withEmb}/{catalog} contents ready. {missing} still need vectors for semantic links; run «Sync from Supabase» (embeddings stage).',
    kg_status_stale:
      '{stale} obsolete nodes in Supabase. Use «Sync from Supabase» to clean up (not required on every visit).',
    kg_status_empty:
      'The graph has no content nodes yet. Run «Sync from Supabase» once; later updates happen when you edit the catalog.',
    kg_sync_resume: 'Resuming graph sync (saved progress)…',
    kg_rebuild_timeout_hint:
      'If execution timed out, run sync again: completed work is already in Supabase and resumes by stage.',
    kg_stale_removed: 'Removed {n} nodes for deleted contents.',
    kg_detail_heading: 'Node detail',
    kg_detail_type: 'Type',
    kg_detail_meta: 'Metadata',
    kg_detail_edges_out: 'Outgoing relations',
    kg_detail_edges_in: 'Incoming relations',
    kg_detail_relation: 'Relation',
    kg_edge_to: '→ {label}',
    kg_edge_from: '← {label}',
    kg_busy_vis: 'Loading graph renderer…',
    kg_error_vis_lib: 'Could not load the graph renderer. Reload the page.',
    err_kg_forbidden: 'You do not have permission to view the knowledge graph.',
    kg_legend_heading: 'Legend',
    kg_legend_lead:
      'Shape and color by node type; line weight and color show the relation. Hover to highlight neighbors.',
    kg_legend_edges_heading: 'Relations',
    kg_simple_legend_heading: 'What you see in the drawing',
    kg_simple_legend_lead: 'Colors and shapes in plain language. Hover a dot to highlight its neighbors.',
    kg_simple_types_heading: 'Each shape is…',
    kg_simple_links_heading: 'Each line means…',
    kg_simple_type_content: 'A catalog document (proposal, case study, etc.)',
    kg_simple_type_client: 'A master client record',
    kg_simple_type_client_label: 'A client name without a master record',
    kg_simple_type_industry: 'An industry or sector',
    kg_simple_type_tag: 'A shared tag',
    kg_simple_type_stage: 'A proposal stage',
    kg_simple_type_pricing_model: 'A proposal pricing model',
    kg_simple_rel_belongs_to: 'This document is linked to that client',
    kg_simple_rel_tagged_with: 'Shares this tag',
    kg_simple_rel_in_industry: 'Belongs to this industry',
    kg_simple_rel_related_content: 'Related proposal and success case (same client)',
    kg_simple_rel_has_stage: 'The proposal is at this stage',
    kg_simple_rel_has_pricing_model: 'The proposal uses this pricing model',
    kg_simple_rel_similar_to: 'Semantically similar documents (embedding)',
    kg_simple_rel_delivers: 'The document offers or describes this service',
    kg_simple_rel_uses_technology: 'The document uses or mentions this technology',
    kg_simple_rel_achieved: 'The document reports this outcome',
    kg_simple_rel_addresses_theme: 'The document addresses this business theme',
    kg_simple_type_offering: 'An offering, studio, or service line',
    kg_simple_type_technology: 'A technology, platform, or stack',
    kg_simple_type_outcome: 'A business outcome or KPI',
    kg_simple_type_theme: 'A cross-cutting theme or problem',
    kg_filter_min_weight: 'Minimum link strength',
    kg_min_weight_all: 'All links',
    kg_min_weight_65: 'Medium (≥ 65%)',
    kg_min_weight_78: 'Strong (≥ 78%)',
    kg_min_weight_85: 'Very strong (≥ 85%)',
    kg_edge_weight_fmt: '{pct}%',
    kg_edge_source_structural: 'Structural',
    kg_edge_source_embedding: 'Semantic',
    kg_edge_source_llm: 'AI-extracted',
    kg_graph_toolbar_heading: 'Graph view',
    kg_graph_stats: '{nodes} nodes · {edges} edges',
    kg_layout_label: 'Layout',
    kg_layout_auto: 'Auto',
    kg_layout_hierarchical: 'Hierarchical',
    kg_layout_force: 'Force',
    kg_show_labels: 'Labels',
    kg_btn_fit: 'Fit',
    kg_btn_fit_aria: 'Fit graph to visible area',
    kg_btn_zoom_in_aria: 'Zoom in',
    kg_btn_zoom_out_aria: 'Zoom out',
    kg_graph_find_label: 'Find in visible graph',
    kg_graph_find_placeholder: 'Node name or id…',
    kg_graph_find_prev_aria: 'Previous match',
    kg_graph_find_next_aria: 'Next match',
    kg_graph_find_no_match: 'No matches',
    kg_graph_find_match: '{current} of {total}',
    kg_graph_find_total: '{total} matches',
    kg_nodes_heading: 'Visible nodes',
    kg_nodes_lead: 'List of the loaded subgraph. Click to center and view details.',
    kg_nodes_filter_label: 'Filter node list',
    kg_nodes_filter_placeholder: 'Filter by name…',
    kg_nodes_empty: 'No nodes match the filter.',
    kg_focus_no_selection: 'Select a node on the graph or in the list.',
    kg_rel_belongs_to: 'Belongs to client',
    kg_rel_in_industry: 'Industry',
    kg_rel_tagged_with: 'Tag',
    kg_rel_has_stage: 'Stage (proposal)',
    kg_rel_has_pricing_model: 'Pricing model',
    kg_rel_related_content: 'Related content (proposal ↔ case)',
    kg_rel_similar_to: 'Semantically similar',
    kg_rel_delivers: 'Delivers',
    kg_rel_uses_technology: 'Uses technology',
    kg_rel_achieved: 'Achieved outcome',
    kg_rel_addresses_theme: 'Addresses theme',
    kg_type_content: 'Content',
    kg_type_client: 'Client',
    kg_type_client_label: 'Client name (no master record)',
    kg_type_industry: 'Industry',
    kg_type_tag: 'Tag',
    kg_type_stage: 'Stage',
    kg_type_pricing_model: 'Pricing model',
    kg_type_offering: 'Offering / studio',
    kg_type_technology: 'Technology',
    kg_type_outcome: 'Outcome',
    kg_type_theme: 'Theme',
    kg_tabs_aria: 'Knowledge graph sections',
    kg_tab_graph: 'Graph',
    kg_tab_entities: 'Entities',
    kg_entities_intro_heading: 'How the graph is structured',
    kg_entities_intro_lead:
      'The graph combines three layers: catalog structure, semantic similarity between documents, and AI-extracted business entities. Below is the full inventory with no collapsible sections.',
    kg_entities_layer_structural_title: 'Structural layer',
    kg_entities_layer_structural_lead:
      'Clients, industries, tags, stages, and pricing models from the catalog and Salesforce.',
    kg_entities_layer_semantic_title: 'Semantic layer',
    kg_entities_layer_semantic_lead:
      'similar_to links between documents via embeddings: find related pieces even across clients.',
    kg_entities_layer_conceptual_title: 'Conceptual layer',
    kg_entities_layer_conceptual_lead:
      'Offerings, technologies, outcomes, and themes extracted by AI from each document’s text.',
    kg_entities_flow_source_title: 'Documents and clients enter',
    kg_entities_flow_source_lead:
      'Proposals, cases, onboarding, and accounts are stored as points on the map.',
    kg_entities_flow_classify_title: 'Signals classify them',
    kg_entities_flow_classify_lead:
      'Industry, tags, stage, and pricing model group similar materials together.',
    kg_entities_flow_discover_title: 'Context becomes discoverable',
    kg_entities_flow_discover_lead:
      'Connections expose clients, topics, and related materials so you can navigate from one concrete point.',
    kg_entities_catalog_heading: 'Type catalog',
    kg_entities_catalog_lead:
      'Each card shows what the type means and how many nodes or edges exist in Supabase today, grouped by layer.',
    kg_entities_types_panel_heading: 'Node types',
    kg_entities_types_panel_lead:
      'What can appear as a point on the graph. Counts are persisted nodes.',
    kg_entities_layer_group_structural: 'Structural',
    kg_entities_layer_group_semantic: 'Semantic',
    kg_entities_layer_group_conceptual: 'Conceptual',
    kg_entities_catalog_totals: '{nodes} nodes · {edges} saved relationships',
    kg_entities_relations_heading: 'Relation types',
    kg_entities_relations_lead:
      'How nodes connect. Each row explains the edge meaning and how many are stored.',
    kg_entities_count_fmt: '{count} in the index',
    kg_entity_desc_content:
      'An Aviators catalog document: proposal, success case, client sheet, or onboarding. Created when content is saved or indexed.',
    kg_entity_desc_client:
      'A master account record (Salesforce/Supabase). Groups documents and commercial links under one identifier.',
    kg_entity_desc_client_label:
      'A client name mentioned in a document when no master record exists yet. Keeps the link until the account is synced.',
    kg_entity_desc_industry:
      'An industry or sector (e.g. aviation, retail). Contents and clients can share the same industry.',
    kg_entity_desc_tag:
      'A tag extracted from or assigned to documents. Connects proposals, cases, and onboarding about the same topic.',
    kg_entity_desc_stage:
      'A commercial stage of a proposal (e.g. discovery, negotiation). Applies to proposal content nodes only.',
    kg_entity_desc_pricing_model:
      'Pricing or engagement model of a proposal (e.g. time & materials, fixed price).',
    kg_entity_desc_offering:
      'Offering, studio, or service line extracted from the document by AI (conceptual graph layer).',
    kg_entity_desc_technology:
      'Technology, platform, or stack mentioned in the document (AI-extracted).',
    kg_entity_desc_outcome:
      'Business outcome or KPI reported (e.g. cost reduction, conversion lift).',
    kg_entity_desc_theme:
      'Cross-cutting business theme or problem (e.g. fraud detection, forecasting).',
    kg_entity_rel_desc_belongs_to:
      'Content or a client label points to the master client it belongs to.',
    kg_entity_rel_desc_tagged_with:
      'Content shares the same tag with other documents.',
    kg_entity_rel_desc_in_industry:
      'Content or a client is classified in that industry.',
    kg_entity_rel_desc_related_content:
      'Proposal and success case for the same client are linked for commercial context.',
    kg_entity_rel_desc_similar_to:
      'Two documents are semantically similar via embeddings (may cross clients and industries).',
    kg_entity_rel_desc_delivers:
      'Content describes or delivers that offering or service line.',
    kg_entity_rel_desc_uses_technology:
      'Content mentions or implements that technology.',
    kg_entity_rel_desc_achieved:
      'Content reports that outcome or KPI.',
    kg_entity_rel_desc_addresses_theme:
      'Content addresses that business theme or problem.',
    kg_entity_rel_desc_has_stage:
      'The proposal is at that stage in the sales cycle.',
    kg_entity_rel_desc_has_pricing_model:
      'The proposal declares that commercial model.',
    kg_entities_browse_heading: 'Entity inventory',
    kg_entities_browse_lead:
      'Search by name, filter by type, and open an entity on the graph from the table.',
    kg_entities_filter_type: 'Entity type',
    kg_entities_filter_type_all: 'All types',
    kg_entities_filter_search: 'Search by name',
    kg_entities_filter_search_placeholder: 'Name, tag, client…',
    kg_entities_col_name: 'Name',
    kg_entities_col_type: 'Type',
    kg_entities_col_meta: 'Detail',
    kg_entities_col_actions: 'Actions',
    kg_entities_meta_content_type: 'Content type: {type}',
    kg_entities_btn_view_graph: 'View on graph',
    kg_entities_empty: 'No entities match the filter.',
    kg_entities_busy_catalog: 'Loading entity catalog…',
    kg_entities_busy_list: 'Loading entities…',
    kg_entities_error_catalog: 'Could not load the entity catalog.',
    kg_entities_error_list: 'Could not load the entity list.',
    tags_cloud_heading: 'Tag cloud',
    tags_cloud_lead:
      'Browse the catalog visually: size and color reflect popularity. Click any tag to see linked documents.',
    tags_cloud_hint: 'Size reflects how many documents share the tag.',
    tags_cloud_search_placeholder: 'Search tag…',
    tags_cloud_stat_tags: '{n} tags',
    tags_cloud_stat_top: 'Most popular: {tag}',
    tags_cloud_spotlight_label: 'Featured tag',
    tags_cloud_spotlight_meta: '{n} documents in the catalog',
    tags_cloud_spotlight_btn: 'Explore',
    tags_cloud_no_match: 'No tag matches your search.',
    tags_busy_loading: 'Loading tags…',
    tags_busy_browse: 'Loading content…',
    tags_cloud_empty: 'No tags in the catalog yet. Upload tagged content from Content.',
    tags_browse_title: 'Content tagged {tag}',
    tags_browse_lead:
      'Documents that include this tag. Open details or filter by type.',
    tags_browse_back: 'Back to cloud',
    tags_browse_empty: 'No content with this tag.',
    tags_filter_type: 'Type',
    tags_btn_open: 'View detail',
    tags_col_title: 'Title',
    tags_col_type: 'Type',
    tags_col_client: 'Client',
    tags_col_updated: 'Updated',
    tags_count_badge: '{n} docs',
    tags_merge_mode_btn: 'Merge tags',
    tags_merge_mode_exit: 'Exit merge',
    tags_merge_bar_label: '{n} selected',
    tags_merge_btn: 'Merge',
    tags_merge_clear: 'Clear selection',
    tags_merge_confirm:
      'Merge {sources} into {target}? Catalog documents will be updated. This cannot be undone.',
    tags_merge_busy: 'Merging tags…',
    tags_merge_ok: 'Merge complete: {target} across {n} document(s).',
    tags_merge_select_min: 'Select at least two tags to merge.',
    err_tags_merge_min: 'Provide at least two distinct tags to merge.',
    err_tags_merge_failed: 'Could not complete the tag merge.',
    tags_suggest_btn: 'Globant AI suggestions',
    tags_suggest_heading: 'Suggested merges',
    tags_suggest_lead:
      'Duplicate spellings in the catalog are detected automatically and Globant AI proposes synonyms. The canonical tag will be the most used; review each group before merging.',
    tags_suggest_busy: 'Finding suggested merges…',
    tags_suggest_empty: 'No merge suggestions right now.',
    tags_suggest_reason_spelling:
      'The same tag appears with different spellings in the catalog.',
    tags_suggest_apply: 'Merge group',
    tags_suggest_dismiss: 'Dismiss',
    tags_suggest_refresh: 'Refresh suggestions',
    err_tags_suggest_failed: 'Could not load merge suggestions.',
    contents_btn_new: 'New content',
    contents_btn_back_list: 'Back to list',
    contents_editor_title_new: 'New content',
    contents_editor_title_edit: 'Edit content',
    contents_editor_title_view: 'View content',
    contents_editor_subtitle_view: 'Read-only view: you can review all fields but cannot change them.',
    contents_editor_readonly_banner: 'Read-only mode. You do not have permission to edit this content.',
    contents_tooltip_view_detail: 'View details',
    contents_btn_view_file: 'View PDF',
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
    err_contents_upload_too_large:
      'File «{name}» exceeds the maximum allowed size ({max_mb} MB).',
    err_contents_repair_drive_project_only:
      'Repair from Drive only applies to success cases or onboarding with a PDF in the project folder.',
    err_contents_repair_drive_success_only:
      'Repair from Drive only applies to success cases or onboarding with a PDF in the project folder.',
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
    contents_type_onboarding: 'Onboarding',
    contents_legend_title: 'Agents:',
    contents_col_title: 'Title',
    contents_col_type: 'Type',
    contents_col_client: 'Client',
    contents_col_updated: 'Updated',
    contents_col_rag_status: 'RAG Status',
    contents_col_actions: 'Actions',
    contents_rag_status_success: 'Indexed',
    contents_rag_status_failed: 'Error',
    contents_rag_status_processing: 'Processing',
    contents_rag_status_pending: 'Pending',
    contents_rag_status_missing: 'No document',
    contents_btn_edit: 'Edit',
    contents_row_open_aria: 'Open {title} in detail view',
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
    contents_step_analyzing_inline: 'Uploading and analyzing the PDF with AI…',
    contents_extract_phase_common:
      'Title, summary, client, industry, and hashtags…',
    contents_extract_phase_challenge: 'Challenge (business problem)…',
    contents_extract_phase_solution: 'Solution (approach and delivery)…',
    contents_extract_phase_impact: 'Impact, metrics, evidence, and notes…',
    contents_extract_phase_proposal:
      'Stage, pricing model, effort, and timeline…',
    contents_extract_phase_proposal_commercial:
      'Stage, pricing, effort, timeline, and win probability…',
    contents_extract_phase_proposal_scope:
      'Studio, topic, scope, and delivery notes…',
    contents_extract_phase_client:
      'Account status, active projects, and health score…',
    contents_extract_phase_onboarding: 'Topic, category, and audience…',
    contents_extract_phase_generic:
      'Common and type-specific document fields…',
    contents_extract_pass_progress: 'Pass {current} of {total}: {phase}',
    contents_batch_upload_extracting_detail:
      'Extracting {current} of {total}: {name} — {phase}',
    contents_batch_step_heading: 'PDF batch · file {current} of {total}',
    contents_batch_step_read: 'Step 1: reading the PDF in your browser…',
    contents_batch_step_extract: 'Step 2: extracting metadata with AI…',
    contents_batch_step_save: 'Step 3: saving and indexing to the catalog…',
    contents_batch_counter_analyzed: '{analyzed} of {total} with metadata extracted',
    contents_batch_counter_analyzed_saved:
      '{analyzed} extracted · {saved} saved of {total}',
    contents_batch_counter_file: 'File {current} / {total}',
    contents_batch_file_label: '{name}',
    contents_btn_cancel_upload: 'Cancel',
    contents_cancel_confirm:
      'The uploaded file and extracted data will be discarded. Continue?',
    contents_cancelled: 'Operation cancelled.',
    contents_form_heading: 'Review and complete the fields',
    contents_form_lead:
      'Fill in each labeled field. The sections below depend on the content type you chose.',
    contents_lbl_client_new: 'New client name',
    contents_client_toggle_aria: 'Switch between client list and quick add',
    contents_lbl_title: 'Title',
    contents_lbl_summary: 'Summary',
    contents_lbl_client: 'Client',
    contents_lbl_industry: 'Industry',
    contents_sc_industry_heading: 'Success case industry',
    contents_sc_industry_lead:
      'Choose the entry industry before uploading the PDF. It classifies the content and assigns the generic client if the document does not name an account.',
    contents_sc_industry_continue: 'Continue to file',
    contents_success_industry_field_hint:
      'Same industry you chose when uploading the PDF. You can change it here before saving.',
    contents_err_industry_required: 'Select an industry before uploading the PDF.',
    contents_err_proposal_material_kind: 'Choose the proposal material type.',
    contents_err_proposal_studio_required: 'Enter which Globant Studio the document describes.',
    contents_err_proposal_offering_required: 'Choose the offering (AI Pods, T&M, etc.).',
    contents_lbl_tags: 'Hashtags',
    contents_ph_add_tag: '#newTag',
    contents_btn_add_tag: 'Add',
    contents_specific_proposal_heading: 'Proposal fields',
    contents_specific_proposal_lead:
      'Classify the material (commercial proposal, Studio, offering, corporate) and its theme. On save, the PDF is archived in Drive under Propuestas/Catalogo/ using that structure.',
    contents_proposal_material_kind: 'Material type',
    contents_proposal_kind_commercial: 'Commercial proposal (client / RFP)',
    contents_proposal_kind_studio: 'Globant Studio',
    contents_proposal_kind_offering: 'Offering (AI Pods, engagement models)',
    contents_proposal_kind_corporate: 'Globant corporate material',
    contents_proposal_kind_other: 'Other',
    contents_proposal_topic: 'Theme / topic',
    contents_proposal_topic_ph: 'E.g.: aviation, loyalty, cloud, AI transformation',
    contents_proposal_studio: 'Globant Studio',
    contents_proposal_studio_ph: 'E.g.: Aviation Studio, AI Studio, Edge Studio',
    contents_proposal_offering: 'Offering',
    contents_specific_success_heading: 'Success case fields',
    contents_specific_onboarding_heading: 'Onboarding fields',
    contents_onboarding_topic: 'Topic',
    contents_onboarding_topic_ph: 'E.g.: PSS, NDC, Loyalty, Revenue Management',
    contents_onboarding_category: 'Category',
    contents_onboarding_category_ph: 'E.g.: Business, Airline, Domain, Concept',
    contents_onboarding_audience: 'Audience',
    contents_onboarding_audience_ph: 'E.g.: New joiners, Technical, Commercial',
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
    contents_extraction_done_confidence:
      'Metadata extracted (confidence {confidence}). Review and adjust before saving.',
    contents_confidence_high: 'high',
    contents_confidence_medium: 'medium',
    contents_confidence_low: 'low',
    contents_extraction_warnings_prefix: 'Warnings:',
    contents_warn_title_from_filename: 'Title inferred from file name.',
    contents_warn_client_from_catalog: 'Client matched to existing catalog entry.',
    contents_warn_industry_not_in_catalog:
      'Document industry discarded: not in the client catalog.',
    contents_warn_client_from_filename: 'Client inferred from file name.',
    contents_warn_client_created:
      'New client added to the master list (no close match in the catalog).',
    contents_warn_client_generic_industry:
      'No account named in the document: assigned to the generic client for the detected industry.',
    contents_warn_tags_enriched:
      'Tags supplemented from themes detected in the document (better for the tag cloud).',
    contents_warn_challenge_from_summary:
      'Challenge inferred from summary because the document had no separate sections.',
    contents_warn_summary_from_notes:
      'Summary was expanded with scope/notes from the document to improve search and embeddings.',
    contents_warn_extraction_pass_empty: 'Pass {pass} returned no extracted data.',
    contents_warn_extraction_pass_failed: 'Pass {pass} failed: {detail}',
    contents_uploaded: 'File uploaded. You can now extract metadata.',
    contents_saved: 'Content saved.',
    contents_similar_check_busy: 'Comparing with catalog…',
    contents_similar_title: 'Possible duplicate',
    contents_similar_lead:
      'This success case metadata looks very similar to content already in the catalog:',
    contents_similar_lead_continue:
      'The extracted draft looks very similar to content already in the catalog:',
    contents_similar_item: '• {title} — {client} ({pct}% similar)',
    contents_similar_confirm: 'Save anyway?',
    contents_similar_confirm_continue: 'Continue anyway?',
    contents_similar_batch_file: 'File: {name}',
    contents_similar_declined: 'Not added: possible duplicate in the catalog.',
    contents_similar_batch_declined:
      '{n} file(s) not saved after duplicate warning.',
    contents_similar_review_title: 'Review possible duplicates',
    contents_similar_review_lead:
      'These files were already uploaded but look similar to existing cases. Check the ones you want removed from the catalog, or keep all.',
    contents_similar_review_keep_all: 'Keep all',
    contents_similar_review_delete_selected: 'Delete checked',
    contents_similar_review_delete_busy: 'Deleting marked cases…',
    contents_similar_review_deleted: 'Removed {n} case(s) marked as duplicate.',
    contents_similar_review_item_heading: '{title}',
    contents_similar_review_item_file: 'File: {name}',
    contents_similar_review_item_delete: 'Remove from catalog',
    contents_similar_review_batch_done:
      'Batch finished. {n} file(s) with possible duplicates to review.',
    contents_external_url_mapping_heading: 'Per-file URL (recommended for batch)',
    contents_external_url_mapping_lead:
      'Upload mapping.json (one URL per PDF, fileName → externalUrl). Each success case keeps its own drive_file_url without copying the PDF to Drive.',
    contents_external_url_mapping_pick: 'Choose mapping.json',
    contents_external_url_mapping_loaded: '{n} URL(s) loaded from mapping.json',
    contents_external_url_mapping_invalid: 'Invalid mapping.json or no externalUrl entries.',
    contents_external_url_mapping_read_err: 'Could not read mapping.json.',
    contents_external_url_label: 'External URL (fallback, single file)',
    contents_external_url_placeholder: 'https://…',
    contents_external_url_lead:
      'Without mapping.json, paste one URL here as fallback. With mapping.json, each PDF uses its URL by fileName.',
    err_content_duplicate_similar:
      'Metadata very similar to an existing success case. Review the catalog before saving.',
    contents_deleted: 'Content deleted.',
    contents_confirm_delete:
      'This removes the item from catalog and agent index. Continue?',
    contents_batch_upload_extracting: 'Extracting {current} of {total}: {name}',
    contents_batch_upload_saving: 'Saving {current} of {total}: {name}',
    contents_batch_done_all_ok: '{n} files uploaded successfully.',
    contents_batch_done_partial: '{ok} files uploaded; {fail} failed.',
    contents_batch_skipped_non_pdf: 'Skipped {n} non-PDF file(s).',
    contents_batch_err_replace_one_file: 'When editing you can only replace one PDF at a time.',
    contents_batch_too_many: 'Select at most {max} files per batch.',
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
    contents_btn_reindex_metadata: 'Update metadata',
    contents_btn_reextract: 'Re-extract metadata',
    contents_busy_reindexing_metadata: 'Updating metadata in RAG…',
    contents_busy_reextracting: 'Re-reading PDF and extracting metadata with AI…',
    contents_reindex_metadata_done: 'Metadata updated.',
    contents_reextract_done: 'Metadata re-extracted. Review the fields and save.',
    contents_reindex_metadata_failed: 'Could not update metadata.',
    contents_confirm_reextract:
      'Re-analyze the PDF with AI? Form fields will be overwritten. Nothing is saved until you click Save.',
    contents_err_reextract_no_file: 'No PDF in Drive to re-analyze.',
    err_contents_reextract_no_file:
      'This content has no PDF in Drive to re-analyze.',
    err_contents_reextract_file_missing:
      'The PDF no longer exists in Drive. Repair the index or upload a new file.',
    contents_tooltip_edit: 'Edit',
    contents_tooltip_view: 'Open file',
    contents_tooltip_repair: 'Re-index from Drive',
    contents_tooltip_reindex_meta: 'Update metadata',
    contents_tooltip_delete: 'Delete',
    admin_contents_empty:
      'No agents yet. Create one in the Agents tab.',
    note_no_email:
      'We could not get your email. Re-authorize the app or check deployment.',
    note_no_docs:
      'We could not find recent Docs or .txt/.md files in your Drive. Create one or check Drive permissions.',
    login_h1: 'Aviators',
    login_lead: 'This is the Aviators agentic suite. Welcome.',
    login_button: 'Continue with Google',
    login_footnote:
      'When you continue, Google may ask for permission to read your email, name and profile photo from your organization directory.',
    visitor_title: 'No role assigned',
    visitor_body:
      "You don't have a role assigned, so access is limited. If you need more features, ask your Aviators admin.",
    visitor_body_html:
      "You don't have a role assigned, so access is limited. You can <strong>request access</strong> with the role you need and a short reason; an administrator will review it.",
    visitor_request_access_btn: 'Request access',
    nav_request_access: 'Request access',
    page_request_access_title: 'Request access',
    page_request_access_lead:
      'Fill in the form so an Aviators administrator receives your request. We will notify you when a role is assigned.',
    access_request_form_heading: 'Your request',
    access_request_form_lead:
      'Choose the role you need. The reason is optional. You can only have one pending request at a time.',
    access_request_role_label: 'Desired role',
    access_request_role_placeholder: 'Select a role…',
    access_request_reason_label: 'Reason (optional)',
    access_request_reason_ph: 'E.g. I need to upload proposals for the presales team…',
    access_request_reason_empty: '(not provided)',
    access_request_submit_btn: 'Submit request',
    access_request_busy_submit: 'Submitting request…',
    access_request_submit_done: 'Request submitted. An administrator will review it soon.',
    access_request_pending_title: 'You already have a pending request',
    access_request_pending_detail: 'You requested the {role} role on {date}. We will notify you when it is resolved.',
    access_request_err_not_visitor: 'You already have a role assigned; no need to request access.',
    access_request_err_reason: 'Please enter a reason for your request.',
    access_request_err_reason_long: 'The reason is too long (max 2000 characters).',
    access_request_err_pending: 'You already have a pending request.',
    access_request_err_supabase: 'Could not save your request. Contact your Aviators administrator.',
    access_request_mail_subject: 'Aviators · new access request',
    access_request_mail_body:
      'A visitor submitted an access request in Aviators.\n\n' +
      'Email: {email}\n' +
      'Name: {name}\n' +
      'Requested role: {role}\n' +
      'Reason:\n{reason}\n\n' +
      'Request ID: {id}\n' +
      'Open Aviators: {url}\n\n' +
      'Review it under Settings → Users → Requests.',
    access_request_mail_url_missing: '(Web App URL not available)',
    home_welcome_title: 'Welcome to the Aviators agentic suite',
    home_welcome_lead_html:
      'For more info go to the <a href="#" data-nav-page="faq" class="font-medium text-sky-600 underline hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">FAQ</a>, or ask a question directly.',
    page_onboarding_title: 'Onboarding · Aviation Studio',
    page_onboarding_lead_html:
      'Ask about aviation concepts, domain terminology and studio methodology. Every answer comes from the <strong>onboarding agent</strong> and its indexed repository.',
    page_onboarding_chat_lead:
      'Ask about PSS, NDC, loyalty, studio processes or other onboarding topics. The specialized agent always responds.',
    onboarding_consult_heading: 'Conversation with the onboarding agent',
    onboarding_consult_lead:
      'Type your question below. The orchestrator is bypassed: each message is answered by the onboarding agent using its indexed corpus.',
    page_globant_offering_title: 'Globant Offering',
    page_globant_offering_lead_html:
      'Ask about commercial offerings, Globant Studios, AI Pods and material indexed by the proposals agent. Every answer comes from that specialized agent.',
    page_globant_offering_chat_lead:
      'Ask about offerings, studios, success cases or how to shape a commercial proposal. The proposals agent always responds with its indexed corpus.',
    globant_offering_consult_heading: 'Conversation with the proposals agent',
    globant_offering_consult_lead:
      'Type your question below. The orchestrator is bypassed: each message is answered by the proposals agent.',
    chat_empty_hint_globant_offering:
      'Ask about Globant offerings, recommended studios, AI Pods or commercial wording. Use quick prompts or type your question.',
    page_proposal_building_title: 'Proposal building',
    page_proposal_building_lead_html:
      'Follow the steps: upload one or more client documents, validate the brief and catalog match, configure the deck and review recommended <strong>Studios</strong>. For agent Q&amp;A, use <strong>Globant Offering</strong>.',
    page_proposal_building_chat_lead:
      'Guided step-by-step flow; chat with the proposals agent lives in Globant Offering.',
    pb_consult_heading: 'Brief and conversation',
    pb_consult_lead:
      'The brief is validated in the building steps. To chat with the agent, open Globant Offering.',
    chat_empty_hint_proposal_building:
      'Use Globant Offering to consult the proposals agent.',
    pb_btn_open_globant_offering: 'Open Globant Offering',
    pb_studios_next_hint:
      'Want to refine wording, pricing or next steps? Open Globant Offering and ask the proposals agent.',
    pb_btn_validate_brief: 'Validate brief',
    pb_btn_confirm_brief: 'Confirm brief',
    pb_btn_add_scope_item: 'Add item',
    pb_btn_remove_scope_item: 'Remove',
    pb_btn_add_milestone: 'Add milestone',
    pb_btn_continue_industry: 'Continue',
    pb_btn_start_building: 'Build proposal',
    pb_btn_continue_deck_options: 'Continue',
    pb_deck_options_heading: 'Deck content',
    pb_deck_options_lead:
      'Choose which sections to include in the presentation. The agenda is built automatically from what you keep.',
    pb_lbl_include_globant: 'Include «Who we are — Globant» section?',
    pb_include_globant_lead:
      'If you choose no, slides 4–8 are removed from the template (who we are).',
    pb_lbl_include_airlines_studio: 'Include Airlines studio information?',
    pb_include_airlines_studio_lead:
      'If you choose no, the airlines studio slides are removed (slides 9–11 in the template).',
    pb_option_yes: 'Yes, include',
    pb_option_no: 'No, omit',
    pb_agenda_item_globant: 'Who we are — Globant',
    pb_agenda_item_airlines_studio: 'Airlines studio',
    pb_agenda_item_understanding: 'Our understanding',
    pb_agenda_item_solution: 'Our solution',
    pb_agenda_item_success_cases: 'Success cases',
    pb_agenda_line_fmt: '{label}',
    pb_validation_heading: 'Validate extracted brief',
    pb_validation_lead:
      'Review and correct what we extracted from all documents. This brief guides the deck, studios and advisor.',
    pb_lbl_client: 'Client',
    pb_ph_client: 'Client name (if known)',
    pb_lbl_scope_items: 'Client ask / scope',
    pb_lbl_scope_title: 'Item',
    pb_ph_scope_title: 'Short title',
    pb_ph_scope_desc: 'Our understanding of what is requested',
    pb_lbl_commercial_model: 'Commercial model',
    pb_lbl_milestones: 'Dates and milestones',
    pb_lbl_milestone_label: 'Milestone',
    pb_lbl_milestone_date: 'Date',
    pb_ph_milestone_label: 'E.g. Go-live, phase 1 delivery',
    pb_ph_milestone_date: 'E.g. 2026-09-30 or Q3 2026',
    pb_lbl_detected_language: 'Detected language',
    pb_lang_es: 'Spanish',
    pb_lang_en: 'English',
    pb_industry_heading: 'Industry, language and base deck',
    pb_industry_lead:
      'Choose the industry and proposal language. Only the Airlines deck in Spanish is available for now.',
    pb_lbl_industry: 'Industry',
    pb_lbl_proposal_language: 'Proposal language',
    pb_proposal_language_lead: 'Sets the language for the deck and AI-generated content.',
    pb_option_unavailable: 'Coming soon',
    pb_industry_airlines: 'Airlines',
    pb_industry_logistics: 'Logistics',
    pb_deck_airlines: 'Base deck · Airlines',
    pb_deck_logistics: 'Base deck · Logistics',
    pb_deck_selected: 'Selected deck: {deck}',
    pb_busy_extracting: 'Extracting brief from material…',
    pb_busy_resolving_deck: 'Preparing base deck…',
    pb_busy_creating_deck: 'Creating and customizing presentation in Drive…',
    pb_busy_creating_deck_title: 'Creating proposal',
    pb_create_step_label: 'Step {current} of {total}',
    pb_step_compose_understanding: 'Drafting our understanding with AI…',
    pb_step_copy_deck: 'Copying template to Drive…',
    pb_step_compose_success_rationales: 'Explaining why success cases fit with AI…',
    pb_step_customize_slides: 'Customizing slides and success cases…',
    pb_deck_created_line: 'Presentation created in Drive: {name}',
    pb_deck_open_link_md: 'Open presentation: [{name}]({url})',
    pb_deck_success_cases_line: 'Success cases included: {count}',
    pb_client_fallback_label: 'Client',
    pb_understanding_fallback: 'Scope to be confirmed with the client.',
    pb_understanding_intro:
      'Our client {client} is requesting the following:',
    pb_deck_title_fallback: 'Proposal scope',
    pb_success_case_link_label: 'View success case',
    pb_success_case_why_label: 'Why we include this case in the proposal:',
    pb_success_case_rationale_fallback:
      'Reference aligned with the industry and validated brief scope.',
    pb_success_case_summary_fallback: 'Success case relevant to this proposal.',
    pb_success_case_title_fallback: 'Success case',
    pb_err_slides_api_unavailable:
      'Enable the Google Slides advanced service in the Apps Script project.',
    pb_err_deck_not_google_slides:
      'The deck template must be a Google Slides presentation (not PowerPoint or other format).',
    pb_warn_template_slide_missing:
      'Template is missing slide {slide} for success cases; that section was skipped.',
    pb_warn_no_success_cases:
      'No applicable success cases were found; the template success-case slide was removed.',
    pb_warn_success_slide_clone_failed:
      'Could not clone success-case slides in the presentation.',
    pb_err_deck_template_missing:
      'Base deck template is not configured (set PROPOSAL_DECK_AIRLINES_ID or PROPOSAL_DECK_LOGISTICS_ID in script properties).',
    pb_err_deck_template_not_found:
      'Base deck template was not found in Drive. Check the configured file ID.',
    pb_err_extract: 'Could not extract the brief.',
    pb_err_extract_empty: 'Type a message or attach material before validating the brief.',
    pb_err_industry_required: 'Choose an industry (airlines or logistics).',
    pb_err_attachment_mime: 'Unsupported format for “{name}” ({mime}).',
    pb_warn_extract_sparse: 'Little information detected; complete the fields manually.',
    pb_status_building_ready:
      'Brief validated · {industry} · {deck}. You can keep chatting to build the proposal.',
    pb_status_intake: 'Step 1: add material and validate the brief.',
    pb_status_materials: 'Step 1 · Materials: upload all RFP or brief documents.',
    pb_status_brief: 'Step 2 · Brief: confirm client, scope and dates extracted.',
    pb_status_configure: 'Step 3 · Configure: industry, language and deck sections.',
    pb_status_building_progress: 'Step 4 · Creating presentation in Drive…',
    pb_status_studios: 'Step 5 · Studios: review which Globant areas fit this proposal.',
    pb_stepper_aria: 'Proposal building steps',
    pb_step_materials: 'Materials',
    pb_step_brief: 'Brief',
    pb_step_configure: 'Configure',
    pb_step_deck: 'Deck',
    pb_step_studios: 'Studios',
    pb_step_advisor: 'Advisor',
    pb_materials_heading: 'Input material',
    pb_materials_lead:
      'Upload all relevant documents (RFP, annexes, notes). We analyze them together before validating the brief.',
    pb_lbl_materials_files: 'Files',
    pb_lbl_materials_notes: 'Additional context (optional)',
    pb_ph_materials_notes: 'E.g. client priorities, constraints, key contacts…',
    pb_materials_formats: 'PDF, Word, text, CSV or image. You can select multiple files.',
    pb_btn_analyze_materials: 'Analyze materials',
    pb_materials_count: '{count} file(s) ready to analyze.',
    pb_material_status_pending: 'Pending',
    pb_material_status_done: 'Analyzed',
    pb_material_status_error: 'Error',
    pb_busy_extracting_file: 'Extracting {name} ({current}/{total})…',
    pb_busy_merging_briefs: 'Merging brief from all documents…',
    pb_lbl_project_summary: 'Request summary',
    pb_ph_project_summary: 'Executive summary detected in the materials',
    pb_lbl_technology_hints: 'Detected technologies and domains',
    pb_story_extracted_heading: 'What the material says',
    pb_story_extracted_lead: 'Name and context extracted from analyzed documents.',
    pb_story_unknown_client: '(client not detected)',
    pb_story_catalog_heading: 'Client catalog',
    pb_story_catalog_match_lead: 'We found a match in the Aviators database.',
    pb_story_catalog_nomatch_lead: 'No exact match. Pick a suggested client or edit the name.',
    pb_story_industry_line: 'Industry: {industry}',
    pb_story_subindustry_line: 'Sub-industry: {sub}',
    pb_story_score_line: 'Match confidence: {score}%',
    pb_building_heading: 'Presentation in Drive',
    pb_building_lead: 'The template was copied and customized with understanding and relevant success cases.',
    pb_building_ready_line: 'Deck ready: {name} · Success cases: {cases}',
    pb_btn_open_deck: 'Open presentation',
    pb_studios_heading: 'Recommended studios',
    pb_studios_lead:
      'The proposals agent and indexed catalog suggest which Globant Studios should align with this opportunity.',
    pb_busy_recommend_studios: 'Fetching studio recommendations from the proposals agent…',
    pb_studios_empty: 'No studio recommendations were generated.',
    pb_btn_continue_advisor: 'Continue to advisor',
    pb_studio_fallback_rationale: 'Studio present in the indexed proposals catalog.',
    pb_err_studios: 'Could not recommend studios.',
    pb_err_use_builder: 'Use the building steps above; advisor chat unlocks at the end.',
    pb_business_context_heading: 'Commercial context',
    pb_business_context_lead:
      'Business data extracted from the material. Complete or correct gaps before building the deck.',
    pb_lbl_rfp_deadline: 'Submission deadline (RFP)',
    pb_ph_rfp_deadline: 'E.g. 2026-07-15 or «July 15, 2026»',
    pb_lbl_budget_amount: 'Budget (amount)',
    pb_ph_budget_amount: 'E.g. 250000 or «200k–300k USD»',
    pb_lbl_budget_currency: 'Currency',
    pb_ph_budget_currency: 'E.g. USD, EUR',
    pb_lbl_budget_notes: 'Budget notes',
    pb_ph_budget_notes: 'E.g. cap, taxes excluded, phased',
    pb_lbl_stakeholders: 'Stakeholders / contacts',
    pb_btn_add_stakeholder: 'Add contact',
    pb_ph_stakeholder_name: 'Name',
    pb_ph_stakeholder_role: 'Role / title',
    pb_ph_stakeholder_org: 'Company or area',
    pb_ph_stakeholder_email: 'Email (optional)',
    pb_lbl_business_objectives: 'Business objectives',
    pb_ph_business_objectives: 'One objective per line',
    pb_lbl_constraints: 'Constraints and conditions',
    pb_ph_constraints: 'One constraint per line',
    pb_btn_open_studio_catalog: 'View in catalog',
    pb_btn_open_studio_kg: 'View in graph',
    pb_btn_open_studio_drive: 'Open in Drive',
    pb_pricing_time_and_materials: 'Time & Materials',
    pb_pricing_staff_augmentation: 'Staff Augmentation',
    pb_pricing_fixed_price: 'Fixed Price',
    pb_pricing_subscription: 'Subscription',
    pb_pricing_ai_pods: 'AI Pods',
    orch_step_proposal_building_answering: 'Building proposal with the agent…',
    chat_empty_hint_onboarding:
      'E.g.: What is PSS? · How does NDC work? · Aviation Studio methodology',
    orch_step_onboarding_answering: 'The onboarding agent is answering…',
    orch_step_globant_offering_answering: 'The proposals agent is answering…',
    dashboard_title: 'General chat',
    dashboard_lead:
      'Write below and follow the conversation above. Replies appear as messages.',
    session_no_role_line: "You don't have a role assigned.",
    session_role_err_supabase:
      'Could not read your role from the database. If this persists, contact your Aviators administrator.',
    busy_connecting: 'Connecting…',
    session_check: 'Loading roles and agents…',
    role_label_visitor: 'Visitor',
    role_option_admin: 'Admin',
    role_option_presales: 'Presales',
    role_option_manager: 'Manager',
    role_option_tech: 'Tech',
    role_option_client_partner: 'Client Partner',
    role_option_miembro: 'Member',
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
    home_orchestrator_ok: 'Orchestrator active',
    home_orchestrator_missing_registry: 'Orchestrator is not configured in Aviators.',
    home_orchestrator_missing_remote:
      'Orchestrator RAG profile ({profile}) is missing in Globant. Create or sync default agents.',
    home_orchestrator_unknown:
      'Could not verify the orchestrator on Globant. Check the connection or agents.',
    admin_agent_badge_remote_missing: 'No RAG profile in Globant',
    admin_agent_badge_hub_missing: 'No Hub Agent in Globant',
    dash_contents_title: 'Contents',
    dash_clients_title: 'Clients',
    contents_readonly_notice: 'Read-only',
    clients_readonly_notice: 'Read-only',
    dash_detail_empty: 'No breakdown yet.',
    dash_agent_kind_orchestrator: 'Orchestrator',
    dash_agent_kind_success_cases: 'Success cases',
    dash_agent_kind_proposals: 'Proposals',
    dash_agent_kind_clients: 'Clients (corpus)',
    dash_agent_kind_onboarding: 'Onboarding',
    dash_agent_kind_other: 'Custom',
    dash_agent_kind_other_named: '{name}',
    dash_agents_strategies_line: 'Strategies: {list}',
    dash_industry_unknown: 'No industry',
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
    contents_batch_industry_label: 'Industry',
    contents_batch_industry_apply: 'Assign industry',
    contents_batch_industry_confirm:
      'Assign industry «{industry}» to {n} selected success case(s)?',
    contents_batch_industry_busy: 'Assigning industry…',
    contents_batch_industry_done: 'Industry assigned to {n} success case(s).',
    contents_batch_industry_partial:
      '{ok} updated; {skip} skipped (not success case or not found); {fail} failed.',
    contents_batch_industry_pick: 'Choose an industry to assign.',
    contents_batch_industry_none_sc: 'No success cases selected.',
    contents_batch_client_label: 'Client',
    contents_batch_client_apply: 'Assign client',
    contents_batch_client_confirm:
      'Assign client «{client}» to {n} selected success case(s)?',
    contents_batch_client_busy: 'Assigning client…',
    contents_batch_client_done: 'Client assigned to {n} success case(s).',
    contents_batch_client_partial:
      'Client: {ok} updated, {skip} skipped, {fail} failed.',
    contents_batch_client_pick: 'Choose a client from the catalog.',
    contents_batch_client_unknown: 'Client not found in the clients master.',
    label_no_email: '(no email)',
    label_em_dash: '—',
    err_generic: 'Error.',
    err_drive_root_not_configured:
      'Set DRIVE_ROOT_FOLDER_ID in Apps Script project properties (Drive root folder for success case and onboarding PDFs).',
    err_supabase_not_configured:
      'Supabase is not configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Script Properties).',
    err_salesforce_sheet_not_configured:
      'Set SALESFORCE_ACCOUNTS_SPREADSHEET_ID in Script Properties (Airlines Accounts spreadsheet ID).',
    err_scriptapp_scope:
      'Missing permission to manage triggers (script.scriptapp). Re-authorize the Web App after deploying the update.',
    admin_sf_sync_trigger_scope_required:
      'Cannot verify trigger: authorize script.scriptapp permission (new app version required).',
    err_supabase_sheets_disabled:
      'Sheets backend is disabled. Set AVIATORS_DATA_BACKEND=supabase.',
    err_role_supabase: 'Could not load roles from Supabase.',
    err_supabase_http: 'Supabase communication error.',
    err_supabase_json: 'Invalid Supabase response.',
    err_server_code: 'Server error ({code}).',
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
    chat_progress_sr: 'Query progress',
    chat_step_preparing: 'Preparing context…',
    chat_step_searching_index: 'Searching the knowledge index…',
    chat_step_reading_sources: 'Reading relevant sources…',
    chat_step_generating: 'Generating response…',
    chat_step_loading_context: 'Preparing selected documents…',
    chat_step_consulting_model: 'Consulting the model…',
    chat_step_composing: 'Composing the answer…',
    chat_attach_btn: 'Attach PDF',
    chat_attach_hint:
      'Optional: attach a PDF to analyze it. Not stored; the orchestrator processes it and compares it with the catalog.',
    chat_attach_remove: 'Remove attachment',
    chat_attach_selected: 'Attached: {name}',
    chat_ephemeral_need_prompt: 'Describe what you want analyzed in the attached document.',
    chat_step_ephemeral_validating: 'Validating document…',
    chat_step_ephemeral_matching: 'Searching for similar catalog content…',
    chat_step_ephemeral_analyzing: 'Analyzing document with AI…',
    busy_ephemeral_doc: 'Analyzing attached document…',
    err_ephemeral_doc_payload: 'Invalid attachment.',
    err_ephemeral_doc_empty: 'The attached file is empty.',
    err_ephemeral_doc_mime: 'Unsupported format for “{name}” ({mime}). Use PDF.',
    err_ephemeral_doc_too_large: 'File exceeds {max_mb} MB.',
    err_ephemeral_doc_not_eligible:
      'Only RFPs or documents from logistics, airline or airport companies are accepted.',
    meta_ephemeral_doc_analyzed: 'Document analyzed: {name}',
    chat_no_relevant_content: 'I couldn\'t find relevant information in my knowledge base to answer your query. Could you rephrase it or ask a more specific question?',
    chat_sr_you: 'You',
    chat_sr_agent: 'Assistant',
    chat_refs_title: 'Related sources',
    chat_refs_summary: 'Related sources ({count})',
    chat_refs_open_link: 'Open file',
    chat_ref_action_drive: 'View PDF',
    chat_ref_action_view_pdf: 'View PDF in app',
    chat_ref_action_catalog: 'View record',
    chat_ref_file_url_label: 'File',
    chat_ref_open_url: 'Open file link',
    chat_ref_action_client: 'View client',
    chat_ref_resolving_link: 'Resolving document link…',
    chat_ref_type_selected_file: 'Drive document',
    chat_ref_catalog_denied: 'You do not have permission to view Content.',
    chat_ref_agents_denied: 'You do not have permission to view Agents.',
    chat_ref_agent_not_in_list: 'Agent «{profile}» was not found in the list.',
    chat_ref_not_found: 'I could not find that file in Drive.',
    pdf_viewer_title: 'Document',
    pdf_viewer_loading: 'Loading PDF…',
    pdf_viewer_error: 'Could not display the PDF.',
    pdf_viewer_open_external: 'Open in Drive',
    pdf_viewer_open_ficha: 'View content record',
    pdf_viewer_use_external:
      'The PDF could not be embedded here. Use «Open in Drive» or open it in a new tab.',
    home_chat_banner_setup:
      'The assistant is not available right now. If this keeps happening, contact your Aviators admin.',
    lbl_question_sronly: 'Question',
    ph_question: 'Type your message…',
    ask_agent_btn: 'Send',
    ask_btn: 'Send with documents',
    static_drive_files_heading: 'Context files',
    static_drive_files_lead:
      'The list shows documents in the Google account that runs Aviators (deployment owner), not each visitor’s private Drive. Select up to 5 to include in this answer.',
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
      'Save profile and instructions first. PDFs you pick from your computer are indexed in Globant when you upload them (they are not saved to Drive). Drive folders and files still require a corpus sync. Delete removes the agent from Aviators.',
    admin_agent_sec_sources_heading: 'Sources for the index',
    admin_agent_sec_sources_lead:
      'Drag or choose PDFs from your computer: they are indexed into the Globant RAG profile (Enterprise AI) and appear as chips below. Fill in the profile name first. If you add Drive folders or files, use only that source type on this agent or only local PDFs — do not mix.',
    admin_agent_sec_indexed_lead:
      'Remote Globant listing for this profile. Refresh the list after syncing.',
    admin_agent_tab_general: 'General',
    admin_agent_tab_api: 'Globant API',
    admin_agent_tab_sources: 'Sources',
    admin_agent_tabs_aria: 'Agent sections',
    admin_agent_dropzone_aria: 'Drop PDF files here',
    admin_agent_dropzone_hint:
      'Drop one or more PDFs here, or choose files on your computer.',
    admin_agent_pdf_max_size_hint: 'Maximum PDF size from this screen: {mb} MB.',
    btn_admin_agent_upload_pdf: 'Choose PDF',
    btn_go_agents: 'Go to Agents',
    admin_upload_progress: 'Uploading file {current} of {total}…',
    admin_upload_progress_globant:
      'Indexing in Globant file {current} of {total}… (may take a moment)',
    admin_upload_done_added:
      '{n} PDF(s) were added to the Globant RAG index. Save the agent to persist the selection.',
    err_admin_upload_only_pdf: 'Only PDF files can be uploaded for this corpus.',
    err_admin_upload_profile_required:
      'Set the agent profile name before uploading PDFs from your computer.',
    err_admin_agent_sync_mixed_sources:
      'You cannot mix Drive folders or files with PDFs uploaded straight to Globant on the same agent. Use only one source type or split across two agents.',
    admin_agent_sync_rag_only_note:
      'Local PDFs are already in Globant; only the sync timestamp was updated.',
    err_admin_upload_empty: 'Empty file: «{name}».',
    err_admin_upload_decode: 'Could not read file «{name}».',
    err_admin_upload_too_large:
      'File «{name}» exceeds the maximum allowed size ({max_mb} MB). Nothing is indexed in Globant until you use a smaller PDF.',
    err_admin_upload_rpc_lost:
      'Upload did not finish (often if the PDF is over the limit or the network timed out). Maximum is {max_mb} MB per file. No partial index was created in Globant.',
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
    admin_agent_sidebar_empty_title: 'Start with your first agent',
    admin_agent_sidebar_empty_lead:
      'Each agent links a Globant profile, model instructions, and sources to index. Create one manually or generate the project defaults.',
    admin_agent_ro_sidebar_empty_title: 'No agents configured',
    admin_agent_ro_sidebar_empty_lead:
      'When agents exist, you can inspect their configuration from this list.',
    admin_agent_editor_selected: 'Selected agent',
    admin_agent_editor_new: 'New agent',
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
    admin_agent_seed_done_globant:
      'Synced {g} agent(s) to Globant Agents API (prompt context/instructions).',
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
    err_admin_agent_api_model_invalid:
      'Model «{model}» is not in the API catalog. Valid examples: {samples}.',
    err_admin_agent_api_strategy_invalid:
      'Strategy «{strategy}» is not in the API catalog. Examples: {samples}.',
    err_admin_agent_api_id:
      'Missing idOrName to save in Globant API.',
    err_admin_agent_id: 'Agent id is required.',
    err_admin_agent_not_found: 'That agent was not found.',
    err_admin_agent_save: 'Could not save the agent to Globant.',
    err_admin_agent_seed:
      'Could not create or verify default agents.',
    confirm_delete_agent_registry:
      'Remove this agent from Aviators? If it exists in Globant (RAG mode), the remote profile will be deleted too.',
    admin_agent_delete_modal_title: 'Delete this agent?',
    admin_agent_delete_modal_cancel: 'Cancel',
    admin_agent_delete_modal_confirm: 'Yes, delete',
    confirm_dialog_cancel: 'Cancel',
    confirm_dialog_confirm: 'Continue',
    confirm_dialog_type_label: 'Type {phrase} to confirm',
    admin_reset_all_confirm_title: 'Reset all data',
    admin_reset_all_confirm_phrase: 'RESET',
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
    chip_file_globant: 'GLOBANT',
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
    globant_hint_document_chat:
      'Attached PDF analysis: permanent Chat Assistant (default aviators-document-files, auto-created via POST /v1/assistant) + /v1/files + /v1/assistant/chat. Each PDF is deleted with DELETE /v1/files/{id} when done; the assistant remains.',
    globant_hint_rag:
      'After Refresh you see each agent (RAG profile). Docs = indexed files. “Delete agent” removes the profile in Globant.',
    globant_hint_no_key:
      'Data appears only when the script has GLOBANT_AGENTS_API_KEY and mode is Globant.',
    llm_meta_asst: 'Globant Assistant (/v1/chat) · profile/assistant {hint} · {loc}',
    llm_meta_rag: 'Globant RAG (/v1/search) · profile/assistant {hint} · {loc}',
    llm_hint_asst_long:
      'Assistant mode: GLOBANT_API_MODE=assistant + GLOBANT_AGENTS_API_KEY + GLOBANT_RAG_PROFILE_NAME (e.g. cv-extractor). Chat: /v1/assistant/chat. PDF attachments and extraction use /v1/files (multipart). Optional: GLOBANT_FILES_ASSISTANT_NAME for a dedicated temp-analysis folder; GLOBANT_RAG_SKIP_UPLOAD=true; GLOBANT_RAG_EXECUTE_MAX_RETRIES.',
    llm_hint_rag_long:
      'RAG mode: “Ask the agent” uses /v1/search/execute. Catalog save indexes via /v1/search/profile/.../document. PDF extraction and chat attachments use /v1/files + /v1/assistant/chat (not inline). Key GLOBANT_AGENTS_API_KEY. Optional: GLOBANT_FILES_ASSISTANT_NAME, GLOBANT_RAG_PROFILE_NAME, GLOBANT_RAG_DOCUMENT_ID, GLOBANT_RAG_SKIP_UPLOAD.',
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
    err_falta_globant_project_id:
      'GLOBANT_PROJECT_ID is missing in Script Properties (ProjectId header is required for Agents API v4).',
    err_globant_agent_upsert_project_hint:
      'Confirm GLOBANT_PROJECT_ID matches your Glob.AI OS project and is sent on every upsert.',
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
    err_globant_api_no_detail: 'No detail in the server response.',
    err_globant_api_auth_hint:
      'Check GLOBANT_AGENTS_API_KEY and GLOBANT_PROJECT_ID in Script Properties.',
    err_globant_rag_execute_400_hint:
      'Often means a misconfigured RAG profile (e.g. incomplete LLM after sync). In Admin → Agents, open the Clients agent, Save (updates the Globant profile), and Sync documents if you use Drive PDFs. The clients chat can also answer via the Supabase roster if RAG fails.',
    err_globant_rag_execute_profile: 'Profile: {profile}',
    err_globant_agent_upsert_hint:
      'Suggestions: verify the model exists in the API catalog (e.g. openai/gpt-5, not a made-up alias), strategy is valid, idOrName matches the profile, and the prompt does not exceed provider limits.',
    err_globant_agent_upsert_model: 'Model sent: {model}',
    err_globant_agent_upsert_id: 'idOrName sent: {id}',
    err_globant_agent_upsert_strategy: 'Strategy sent: {strategy}',
    error_dialog_title: 'Error',
    error_dialog_close: 'Close',
    error_dialog_detail_heading: 'Technical detail',
    err_globant_assistant_empty_file:
      'Empty file for Globant Assistant upload.',
    err_globant_document_upload_no_id:
      'Globant /v1/files did not return an id for the uploaded file.',
    err_globant_document_too_large:
      'File "{name}" exceeds the {max_mb} MB limit for Globant document analysis.',
    err_globant_assistant_not_found:
      'Globant could not find Chat Assistant «{assistant}». Check GLOBANT_FILES_ASSISTANT_NAME or clear it so Aviators can recreate aviators-document-files.',
    err_globant_files_assistant_required:
      'Could not resolve the Chat Assistant for PDF analysis (/v1/files + /v1/assistant/chat).',
    err_globant_files_assistant_create:
      'Could not create the permanent Chat Assistant in Globant (POST /v1/assistant).',
    globant_files_assistant_description:
      'Aviators — temporary PDF analysis via /v1/files (contents, chat attachment, proposals).',
    globant_files_assistant_prompt:
      'You are a document analysis assistant. Read the file uploaded to your folder and answer accurately. When JSON is requested, return valid JSON only with no markdown.',
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
      'RAG agent chat: GLOBANT_RAG_PROFILE_NAME. Attached PDFs: aviators-document-files assistant (auto-created; override with GLOBANT_FILES_ASSISTANT_NAME).',
    llm_ui_config_hint_document_chat:
      'Attached PDFs: /v1/files + permanent assistant (aviators-document-files). Each file is deleted when done; the assistant stays.',
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
    meta_provider_globant_hub_agent: 'Globant Agents API (Hub)',
    meta_provider_globant_hub_agent_fallback:
      'Globant Agents API (Hub) · fallback chat',
    meta_filter_hub_agent: 'Hub Agent: {agent}',
    meta_filter_hub_agent_fallback: 'Hub Agent (fallback): {agent}',
    err_globant_hub_agent_empty: 'Hub Agent returned no text.',
    err_globant_hub_agent_run:
      'Could not run Hub Agent. Publish the agent (automaticPublish) or check external execution permissions.',
    meta_filter_assistant_no_rag:
      'Assistant mode (no RAG document filter)',
    meta_filter_rag_doc_id: 'id = {id}',
    meta_filter_rag_full_profile: 'no filter (full profile)',
    meta_filter_profile: 'profile = {profile}',
    meta_orchestrator_selected_agent:
      'Routed to {agent} · confidence {confidence}',
    meta_filter_client_docs: 'Filtering by {client} ({count} docs)',
    meta_filter_direct_context: 'Direct context: {client} ({count} docs)',
    meta_filter_knowledge_graph: 'Graph: {count} related docs',
    meta_filter_roster_context: 'DB roster: {count} accounts',
    clients_roster_direct_count:
      'The Aviators roster (Salesforce / Supabase) has {total} accounts matching your question ({active} active{inactivePart}).{filterNote}{truncNote}',
    clients_roster_direct_count_inactive_part: ', {inactive} inactive',
    clients_roster_direct_count_none:
      'No accounts in the roster match the filters inferred from your question.',
    clients_roster_direct_filter_aviation:
      ' Filter: aviation (Passenger Airlines).',
    clients_roster_direct_filter_aerospace:
      ' Filter: airports and aerospace agencies.',
    clients_roster_direct_list_intro:
      '**{total}** accounts in the Aviators roster:{filterNote}',
    clients_roster_direct_list_owner_intro:
      '**{total}** accounts with salesperson / client partner / account owner «{owner}» in the Aviators roster:{filterNote}',
    clients_roster_direct_count_none_owner:
      'No accounts in the roster for salesperson / client partner / account owner «{owner}».',
    clients_roster_direct_owner:
      '**{account}** — salesperson / client partner / account owner: **{owner}**.',
    clients_roster_direct_owner_none:
      'No salesperson / client partner / account owner on record for **{account}**.',
    clients_roster_direct_list_inactive_tag: '_(inactive)_',
    clients_roster_direct_filter_industry: ' Filter: industry «{industry}».',
    clients_roster_direct_filter_sub_industry:
      ' Filter: sub-industry «{subIndustry}».',
    clients_roster_direct_filter_active: ' Active accounts only.',
    clients_roster_direct_filter_inactive: ' Inactive accounts only.',
    clients_roster_direct_filter_owner:
      ' Salesperson / client partner / account owner «{owner}».',
    clients_roster_direct_trunc:
      ' The total includes all matches (listed detail is capped at {cap} rows).',
    clients_roster_oppty_direct: '**{account}** (Salesforce roster):\n{lines}',
    clients_roster_oppty_direct_none:
      '**{account}** is in the roster but has no opportunity dates recorded in the latest sync.',
    clients_roster_oppty_line_last_created: '• Last opportunity created: {date}',
    clients_roster_oppty_line_last_won: '• Last opportunity won: {date}',
    clients_roster_oppty_line_first_won: '• First opportunity won: {date}',
    clients_roster_oppty_line_last_worked: '• Last worked opportunity: {date}',
    meta_filter_orchestrator_catalog: 'Content catalog ({count} rows)',
    meta_provider_globant_chat: 'Globant Chat',
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
      'Manage your client portfolio: search, filter by industry or sub-industry, and review each account with logo and contact.',
    clients_btn_new: 'New client',
    clients_editor_title_view: 'View client',
    clients_editor_subtitle_view: 'Read-only view: you can review client data but cannot change it.',
    clients_btn_edit: 'Edit',
    clients_row_open_aria: 'Open {name} in detail view',
    clients_editor_readonly_banner: 'Read-only mode. You do not have permission to edit this client.',
    clients_tooltip_view_detail: 'View details',
    clients_tooltip_edit: 'Edit',
    clients_btn_back_list: 'Back to list',
    clients_th_logo: 'Logo',
    clients_th_name: 'Name',
    clients_th_industry: 'Industry',
    clients_th_sub_industry: 'Sub-industry',
    clients_th_country: 'Country',
    clients_th_contact: 'Contact',
    clients_th_actions: 'Actions',
    clients_logo_heading: 'Client logo',
    clients_logo_lead:
      'Upload PNG, JPEG, WebP or GIF (max 400 KB). Stored in the database and shown in the list.',
    clients_btn_pick_logo: 'Choose image',
    clients_btn_remove_logo: 'Remove logo',
    clients_err_logo_invalid: 'Invalid image format. Use PNG, JPEG, WebP or GIF.',
    clients_err_logo_too_large: 'Image exceeds the maximum size (400 KB).',
    clients_lbl_name: 'Client name',
    clients_lbl_industry: 'Industry',
    clients_lbl_sub_industry: 'Sub-industry',
    clients_filter_search: 'Search',
    clients_filter_search_placeholder: 'Name, contact, country…',
    clients_filter_industry: 'Industry',
    clients_filter_industry_all: 'All industries',
    clients_filter_sub_industry: 'Sub-industry',
    clients_filter_sub_industry_all: 'All sub-industries',
    clients_filter_sub_industry_placeholder: 'Filter by sub-industry…',
    clients_filter_clear: 'Clear filters',
    clients_industry_placeholder: 'Select industry…',
    clients_industry_tourism_agencies: 'Travel Agencies',
    clients_industry_logistics: 'Logistics',
    clients_industry_aerospace_agencies: 'Aerospace Agencies',
    clients_industry_airports: 'Airports',
    clients_industry_airlines: 'Airlines',
    clients_lbl_country: 'Country',
    clients_lbl_contact_name: 'Contact name',
    clients_lbl_contact_email: 'Contact email',
    clients_lbl_notes: 'Notes',
    clients_btn_save: 'Save client',
    clients_btn_delete: 'Delete',
    clients_btn_cancel: 'Cancel',
    clients_busy_loading: 'Loading clients…',
    clients_busy_opening: 'Opening client…',
    clients_busy_saving: 'Saving client…',
    clients_busy_deleting: 'Deleting client…',
    clients_saved: 'Client saved.',
    clients_deleted: 'Client deleted.',
    clients_err_name_required: 'Client name is required.',
    clients_err_industry_invalid:
      'Industry must match a value already in the client catalog (or be left empty).',
    clients_err_sub_industry_invalid:
      'Sub-industry must match a value already in the client catalog (or be left empty).',
    err_client_id_invalid:
      'Could not delete: invalid client id. Reload the list and try again.',
    clients_confirm_delete: 'Delete this client permanently?',
    clients_no_items: 'No clients registered.',
    clients_no_results: 'No clients match the current filters.',
    clients_load_more: 'Load more',
    clients_showing_of: 'Showing {shown} of {total}.',
    contents_client_combo_new: '+ Add new client',
    contents_client_combo_placeholder: 'Select client…',
    contents_load_more: 'Load more',
    contents_showing_of: 'Showing {shown} of {total}.',
    contents_pagination_page_size: 'Per page',
    page_metrics_title: 'Metrics',
    page_metrics_lead:
      'Operational dashboard for chat usage, unanswered questions, and performance by agent, client and industry.',
    metrics_tabs_aria: 'Metrics sections',
    metrics_tab_overview: 'Overview',
    metrics_tab_rankings: 'Rankings',
    metrics_tab_queue: 'Queue',
    metrics_lb_subtab_usage: 'Chat usage',
    metrics_lb_subtab_success: 'Success cases',
    metrics_lb_subtab_proposals: 'Proposals',
    page_settings_title: 'Settings',
    page_settings_lead:
      'Manage permissions, users, and platform operational settings.',
    settings_tabs_aria: 'Settings sections',
    settings_tab_general: 'General',
    settings_tab_roles: 'Permissions',
    settings_tab_users: 'Users',
    settings_tab_agents: 'Agents',
    settings_tab_chat: 'Chat',
    settings_tab_salesforce: 'Salesforce',
    settings_tab_data: 'Data',
    settings_kg_limits_heading: 'Knowledge graph',
    settings_kg_limits_lead:
      'Set limits for the graph explorer: nodes per view, BFS depth, and density presets. Changes are saved in Supabase and apply to all users.',
    settings_kg_limits_busy_load: 'Loading graph limits…',
    settings_kg_limits_busy_save: 'Saving graph limits…',
    settings_kg_limits_save_btn: 'Save limits',
    settings_kg_limits_saved: 'Graph limits saved.',
    settings_kg_limits_error_load: 'Could not load graph limits.',
    settings_kg_limits_error_save: 'Could not save graph limits.',
    settings_kg_max_nodes_default: 'Default nodes',
    settings_kg_max_nodes_cap: 'Maximum node cap',
    settings_kg_hub_seed_limit: 'Hub seeds (global view)',
    settings_kg_depth_default: 'Default depth',
    settings_kg_depth_cap: 'Maximum depth',
    settings_kg_density_compact: 'Compact density (nodes)',
    settings_kg_density_normal: 'Normal density (nodes)',
    settings_kg_density_wide: 'Wide density (nodes)',
    err_kg_limits_invalid: 'Graph limits are invalid. Check the values and try again.',
    settings_users_subtab_visitors: 'Visitors',
    settings_users_subtab_requests: 'Requests',
    settings_users_subtab_bulk: 'Bulk access',
    settings_users_subtab_members: 'With role',
    role_config_sec_heading: 'Roles and permissions',
    role_config_sec_lead:
      'Define what each role can see and do. Capabilities are split into read-only and write: drag them to the matching zone in each role column.',
    role_config_roles_heading: 'Available roles',
    role_config_roles_lead:
      'Each column is a role with two zones: read on top and write below. You can create custom roles or delete those with no assigned users.',
    role_config_pool_heading: 'Available capabilities',
    role_config_pool_lead:
      'Drag each chip to the read or write zone of a role. To revoke, drag back to the panel or use × on the chip.',
    role_config_pool_read_heading: 'Read only',
    role_config_pool_read_lead:
      'View screens and data without modifying (Agents, catalog, metrics).',
    role_config_pool_write_heading: 'Write',
    role_config_pool_write_lead:
      'Create, edit, delete, or administer (agents, catalog, users, reset).',
    role_config_col_read_label: 'Read',
    role_config_col_write_label: 'Write',
    role_config_add_btn: 'New role',
    role_config_save_btn: 'Save permissions',
    role_config_delete_btn: 'Delete role',
    role_config_delete_confirm:
      'Delete role «{key}»? Only allowed when no users are assigned.',
    role_config_users_count: '{count} user(s)',
    role_config_system_badge: 'System',
    role_config_add_title: 'New role',
    role_config_add_key_ph: 'Key (e.g. auditor)',
    role_config_add_label_es_ph: 'Spanish name',
    role_config_add_label_en_ph: 'English name',
    role_config_add_confirm: 'Create role',
    role_config_busy_load: 'Loading roles…',
    role_config_busy_save: 'Saving permissions…',
    role_config_busy_add: 'Creating role…',
    role_config_busy_delete: 'Deleting role…',
    role_config_save_done: 'Permissions saved.',
    role_config_add_done: 'Role created.',
    role_config_delete_done: 'Role deleted.',
    role_config_err_generic: 'Could not complete the operation.',
    role_config_err_invalid: 'Invalid configuration.',
    role_config_err_empty: 'At least one role is required.',
    role_config_err_no_admin: 'The admin role must exist.',
    role_config_err_key: 'Invalid role key.',
    role_config_err_dup: 'A role with that key already exists.',
    role_config_err_not_found: 'Role not found.',
    role_config_err_admin_delete: 'The admin role cannot be deleted.',
    role_config_err_system: 'System roles cannot be deleted.',
    role_config_err_in_use: '{count} user(s) have this role. Reassign them before deleting.',
    role_config_drop_hint: 'Drop here',
    role_perm_view_agents: 'View Agents',
    role_perm_view_agents_desc: 'Read-only access to the Agents screen.',
    role_perm_manage_agents: 'Manage Agents',
    role_perm_manage_agents_desc: 'Create, edit, sync, and delete agents.',
    role_perm_view_catalog: 'View Contents',
    role_perm_view_catalog_desc:
      'Browse the catalog and open each item’s detail (read-only fields).',
    role_perm_view_tags: 'View Tags',
    role_perm_view_tags_desc:
      'Access the Tags screen: tag cloud and linked content.',
    role_perm_view_clients: 'View Clients',
    role_perm_view_clients_desc:
      'View the client list and read-only client records.',
    role_perm_view_knowledge_graph: 'View Knowledge Graph',
    role_perm_view_knowledge_graph_desc:
      'Explore catalog relationship graph (read-only; no rebuild or admin).',
    role_perm_write_catalog: 'Edit Contents and Clients',
    role_perm_write_catalog_desc:
      'Create, edit, and delete content and the client roster.',
    role_perm_view_metrics: 'View Metrics',
    role_perm_view_metrics_desc: 'Access to the metrics screen.',
    role_perm_reset_metrics: 'Reset data',
    role_perm_reset_metrics_desc: 'Bulk wipe of operational data (danger zone).',
    role_perm_manage_users: 'Manage users',
    role_perm_manage_users_desc: 'Assign roles to visitors and users.',
    role_perm_view_onboarding: 'View Onboarding',
    role_perm_view_onboarding_desc:
      'Access the Onboarding section and onboarding agent (chat and suggested prompts).',
    role_perm_view_proposal_building: 'View Proposal building',
    role_perm_view_proposal_building_desc:
      'Access proposal building, brief validation and chat with the proposals agent.',
    role_perm_manage_unanswered_queue: 'Manage unanswered queue',
    role_perm_manage_unanswered_queue_desc:
      'Assign and update status of unanswered questions in Metrics.',
    role_perm_sync_salesforce: 'Sync Salesforce',
    role_perm_sync_salesforce_desc:
      'Run Airlines Accounts roster sync and open the Salesforce tab in Settings.',
    err_onboarding_forbidden: 'You do not have permission to use the onboarding agent.',
    err_proposal_building_forbidden: 'You do not have permission to use Proposal building.',
    err_catalog_forbidden: 'You do not have permission to view Contents.',
    err_tags_forbidden: 'You do not have permission to view Tags.',
    err_clients_forbidden: 'You do not have permission to view Clients.',
    admin_users_sec_heading: 'Visitors and users',
    admin_users_sec_lead:
      'Visitors are accounts that signed in without a row in the roles table. Convert them by assigning a role; they become users with access based on that role.',
    admin_users_visitors_heading: 'Pending visitors',
    admin_users_visitors_lead:
      'People who signed in without a role. Pick a role and confirm to grant access.',
    admin_users_requests_heading: 'Access requests',
    admin_users_requests_lead:
      'Requests submitted by visitors. Assign the requested role or dismiss the request.',
    admin_users_col_requested_role: 'Requested role',
    admin_users_col_reason: 'Reason',
    admin_users_col_requested_at: 'Date',
    admin_users_no_requests: 'No pending requests.',
    admin_users_no_requests_filtered: 'No requests match this filter.',
    admin_users_requests_status_filter_lbl: 'Status',
    admin_users_requests_status_pending: 'Pending',
    admin_users_requests_status_all: 'All',
    admin_users_requests_status_approved: 'Approved',
    admin_users_requests_status_dismissed: 'Dismissed',
    admin_users_dismiss_request_btn: 'Dismiss',
    admin_users_dismiss_request_confirm: 'Dismiss this access request?',
    admin_users_dismiss_request_done: 'Request dismissed.',
    admin_users_busy_dismiss_request: 'Dismissing request…',
    admin_users_bulk_heading: 'Assign role to a list',
    admin_users_bulk_lead:
      'Paste a contact list (e.g. invitation format: Name <email@domain.com>, …). Only email addresses are used. The same role is assigned to everyone.',
    admin_users_bulk_role_label: 'Role to assign',
    admin_users_bulk_paste_label: 'People list',
    admin_users_bulk_paste_ph: 'E.g. Jane Doe <jane@company.com>, other@company.com, …',
    admin_users_bulk_preview_none: 'No email addresses detected in the text.',
    admin_users_bulk_preview_count: '{count} email address(es) detected.',
    admin_users_bulk_assign_btn: 'Grant access',
    admin_users_bulk_busy: 'Granting access ({done}/{total})…',
    admin_users_bulk_busy_parse: 'Parsing list…',
    admin_users_bulk_confirm:
      'Assign role «{role}» to {count} account(s)? This updates the roles table in Supabase.',
    admin_users_bulk_done:
      'Done: {success} of {total} assigned role «{role}».{failedPart}',
    admin_users_bulk_done_failed_part: ' {failed} failed (see details below).',
    admin_users_bulk_err_no_emails: 'No email addresses found in the pasted text.',
    admin_users_bulk_err_too_many: 'Too many emails (maximum {max} per operation).',
    admin_users_bulk_err_role: 'Choose a role before assigning.',
    admin_users_bulk_err_paste: 'Paste the people list first.',
    admin_users_roles_heading: 'Users with a role',
    admin_users_roles_lead:
      'Accounts with assigned permissions. You can change the role or remove it (they become visitors again).',
    admin_users_col_email: 'Email',
    admin_users_col_name: 'Name',
    admin_users_col_last_seen: 'Last seen',
    admin_users_col_visits: 'Visits',
    admin_users_col_role: 'Role',
    admin_users_col_updated: 'Updated',
    admin_users_col_actions: 'Actions',
    admin_users_search_ph: 'Search by email or name…',
    admin_users_assign_btn: 'Assign role',
    admin_users_update_btn: 'Save role',
    admin_users_remove_btn: 'Remove role',
    admin_users_remove_confirm:
      'Remove the role for {email}? They will be a visitor again until you assign a new one.',
    admin_users_no_visitors: 'No pending visitors.',
    admin_users_no_roles: 'No users with a role.',
    admin_users_busy_loading: 'Loading users…',
    admin_users_busy_assign: 'Assigning role…',
    admin_users_busy_update: 'Updating role…',
    admin_users_busy_remove: 'Removing role…',
    admin_users_assign_done: 'Role assigned.',
    admin_users_update_done: 'Role updated.',
    admin_users_remove_done: 'Role removed.',
    admin_users_err_email: 'Invalid email.',
    admin_users_err_role: 'Role not allowed.',
    admin_users_err_generic: 'Could not complete the operation.',
    admin_users_select_role: 'Choose role…',
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
    admin_reset_all_heading: 'Reset everything',
    admin_reset_all_lead:
      'Deletes all rows in operational database tables (content catalog, metrics, clients, and agent API catalog). Roles and script secrets are not modified. This cannot be undone.',
    admin_reset_all_btn: 'Reset everything',
    admin_reset_all_confirm:
      'You are about to delete ALL operational data in the database (contents, metrics, clients, API catalog). Roles will not be touched. Continue?',
    admin_reset_all_busy: 'Resetting data…',
    admin_reset_all_done: 'Operational data has been reset.',
    admin_reset_all_error: 'Full reset failed.',
    admin_embeddings_sec_heading: 'Semantic embeddings',
    admin_embeddings_sec_lead:
      'Rebuilds catalog vectors only (pgvector). For the full graph — embeddings, semantic links, and entities — use «Sync from Supabase» on the Knowledge Graph page.',
    admin_embeddings_rebuild_btn: 'Rebuild embeddings',
    admin_embeddings_busy: 'Rebuilding embeddings… {done}/{total}',
    admin_embeddings_done: 'Embeddings updated: {done} rows ({failed} failed).',
    admin_embeddings_error: 'Could not rebuild embeddings.',
    admin_sf_sync_sec_heading: 'Salesforce roster (Airlines Accounts)',
    admin_sf_sync_sec_lead:
      'Imports or updates from the configured spreadsheet (Sheet1): client master and Clients agent catalog. Automatic sync runs daily; use «Sync now» to force a run.',
    admin_sf_sync_schedule_lbl: 'Automatic schedule:',
    admin_sf_sync_schedule_value:
      'Every day at {hour}:00 (Apps Script project time zone).',
    admin_sf_sync_trigger_lbl: 'Trigger installed:',
    admin_sf_sync_trigger_on: 'Yes — daily sync active',
    admin_sf_sync_trigger_off: 'Not active',
    admin_sf_sync_last_lbl: 'Last sync:',
    admin_sf_sync_last_none: 'Never recorded',
    admin_sf_sync_last_line:
      '{at} — {status} ({accounts} accounts, {inactivated} inactivated)',
    admin_sf_sync_emb_pending_suffix: '· {pending} embeddings pending',
    admin_sf_sync_emb_continuation_scheduled: '(automatic indexing in progress)',
    admin_sf_sync_sheet_missing: 'SALESFORCE_ACCOUNTS_SPREADSHEET_ID is missing in Script Properties.',
    admin_sf_sync_activate_auto_btn: 'Enable automatic sync',
    admin_sf_sync_activate_auto_busy: 'Enabling automatic sync…',
    admin_sf_sync_activate_auto_done:
      'Automatic sync enabled (daily at {hour}:00, Apps Script project time zone).',
    admin_sf_sync_activate_auto_error: 'Could not enable automatic sync.',
    admin_sf_sync_btn: 'Sync now',
    admin_sf_sync_busy: 'Syncing Salesforce roster…',
    admin_sf_sync_busy_reading: 'Reading spreadsheet and saving accounts…',
    admin_sf_sync_busy_embeddings: 'Indexing semantic search… ({done}/{total})',
    admin_sf_sync_done:
      'Sync complete: {accounts} accounts, {inactivated} inactivated, {embeddings} indexed for search.',
    admin_sf_sync_done_with_failures:
      'Sync complete: {accounts} accounts, {inactivated} inactivated, {embeddings} indexed ({failed} failed).',
    admin_sf_sync_skipped: 'No changes detected in the spreadsheet (nothing updated).',
    admin_sf_sync_error: 'Could not sync the Salesforce roster.',
    admin_clients_dedupe_btn: 'Merge duplicate clients',
    admin_clients_dedupe_busy: 'Merging clients with the same name (accents)…',
    admin_clients_dedupe_done:
      'Merged {groups} group(s): {removed} duplicate record(s) removed, {contents} content item(s) updated.',
    admin_clients_dedupe_none: 'No accent-variant duplicates found in the client master.',
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
    metrics_unanswered_heading: 'Unanswered queue',
    metrics_unanswered_lead:
      'Operational backlog: assign an owner, flag missing content, or close when done. Resolved items leave this queue.',
    metrics_queue_filter_label: 'Status',
    metrics_queue_filter_all: 'All pending',
    metrics_queue_filter_open: 'Open',
    metrics_queue_filter_missing: 'Missing content',
    metrics_th_queue_status: 'Status',
    metrics_th_assigned: 'Assigned',
    metrics_th_actions: 'Actions',
    metrics_queue_status_open: 'Open',
    metrics_queue_status_missing: 'Missing content',
    metrics_queue_unassigned: 'Unassigned',
    metrics_queue_assign_ph: 'Assignee…',
    metrics_queue_btn_assign: 'Assign',
    metrics_queue_btn_missing: 'Missing content',
    metrics_queue_btn_resolve: 'Resolved',
    metrics_queue_btn_upload: 'Upload PDF',
    metrics_queue_busy_assign: 'Assigning…',
    metrics_queue_busy_status: 'Updating queue…',
    metrics_queue_done_assign: 'Query assigned.',
    metrics_queue_done_missing: 'Marked as missing content.',
    metrics_queue_done_resolve: 'Query resolved and removed from the queue.',
    metrics_queue_confirm_resolve: 'Mark as resolved? It will be removed from the operational queue.',
    metrics_queue_upload_denied: 'You need write access to Content to upload a PDF.',
    err_metrics_queue_only: 'Only admin or presales can manage the unanswered queue.',
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
    chat_feedback_up: 'Helpful',
    chat_feedback_down: 'Not helpful',
    chat_feedback_done: 'Thanks for your feedback',
    chat_feedback_error: 'Could not save feedback',
    chat_action_copy: 'Copy answer',
    chat_action_regenerate: 'Regenerate answer',
    chat_action_reformulate: 'Rephrase question',
    chat_copy_done: 'Answer copied to clipboard',
    chat_copy_error: 'Could not copy to clipboard',
    chat_regenerate_busy: 'Regenerating answer…',
    chat_regenerate_no_attachment: 'No attachment available to repeat document analysis.',
    chat_export_btn: 'Export',
    chat_export_markdown: 'Download Markdown',
    chat_export_pdf: 'Export conversation (PDF)',
    chat_export_pdf_turn: 'Export answer (PDF)',
    chat_export_busy: 'Generating PDF…',
    chat_export_empty: 'No messages to export',
    chat_export_done: 'PDF downloaded',
    chat_export_error: 'Could not generate PDF',
    chat_export_title: 'Aviators consultation',
    chat_export_turn_title: 'Aviators answer',
    chat_export_doc_subtitle: 'Generated on {date}',
    chat_export_footer: 'Document generated with Aviators',
    chat_action_export_pdf: 'Export PDF',
    err_chat_export_empty: 'No messages to export to PDF.',
    err_chat_export_pdf: 'Could not generate the PDF file. Please try again.',
    err_pdf_not_available: 'No PDF is available for this content.',
    err_pdf_drive: 'Could not read the file from Drive.',
    err_pdf_globant_onboarding:
      'No link is available for this onboarding document in Globant.',
    chat_history_untitled: 'Untitled',
    chat_history_heading: 'Previous conversations',
    chat_history_open_btn: 'History',
    chat_history_empty: 'No saved conversations',
    chat_history_loading: 'Loading history…',
    chat_history_delete: 'Delete conversation',
    chat_history_save_error: 'Could not save conversation',
    chat_history_load_error: 'Could not load conversation',
    chat_quick_prompts_label: 'Quick prompts',
    chat_quick_prompts_onboarding_label: 'Onboarding topics',
    chat_quick_prompts_globant_offering_label: 'Globant Offering topics',
    admin_quick_prompts_sec_heading: 'Quick prompts (Home)',
    admin_quick_prompts_sec_lead:
      'Suggested questions in the Home chat (orchestrator). Each prompt has Spanish and English text.',
    admin_globant_offering_quick_prompts_sec_heading: 'Quick prompts (Globant Offering)',
    admin_globant_offering_quick_prompts_sec_lead:
      'Suggestions for the Globant Offering chat. Shown when starting a new conversation with the proposals agent.',
    admin_globant_offering_quick_prompts_save_btn: 'Save Globant Offering prompts',
    admin_onboarding_quick_prompts_sec_heading: 'Quick prompts (Onboarding)',
    admin_onboarding_quick_prompts_sec_lead:
      'Suggested questions in the Onboarding section. Always answered by the onboarding agent from its indexed corpus.',
    admin_onboarding_quick_prompts_save_btn: 'Save onboarding prompts',
    admin_quick_prompts_save_btn: 'Save prompts',
    admin_quick_prompts_add_btn: 'Add prompt',
    admin_quick_prompts_save_busy: 'Saving prompts…',
    admin_quick_prompts_save_done: 'Prompts saved.',
    admin_quick_prompts_save_error: 'Could not save prompts.',
    admin_quick_prompts_lbl_es: 'Spanish',
    admin_quick_prompts_lbl_en: 'English',
    admin_quick_prompts_ph_es: 'Pregunta en español…',
    admin_quick_prompts_ph_en: 'Question in English…',
    admin_quick_prompts_delete_btn: 'Delete',
    err_quick_prompts_parse: 'Quick prompts format is invalid.',
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

/**
 * Stub mínimo embebido en doGet (~60 bytes). El pack completo se carga por RPC en partes.
 * Evita truncar ~120 KB de JSON en HtmlService (rompe labels en el cliente).
 * @return {Object<string, string>}
 */
function UiStrings_getClientEmbedStub_() {
  return {
    _locale: UiStrings_activeLocale_(),
    _load: 'rpc',
  };
}

/** @type {number} Partes del pack cliente (google.script.run ~60 KB por respuesta). */
var UI_STRINGS_CLIENT_PACK_PARTS_ = 3;

/**
 * Huella del pack cliente (cambia si se añaden claves o se editan textos).
 * @param {'es'|'en'} locale
 * @return {string}
 */
function UiStrings_clientPackRevision_(locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var full = UiStrings_getClientPackForLocale(loc);
  var json = JSON.stringify(full);
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    json,
    Utilities.Charset.UTF_8,
  );
  return Utilities.base64EncodeWebSafe(digest).slice(0, 22);
}

/**
 * @param {'es'|'en'} locale
 * @return {{ok:boolean,locale:string,parts:number,revision:string}}
 */
function UiStrings_getClientPackMeta_(locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  return {
    ok: true,
    locale: loc,
    parts: UI_STRINGS_CLIENT_PACK_PARTS_,
    revision: UiStrings_clientPackRevision_(loc),
  };
}

/**
 * Fragmento del pack i18n para el cliente (cada parte < ~50 KB serializado).
 * @param {'es'|'en'} locale
 * @param {number} partIndex
 * @return {Object<string, string>}
 */
function UiStrings_getClientPackPart_(locale, partIndex) {
  var loc = locale === 'en' ? 'en' : 'es';
  var full = UiStrings_getClientPackForLocale(loc);
  var keys = [];
  var k;
  for (k in full) {
    if (k !== '_locale' && Object.prototype.hasOwnProperty.call(full, k)) keys.push(k);
  }
  keys.sort();
  var parts = UI_STRINGS_CLIENT_PACK_PARTS_;
  var idx = Math.max(0, Math.min(parts - 1, Number(partIndex) || 0));
  var per = Math.ceil(keys.length / parts);
  var start = idx * per;
  var end = Math.min(keys.length, start + per);
  /** @type {Object<string, string>} */
  var out = { _locale: loc };
  var i;
  for (i = start; i < end; i++) {
    out[keys[i]] = full[keys[i]];
  }
  return out;
}

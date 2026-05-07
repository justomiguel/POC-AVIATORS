/**
 * @fileoverview Orquestador de agentes: clasifica la consulta y la deriva al agente(s) mas adecuado(s).
 */

var _ORCH_NO_CONTENT_SENTINEL = '[[NO_RELEVANT_CONTENT]]';
var _ORCH_PROFILE_DOC_CACHE = {};

/**
 * Verifica si un perfil RAG tiene documentos indexados.
 * Cachea el resultado en memoria para evitar llamadas repetidas.
 * @param {string} profileName
 * @return {boolean}
 */
function AgentOrchestrator_profileHasDocuments_(profileName) {
  if (!profileName) return false;
  if (_ORCH_PROFILE_DOC_CACHE.hasOwnProperty(profileName)) {
    return _ORCH_PROFILE_DOC_CACHE[profileName];
  }
  try {
    var p = PropertiesService.getScriptProperties();
    var apiKey = (p.getProperty('GLOBANT_AGENTS_API_KEY') || '').trim();
    var baseUrl = (p.getProperty('GLOBANT_AGENTS_BASE_URL') || '').trim();
    if (!apiKey) {
      _ORCH_PROFILE_DOC_CACHE[profileName] = true;
      return true;
    }
    var client = GlobantRagApiClient_create({
      apiKey: apiKey,
      baseUrl: baseUrl || undefined,
    });
    var result = client.listProfileDocuments(profileName, 0, 1);
    var hasDocuments = !!(result && result.documents && result.documents.length > 0);
    _ORCH_PROFILE_DOC_CACHE[profileName] = hasDocuments;
    console.log('[ORCH] Profile "' + profileName + '" hasDocuments=' + hasDocuments);
    return hasDocuments;
  } catch (e) {
    console.log('[ORCH] Error checking documents for profile "' + profileName + '": ' + e.message);
    _ORCH_PROFILE_DOC_CACHE[profileName] = true;
    return true;
  }
}

/**
 * Detecta cliente mencionado en la query y busca sus documentos en el catálogo.
 * Devuelve los documentos con sus resúmenes para usar como contexto directo.
 * @param {string} question
 * @return {{docs: Array<Object>, clientName: string, docCount: number}}
 */
function AgentOrchestrator_detectClientDocs_(question) {
  var q = String(question || '').toLowerCase();
  if (!q) return { docs: [], clientName: '', docCount: 0 };

  try {
    var clients = ClientsMaster_listForCombo();
    if (!clients || !clients.clients || !clients.clients.length) {
      console.log('[CLIENT-DETECT] No clients found in master');
      return { docs: [], clientName: '', docCount: 0 };
    }

    var detectedClient = null;
    for (var i = 0; i < clients.clients.length; i++) {
      var c = clients.clients[i];
      var name = String(c.name || '').trim();
      if (!name) continue;
      var nameLower = name.toLowerCase();
      if (q.indexOf(nameLower) >= 0) {
        detectedClient = name;
        break;
      }
      var words = nameLower.split(/\s+/);
      for (var w = 0; w < words.length; w++) {
        if (words[w].length >= 4 && q.indexOf(words[w]) >= 0) {
          detectedClient = name;
          break;
        }
      }
      if (detectedClient) break;
    }

    if (!detectedClient) {
      console.log('[CLIENT-DETECT] No client detected in query: "' + q + '"');
      return { docs: [], clientName: '', docCount: 0 };
    }

    console.log('[CLIENT-DETECT] Detected client: "' + detectedClient + '"');

    var catalogResult = ContentCatalog_findDocsByClient(detectedClient);
    var docs = catalogResult.docs || [];

    if (!docs.length) {
      console.log('[CLIENT-DETECT] No documents found for client: "' + detectedClient + '"');
      return { docs: [], clientName: detectedClient, docCount: 0 };
    }

    console.log('[CLIENT-DETECT] Found ' + docs.length + ' docs for "' + detectedClient + '"');

    return {
      docs: docs,
      clientName: detectedClient,
      docCount: docs.length,
    };
  } catch (e) {
    console.log('[CLIENT-DETECT] Error: ' + e.message);
  }
  return { docs: [], clientName: '', docCount: 0 };
}

/**
 * Construye el contexto de documentos para el LLM basado en los resúmenes del catálogo.
 * @param {Array<Object>} docs - documentos con title, summary, contentType, clientName, driveUrl
 * @return {string}
 */
function AgentOrchestrator_buildDocsContext_(docs) {
  if (!docs || !docs.length) return '';
  var parts = [];
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i];
    var docInfo = '--- DOCUMENTO ' + (i + 1) + ' ---\n';
    docInfo += 'Título: ' + (d.title || d.fileName || 'Sin título') + '\n';
    docInfo += 'Tipo: ' + (d.contentType || 'desconocido') + '\n';
    docInfo += 'Cliente: ' + (d.clientName || 'N/A') + '\n';
    if (d.driveUrl) {
      docInfo += 'Link: ' + d.driveUrl + '\n';
    }
    if (d.summary) {
      docInfo += 'Resumen:\n' + d.summary + '\n';
    }
    parts.push(docInfo);
  }
  return parts.join('\n');
}

/** Umbral de documentos para usar contexto directo vs RAG semántico */
var _ORCH_DIRECT_CONTEXT_MAX_DOCS = 5;

/**
 * Responde usando contexto directo de los resúmenes del catálogo (sin búsqueda RAG).
 * Incluye links a los documentos en Drive.
 * @param {string} question
 * @param {Object} agent - agente con id, profileName, systemPrompt
 * @param {Array<Object>} docs - documentos del catálogo con summary y driveUrl
 * @param {string} clientName - nombre del cliente detectado
 * @param {Array=} history
 * @return {{answer:string, model:string, agentName:string, references:Array, filterLabel:string, isUnanswered:boolean, unansweredCode:string}}
 */
function AgentOrchestrator_answerWithDocContext_(question, agent, docs, clientName, history) {
  var q = String(question || '').trim();
  var docsContext = AgentOrchestrator_buildDocsContext_(docs);

  var systemPrompt = agent.systemPrompt || '';
  systemPrompt += '\n' + AgentOrchestrator_languageInstruction_(q);
  systemPrompt += '\n' + AgentOrchestrator_buildRoleRestriction_();
  systemPrompt += '\n\n[CONTEXTO DE DOCUMENTOS DEL CLIENTE "' + clientName + '"]\n' + docsContext + '\n[/CONTEXTO DE DOCUMENTOS]\n';
  systemPrompt += '\nINSTRUCCIONES DE RESPUESTA:';
  systemPrompt += '\n1. Usa ÚNICAMENTE la información de los documentos proporcionados arriba.';
  systemPrompt += '\n2. Formula una respuesta clara y bien estructurada.';
  systemPrompt += '\n3. Si la información no está en el contexto, indica que no tienes datos disponibles.';

  var roleTag = AgentOrchestrator_resolveUserRoleTag_();
  var rolePrefix = '[ROL_USUARIO: ' + roleTag + ']\n';

  var histArr = Array.isArray(history) ? history : [];
  var userMessage = rolePrefix + q;
  if (histArr.length > 0) {
    var histLines = [];
    for (var h = 0; h < histArr.length; h++) {
      var entry = histArr[h];
      if (entry && entry.role && entry.content) {
        histLines.push('[' + entry.role.toUpperCase() + ']\n' + entry.content);
      }
    }
    if (histLines.length > 0) {
      userMessage = rolePrefix + '[CONVERSATION HISTORY]\n' + histLines.join('\n\n') + '\n[/CONVERSATION HISTORY]\n\n[CURRENT QUESTION]\n' + q + '\n[/CURRENT QUESTION]';
    }
  }

  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty('GLOBANT_AGENTS_API_KEY') || '').trim();
  var baseUrl = (p.getProperty('GLOBANT_AGENTS_BASE_URL') || '').trim();

  var client = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  console.log('[ORCH] Using direct context for client "' + clientName + '" with ' + docs.length + ' docs');

  var chatResult = client.chatSimple(systemPrompt, userMessage);

  var answer = chatResult.text || '';
  var isUnanswered = AgentOrchestrator_isEmptyResponse_(answer);
  answer = AgentOrchestrator_sanitizeAnswer_(answer);

  var rawA = JSON.stringify(chatResult.parsed, null, 2);
  if (rawA.length > 6000) {
    rawA = rawA.substring(0, 6000) + '...(truncado)';
  }

  var filterLabel = UiStrings_fmt_('meta_orchestrator_selected_agent', {
    agent: agent.profileName,
    confidence: 'routed',
  });
  filterLabel += ' | ' + UiStrings_fmt_('meta_filter_direct_context', {
    client: clientName,
    count: docs.length,
  });

  var references = [];
  for (var i = 0; i < docs.length; i++) {
    references.push({
      title: docs[i].title || docs[i].fileName || 'Documento',
      contentType: docs[i].contentType || '',
      clientName: docs[i].clientName || '',
      url: docs[i].driveUrl || '',
      matched: true,
    });
  }

  return {
    answer: answer,
    model: 'globant-chat',
    providerLabel: UiStrings_t(UiStrings_activeLocale_(), 'meta_provider_globant_chat'),
    rawJson: rawA,
    agentName: agent.profileName,
    references: references,
    filterLabel: filterLabel,
    isUnanswered: isUnanswered,
    unansweredCode: isUnanswered ? 'NO_RELEVANT_CONTENT' : '',
  };
}

/**
 * Paso 1: clasifica la consulta y devuelve el/los agente(s) elegido(s).
 * @param {string} question
 * @return {{ agents: Array<{id:string, name:string}>, confidence: string, reason: string, isSelf: boolean }}
 */
function AgentOrchestrator_routeOnly(question) {
  AgentOrchestrator_requireGlobant_();

  var q = AgentOrchestrator_requireQuestion_(question);

  var ctx = AgentOrchestrator_loadContext_();
  var route = AgentOrchestrator_route_(q, ctx.orchestrator, ctx.candidates);

  var agentList = route.agents || [route.agentId];
  var resolved = [];
  for (var i = 0; i < agentList.length; i++) {
    var ag = ctx.byId[agentList[i]];
    if (ag) resolved.push({ id: ag.id, name: ag.profileName });
  }
  if (!resolved.length) {
    resolved.push({ id: ctx.orchestrator.id, name: ctx.orchestrator.profileName });
  }

  var isSelf = resolved.length === 1 && resolved[0].id === _ADMIN_AGENT_ID_ORCHESTRATOR;

  return {
    agents: resolved,
    confidence: route.confidence || 'low',
    reason: route.reason || '',
    isSelf: isSelf,
  };
}

/**
 * Paso 2: responde la consulta usando un agente especifico (por id).
 * Si detecta cliente con pocos docs, usa contexto directo; si no, RAG semántico.
 * @param {string} question
 * @param {string} agentId
 * @return {{ answer: string, model: string, providerLabel: string, rawJson: string, filterLabel: string, agentName: string, references?: Array<Object> }}
 */
function AgentOrchestrator_answerWith(question, agentId, history) {
  AgentOrchestrator_requireGlobant_();

  var q = AgentOrchestrator_requireQuestion_(question);

  var ctx = AgentOrchestrator_loadContext_();
  var chosen = ctx.byId[agentId] || ctx.orchestrator;

  if (chosen.id !== _ADMIN_AGENT_ID_ORCHESTRATOR &&
      !AgentOrchestrator_profileHasDocuments_(chosen.profileName)) {
    console.log('[ORCH] Agent "' + chosen.id + '" has no indexed documents - returning empty response');
    return {
      answer: UiStrings_t(UiStrings_activeLocale_(), 'chat_no_relevant_content'),
      model: '',
      agentName: chosen.profileName,
      references: [],
      isUnanswered: true,
      unansweredCode: 'NO_INDEXED_DOCUMENTS',
      filterLabel: UiStrings_fmt_('meta_orchestrator_selected_agent', {
        agent: chosen.profileName,
        confidence: 'routed',
      }),
    };
  }

  var clientDetection = AgentOrchestrator_detectClientDocs_(q);

  if (clientDetection.clientName &&
      clientDetection.docCount > 0 &&
      clientDetection.docCount <= _ORCH_DIRECT_CONTEXT_MAX_DOCS &&
      chosen.id !== _ADMIN_AGENT_ID_ORCHESTRATOR) {
    console.log('[ORCH] Using direct context for "' + clientDetection.clientName + '" (' + clientDetection.docCount + ' docs)');
    return AgentOrchestrator_answerWithDocContext_(q, chosen, clientDetection.docs, clientDetection.clientName, history);
  }

  var systemPrompt = chosen.systemPrompt;
  if (chosen.id === _ADMIN_AGENT_ID_ORCHESTRATOR) {
    systemPrompt = AgentOrchestrator_buildSelfAnswerPrompt_();
  }
  systemPrompt += '\n' + AgentOrchestrator_languageInstruction_(q);
  systemPrompt += '\n' + AgentOrchestrator_buildRoleRestriction_();

  var roleTag = AgentOrchestrator_resolveUserRoleTag_();
  var rolePrefix = '[ROL_USUARIO: ' + roleTag + ']\n';

  var histArr = Array.isArray(history) ? history : [];
  var promptWithHistory = rolePrefix + q;
  if (histArr.length > 0) {
    var histLines = [];
    for (var h = 0; h < histArr.length; h++) {
      var entry = histArr[h];
      if (entry && entry.role && entry.content) {
        histLines.push('[' + entry.role.toUpperCase() + ']\n' + entry.content);
      }
    }
    if (histLines.length > 0) {
      promptWithHistory = rolePrefix + '[CONVERSATION HISTORY]\n' + histLines.join('\n\n') + '\n[/CONVERSATION HISTORY]\n\n[CURRENT QUESTION]\n' + q + '\n[/CURRENT QUESTION]';
    }
  }

  var answer = LlmProviderGlobant_consultPromptWithAgent(
    chosen.profileName,
    promptWithHistory,
    systemPrompt,
    [],
  );

  var isUnanswered = AgentOrchestrator_isEmptyResponse_(answer.answer);
  answer.answer = AgentOrchestrator_sanitizeAnswer_(answer.answer);
  answer.isUnanswered = isUnanswered;
  answer.unansweredCode = isUnanswered ? 'NO_RELEVANT_CONTENT' : '';
  var filterLabel = UiStrings_fmt_('meta_orchestrator_selected_agent', {
    agent: chosen.profileName,
    confidence: 'routed',
  });
  answer.filterLabel = filterLabel;
  answer.agentName = chosen.profileName;
  answer.references = AgentOrchestrator_matchCatalogReferences_(
    answer.answer,
    [AgentOrchestrator_mapAgentIdToContentType_(chosen.id)],
  );
  return answer;
}

/**
 * Consulta multiples agentes y devuelve solo los que tengan contenido relevante.
 * Si detecta cliente con pocos docs, usa contexto directo; si no, RAG semántico.
 * @param {string} question
 * @param {Array<string>} agentIds
 * @return {Array<{answer:string, agentName:string, model:string, providerLabel:string, rawJson:string, filterLabel:string, references?:Array<Object>}>}
 */
function AgentOrchestrator_answerMulti(question, agentIds, history) {
  AgentOrchestrator_requireGlobant_();
  var q = AgentOrchestrator_requireQuestion_(question);
  var ctx = AgentOrchestrator_loadContext_();
  var langInstr = AgentOrchestrator_languageInstruction_(q);

  var roleTag = AgentOrchestrator_resolveUserRoleTag_();
  var rolePrefix = '[ROL_USUARIO: ' + roleTag + ']\n';

  var histArr = Array.isArray(history) ? history : [];
  var promptWithHistory = rolePrefix + q;
  if (histArr.length > 0) {
    var histLines = [];
    for (var h = 0; h < histArr.length; h++) {
      var entry = histArr[h];
      if (entry && entry.role && entry.content) {
        histLines.push('[' + entry.role.toUpperCase() + ']\n' + entry.content);
      }
    }
    if (histLines.length > 0) {
      promptWithHistory = rolePrefix + '[CONVERSATION HISTORY]\n' + histLines.join('\n\n') + '\n[/CONVERSATION HISTORY]\n\n[CURRENT QUESTION]\n' + q + '\n[/CURRENT QUESTION]';
    }
  }

  var clientDetection = AgentOrchestrator_detectClientDocs_(q);
  var useDirectContext = clientDetection.clientName &&
      clientDetection.docCount > 0 &&
      clientDetection.docCount <= _ORCH_DIRECT_CONTEXT_MAX_DOCS;

  var results = [];
  for (var i = 0; i < agentIds.length; i++) {
    var chosen = ctx.byId[agentIds[i]];
    if (!chosen) continue;

    if (chosen.id !== _ADMIN_AGENT_ID_ORCHESTRATOR &&
        !AgentOrchestrator_profileHasDocuments_(chosen.profileName)) {
      console.log('[ORCH] Skipping agent "' + chosen.id + '" - no indexed documents');
      continue;
    }

    try {
      var answer;

      if (useDirectContext && chosen.id !== _ADMIN_AGENT_ID_ORCHESTRATOR) {
        console.log('[ORCH-MULTI] Using direct context for agent "' + chosen.id + '"');
        answer = AgentOrchestrator_answerWithDocContext_(q, chosen, clientDetection.docs, clientDetection.clientName, history);
      } else {
        var systemPrompt = chosen.systemPrompt;
        if (chosen.id === _ADMIN_AGENT_ID_ORCHESTRATOR) {
          systemPrompt = AgentOrchestrator_buildSelfAnswerPrompt_();
        }
        systemPrompt += '\n' + langInstr;
        systemPrompt += '\n' + AgentOrchestrator_buildRoleRestriction_();

        answer = LlmProviderGlobant_consultPromptWithAgent(
          chosen.profileName,
          promptWithHistory,
          systemPrompt,
          [],
        );
        answer.agentName = chosen.profileName;
        var filterLabel = UiStrings_fmt_('meta_orchestrator_selected_agent', {
          agent: chosen.profileName,
          confidence: 'routed',
        });
        answer.filterLabel = filterLabel;
      }

      if (!AgentOrchestrator_isEmptyResponse_(answer.answer)) {
        answer.answer = AgentOrchestrator_sanitizeAnswer_(answer.answer);
        if (!answer.references || !answer.references.length) {
          answer.references = AgentOrchestrator_matchCatalogReferences_(
            answer.answer,
            [AgentOrchestrator_mapAgentIdToContentType_(chosen.id)],
          );
        }
        results.push(answer);
      }
    } catch (e) {
      console.log('[ORCH-MULTI] Error with agent "' + chosen.id + '": ' + e.message);
    }
  }

  return results;
}

/**
 * @param {string} text
 * @return {boolean}
 */
function AgentOrchestrator_isEmptyResponse_(text) {
  var t = ('' + (text || '')).trim();
  if (!t) return true;
  if (t.indexOf(_ORCH_NO_CONTENT_SENTINEL) >= 0) return true;
  return false;
}

/**
 * Reemplaza el sentinel interno por un mensaje amigable.
 * @param {string} text
 * @return {string}
 */
function AgentOrchestrator_sanitizeAnswer_(text) {
  if (!text) return '';
  var t = ('' + text).trim();
  if (t.indexOf(_ORCH_NO_CONTENT_SENTINEL) >= 0) {
    return UiStrings_t(UiStrings_activeLocale_(), 'chat_no_relevant_content');
  }
  return t;
}

/**
 * @param {string} agentId
 * @return {'proposal'|'success_case'|'client'|''}
 */
function AgentOrchestrator_mapAgentIdToContentType_(agentId) {
  if (agentId === _ADMIN_AGENT_ID_PROPOSALS) return 'proposal';
  if (agentId === _ADMIN_AGENT_ID_SUCCESS_CASES) return 'success_case';
  if (agentId === _ADMIN_AGENT_ID_CLIENTS) return 'client';
  if (agentId === _ADMIN_AGENT_ID_ONBOARDING) return 'onboarding';
  return '';
}

/** @type {Object<string,string>} */
var _ORCH_DRIVE_URL_BY_FILE_NAME = {};

/**
 * @param {string} fileName
 * @return {string}
 */
function AgentOrchestrator_resolveDriveUrlByFileName_(fileName) {
  var key = ('' + (fileName || '')).trim();
  if (!key) return '';
  if (_ORCH_DRIVE_URL_BY_FILE_NAME[key] != null) return _ORCH_DRIVE_URL_BY_FILE_NAME[key];
  try {
    var escaped = key.replace(/'/g, "\\'");
    var q =
      "title = '" +
      escaped +
      "' and '" +
      CATALOG_ROOT_FOLDER_ID +
      "' in parents and trashed = false";
    var it = DriveApp.searchFiles(q);
    if (it.hasNext()) {
      var f = it.next();
      var url = String(f.getUrl() || '');
      _ORCH_DRIVE_URL_BY_FILE_NAME[key] = url;
      return url;
    }
  } catch (e) {}
  _ORCH_DRIVE_URL_BY_FILE_NAME[key] = '';
  return '';
}

/**
 * @param {string} s
 * @return {string}
 */
function AgentOrchestrator_normText_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} answerText
 * @param {Array<string>} preferredTypes
 * @return {Array<{contentId:string,title:string,contentType:string,url:string,fileName:string,driveFileId:string}>}
 */
function AgentOrchestrator_matchCatalogReferences_(answerText, preferredTypes) {
  var text = AgentOrchestrator_normText_(answerText);
  if (!text) return [];

  var typeSet = {};
  var i;
  for (i = 0; i < (preferredTypes || []).length; i++) {
    var t = String(preferredTypes[i] || '').trim();
    if (t) typeSet[t] = true;
  }

  /** @type {Array<Object>} */
  var items = [];
  try {
    var wanted = Object.keys(typeSet);
    if (!wanted.length) {
      wanted = ['proposal', 'success_case', 'client'];
    }
    for (i = 0; i < wanted.length; i++) {
      var list = ContentCatalog_list({ contentType: wanted[i], skip: 0, limit: 300 });
      if (list && list.items && list.items.length) {
        items = items.concat(list.items);
      }
    }
  } catch (e) {
    return [];
  }

  /** @type {Array<{score:number,ref:{contentId:string,title:string,contentType:string,url:string,fileName:string,driveFileId:string}}>} */
  var scored = [];
  for (i = 0; i < items.length; i++) {
    var c = items[i] && items[i].common ? items[i].common : {};
    var title = String(c.title || '').trim();
    var client = String(c.client_name || '').trim();
    var docId = String(c.globant_document_id || '').trim();
    var fileName = String(c.file_name || '').trim();
    var driveFileId = String(c.drive_file_id || '').trim();
    var driveFileUrl = String(c.drive_file_url || '').trim();
    var cType = String(c.content_type || '').trim();
    var cId = String(c.content_id || '').trim();
    if (!cId) continue;

    var score = 0;
    var nTitle = AgentOrchestrator_normText_(title);
    var nClient = AgentOrchestrator_normText_(client);
    if (nTitle && text.indexOf(nTitle) >= 0) score += 5;
    if (nClient && text.indexOf(nClient) >= 0) score += 2;
    if (docId && text.indexOf(AgentOrchestrator_normText_(docId)) >= 0) score += 4;
    if (score <= 0) continue;

    var url = driveFileUrl || AgentOrchestrator_resolveDriveUrlByFileName_(fileName);
    scored.push({
      score: score,
      ref: {
        contentId: cId,
        title: title || cId,
        contentType: cType,
        url: url,
        fileName: fileName,
        driveFileId: driveFileId,
      },
    });
  }

  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.ref.title || '').localeCompare(String(b.ref.title || ''));
  });

  var out = [];
  var seen = {};
  for (i = 0; i < scored.length && out.length < 5; i++) {
    var key = scored[i].ref.contentId;
    if (seen[key]) continue;
    seen[key] = true;
    out.push(scored[i].ref);
  }
  return out;
}

/**
 * Legacy: rutea + responde en un solo paso (backward-compat).
 * @param {string} question
 * @return {{ answer: string, model: string, providerLabel: string, rawJson: string, filterLabel: string }}
 */
function AgentOrchestrator_answer(question) {
  var route = AgentOrchestrator_routeOnly(question);
  var ids = [];
  for (var i = 0; i < route.agents.length; i++) ids.push(route.agents[i].id);
  if (ids.length === 1) {
    return AgentOrchestrator_answerWith(question, ids[0]);
  }
  var multi = AgentOrchestrator_answerMulti(question, ids);
  if (multi.length === 0) {
    return AgentOrchestrator_answerWith(question, _ADMIN_AGENT_ID_ORCHESTRATOR);
  }
  return multi[0];
}

/**
 * Devuelve instrucción de idioma para que el LLM responda en el mismo idioma de la pregunta.
 * @return {string}
 */
function AgentOrchestrator_languageInstruction_() {
  return 'REGLA DE IDIOMA: Respondé SIEMPRE en el mismo idioma en que el usuario te escribió. Si preguntó en español, respondé en español. Si preguntó en inglés, respondé en inglés. No mezcles idiomas.';
}

/** Cache de métricas para no recalcular en cada consulta */
var _ORCH_METRICS_CACHE = null;
var _ORCH_METRICS_CACHE_TS = 0;
var _ORCH_METRICS_TTL_MS = 5 * 60 * 1000;

/**
 * Obtiene métricas del catálogo de contenidos para incluir en el prompt.
 * @return {{successCases:number, proposals:number, clients:number, onboarding:number, total:number, clientNames:Array<string>}}
 */
function AgentOrchestrator_getMetrics_() {
  var now = Date.now();
  if (_ORCH_METRICS_CACHE && (now - _ORCH_METRICS_CACHE_TS) < _ORCH_METRICS_TTL_MS) {
    return _ORCH_METRICS_CACHE;
  }
  
  try {
    var res = ContentCatalog_list({ skip: 0, limit: 0, skipReconcile: true });
    var items = (res && res.items) || [];
    
    var successCases = 0;
    var proposals = 0;
    var clients = 0;
    var onboarding = 0;
    var clientNamesSet = {};
    
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var cm = it && it.common ? it.common : {};
      var ct = String(cm.content_type || '').toLowerCase();
      
      if (ct === 'success_case') successCases++;
      else if (ct === 'proposal') proposals++;
      else if (ct === 'client') clients++;
      else if (ct === 'onboarding') onboarding++;
      
      var clientName = String(cm.client_name || '').trim();
      if (clientName) clientNamesSet[clientName] = true;
    }
    
    var clientNames = Object.keys(clientNamesSet);
    
    _ORCH_METRICS_CACHE = {
      successCases: successCases,
      proposals: proposals,
      clients: clients,
      onboarding: onboarding,
      total: items.length,
      clientNames: clientNames,
    };
    _ORCH_METRICS_CACHE_TS = now;
    
    return _ORCH_METRICS_CACHE;
  } catch (e) {
    console.log('[ORCH] Error getting metrics: ' + e.message);
    return { successCases: 0, proposals: 0, clients: 0, onboarding: 0, total: 0, clientNames: [] };
  }
}

/**
 * Construye el contexto de métricas para agregar al prompt.
 * @return {string}
 */
function AgentOrchestrator_buildMetricsContext_() {
  var m = AgentOrchestrator_getMetrics_();
  var ctx = '\n[MÉTRICAS DEL REPOSITORIO AVIATORS]\n';
  ctx += 'Total de documentos indexados: ' + m.total + '\n';
  ctx += '- Casos de éxito: ' + m.successCases + '\n';
  ctx += '- Propuestas: ' + m.proposals + '\n';
  ctx += '- Clientes: ' + m.clients + '\n';
  ctx += '- Onboarding: ' + m.onboarding + '\n';
  ctx += 'Clientes con documentación: ' + m.clientNames.length + '\n';
  if (m.clientNames.length > 0 && m.clientNames.length <= 30) {
    ctx += 'Lista de clientes: ' + m.clientNames.join(', ') + '\n';
  }
  ctx += '[/MÉTRICAS DEL REPOSITORIO]\n';
  return ctx;
}

/* ── helpers internos ── */

function AgentOrchestrator_requireGlobant_() {
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_direct'),
    );
  }
}

/** @param {string} q @return {string} */
function AgentOrchestrator_requireQuestion_(q) {
  var trimmed = ('' + (q || '')).trim();
  if (!trimmed) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_prompt_required'),
    );
  }
  return trimmed;
}

/**
 * @return {{ orchestrator: Object, candidates: Array, byId: Object }}
 */
function AgentOrchestrator_loadContext_() {
  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var agents = AgentOrchestrator_normalizeAgents_(reg.agents || []);

  var byId = {};
  var i;
  for (i = 0; i < agents.length; i++) {
    byId[agents[i].id] = agents[i];
  }

  var orchestrator = byId[_ADMIN_AGENT_ID_ORCHESTRATOR];
  if (!orchestrator) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_orchestrator_missing'),
    );
  }

  return {
    orchestrator: orchestrator,
    candidates: AgentOrchestrator_buildCandidates_(byId),
    byId: byId,
  };
}

/**
 * @param {Array<Object>} raw
 * @return {Array<{id:string,profileName:string,systemPrompt:string}>}
 */
function AgentOrchestrator_normalizeAgents_(raw) {
  var out = [];
  var i;
  for (i = 0; i < raw.length; i++) {
    var a = raw[i];
    if (!a || typeof a !== 'object') continue;
    var id = String(a.id || '').trim();
    var profileName = String(a.profileName || '').trim();
    if (!id || !profileName) continue;
    out.push({
      id: id,
      profileName: profileName,
      systemPrompt: String(a.systemPrompt || ''),
    });
  }
  return out;
}

/**
 * @param {Object<string,{id:string,profileName:string,systemPrompt:string}>} byId
 * @return {Array<{id:string,profileName:string,systemPrompt:string}>}
 */
function AgentOrchestrator_buildCandidates_(byId) {
  var wanted = [
    _ADMIN_AGENT_ID_SUCCESS_CASES,
    _ADMIN_AGENT_ID_PROPOSALS,
    _ADMIN_AGENT_ID_CLIENTS,
    _ADMIN_AGENT_ID_ORCHESTRATOR,
  ];
  var out = [];
  var i;
  for (i = 0; i < wanted.length; i++) {
    if (byId[wanted[i]]) out.push(byId[wanted[i]]);
  }
  return out;
}

/**
 * @param {string} question
 * @param {{id:string,profileName:string,systemPrompt:string}} orchestrator
 * @param {Array<{id:string,profileName:string,systemPrompt:string}>} candidates
 * @return {{ agents: Array<string>, agentId: string, confidence: 'high'|'medium'|'low', reason: string }}
 */
function AgentOrchestrator_route_(question, orchestrator, candidates) {
  var prompt = AgentOrchestrator_buildRoutingPrompt_(
    question,
    orchestrator,
    candidates,
  );
  var routeRaw = LlmProviderGlobant_consultPromptWithAgent(
    orchestrator.profileName,
    prompt,
    orchestrator.systemPrompt,
  );
  var route = AgentOrchestrator_tryParseRoutingJson_(routeRaw.answer);
  if (!route) {
    return AgentOrchestrator_keywordFallback_(question, candidates);
  }

  var validIds = {};
  var i;
  for (i = 0; i < candidates.length; i++) validIds[candidates[i].id] = true;

  var agentsList = route.agents || (route.agentId ? [route.agentId] : []);
  var validAgents = [];
  for (i = 0; i < agentsList.length; i++) {
    if (validIds[agentsList[i]]) validAgents.push(agentsList[i]);
  }

  if (!validAgents.length) {
    return AgentOrchestrator_keywordFallback_(question, candidates);
  }

  route.agents = validAgents;
  route.agentId = validAgents[0];
  return route;
}

/**
 * @param {string} question
 * @param {{id:string,profileName:string,systemPrompt:string}} orchestrator
 * @param {Array<{id:string,profileName:string,systemPrompt:string}>} candidates
 * @return {string}
 */
function AgentOrchestrator_buildRoutingPrompt_(question, orchestrator, candidates) {
  var lines = [];
  lines.push(
    'Clasifica la siguiente consulta y responde SOLO con JSON valido.',
  );
  lines.push('Agentes disponibles:');
  var i;
  for (i = 0; i < candidates.length; i++) {
    lines.push(
      '- ' +
        candidates[i].id +
        ' (profile=' +
        candidates[i].profileName +
        ')',
    );
  }
  lines.push('');
  lines.push('FORMATO REQUERIDO (JSON estricto, sin texto extra):');
  lines.push('{"agents":["agent_id_1","agent_id_2"],"confidence":"high|medium|low","reason":"frase corta"}');
  lines.push('');
  lines.push('REGLAS:');
  lines.push('- "agents" es un ARRAY. Puede tener 1 o mas agentes.');
  lines.push('- Si la consulta podria ser respondida por varios agentes, incluye TODOS los relevantes.');
  lines.push('- Si es un pedido explicito para un solo agente, incluye solo ese.');
  lines.push(
    '- "orchestrator" para saludos o charla breve, o cuando la consulta sea sobre generalidades del studio Aviators / Aviation Studio que correspondan al corpus del orquestador (sin pedir success cases, propuestas comerciales ni nómina de clientes).',
  );
  lines.push('');
  lines.push('Consulta del usuario:');
  lines.push(question);
  return lines.join('\n');
}

/**
 * Resuelve el rol del usuario actual para inyectarlo en cada prompt.
 * @return {string} e.g. "admin", "presales", "client partner", "visitante"
 */
function AgentOrchestrator_resolveUserRoleTag_() {
  try {
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return 'visitante';
    var rec = RoleDirectory_lookupRole(email);
    if (!rec || !rec.label) return 'visitante';
    return rec.label.trim().toLowerCase();
  } catch (e) {
    return 'visitante';
  }
}

/**
 * Bloque compacto de restricciones por rol, inyectado en todo system prompt.
 * @return {string}
 */
function AgentOrchestrator_buildRoleRestriction_() {
  return [
    '',
    '## Restricciones por rol',
    'El usuario envía su rol en cada mensaje como [ROL_USUARIO: <rol>].',
    '- Si el rol es "visitante": compartí solo success cases e información general de Globant / Aviation Studio. NO reveles clientes, propuestas ni datos internos de proyectos.',
    '- Otros roles (admin, presales, client partner, etc.): acceso completo.',
    'No respondas preguntas fuera del alcance de Globant / Aviation Studio.',
  ].join('\n');
}

/**
 * Prompt del orquestador en modo "respuesta final al usuario".
 * Se separa del prompt de ruteo para evitar fugas de JSON al chat.
 * @return {string}
 */
function AgentOrchestrator_buildSelfAnswerPrompt_() {
  var lines = [];

  lines.push('Sos el Orquestador de Aviators, el asistente inteligente del Aviation Studio de Globant.');
  lines.push('Respondés DIRECTAMENTE al usuario final. NO clasifiques, NO enrutes, NO muestres decisiones internas.');
  lines.push('Regla estricta: NO respondas en JSON ni bloques estructurados de routing.');
  lines.push('');

  lines.push('## Alcance temático');
  lines.push('Solo respondés preguntas relacionadas con Globant, el Aviation Studio, aerolíneas, y los contenidos de la plataforma Aviators (success cases, propuestas, clientes, FAQ).');
  lines.push('Si la pregunta está completamente fuera de ese alcance, decliná amablemente y sugerí reformular.');
  lines.push('');

  lines.push('## Base de conocimiento del Orquestador');
  lines.push('Tu perfil tiene documentos indexados (RAG) sobre el studio: propuesta de valor, organización, metodologías, herramientas, FAQs, cultura de Aviators, etc.');
  lines.push('Para preguntas sobre generalidades del studio Aviators / Aviation Studio (qué es la plataforma, cómo trabajan, servicios, gobierno, onboarding interno, mensajes institucionales), priorizá SIEMPRE el contenido recuperado de esa base.');
  lines.push('Si el material recuperado no alcanza para responder con seguridad, decilo con claridad y no completes con datos específicos del studio inventados o no respaldados.');
  lines.push('Cuando cites prácticas o claims del studio, atenete al texto de los documentos recuperados; si hay ambigüedad, presentalo como tal.');
  lines.push('');

  lines.push('## Restricciones por rol del usuario');
  lines.push('El rol del usuario se indica en cada mensaje con la etiqueta [ROL_USUARIO]. Las restricciones son:');
  lines.push('- **visitante**: solo puede acceder a información de **success cases** y preguntas generales sobre Globant / Aviation Studio. NO compartas datos de clientes, propuestas, ni información interna de proyectos.');
  lines.push('- **Cualquier otro rol** (admin, presales, client partner, etc.): acceso completo a toda la información disponible (success cases, propuestas, clientes, proyectos).');
  lines.push('Si el visitante pregunta por clientes o propuestas, respondé amablemente que esa información requiere un rol asignado y que puede pedir acceso a su administrador de Aviators.');
  lines.push('');

  lines.push('## Estilo');
  lines.push('Si el usuario saluda o hace charla breve, respondé cordialmente y en pocas líneas.');
  lines.push('Si la consulta es general/ambigua, respondé con claridad.');
  lines.push('No inventes datos no verificados.');
  lines.push('');

  lines.push(AgentOrchestrator_buildMetricsContext_());

  return lines.join('\n');
}

/**
 * @param {string} text
 * @return {{ agents: Array<string>, agentId: string, confidence: 'high'|'medium'|'low', reason: string }|null}
 */
function AgentOrchestrator_tryParseRoutingJson_(text) {
  var raw = ('' + (text || '')).trim();
  if (!raw) return null;
  var start = raw.indexOf('{');
  var end = raw.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  var body = raw.substring(start, end + 1);
  try {
    var o = JSON.parse(body);
    var conf = String(o.confidence || '').trim().toLowerCase();
    if (conf !== 'high' && conf !== 'medium') conf = 'low';

    var agents = [];
    if (Array.isArray(o.agents)) {
      for (var i = 0; i < o.agents.length; i++) {
        var a = String(o.agents[i] || '').trim();
        if (a) agents.push(a);
      }
    }
    if (!agents.length) {
      var id = String(o.agentId || '').trim();
      if (!id) return null;
      agents.push(id);
    }

    return {
      agents: agents,
      agentId: agents[0],
      confidence: /** @type {'high'|'medium'|'low'} */ (conf),
      reason: String(o.reason || ''),
    };
  } catch (e) {
    return null;
  }
}

/**
 * @param {string} question
 * @param {Array<{id:string}>} candidates
 * @return {{ agents: Array<string>, agentId: string, confidence: 'high'|'medium'|'low', reason: string }}
 */
function AgentOrchestrator_keywordFallback_(question, candidates) {
  var q = (question || '').toLowerCase();
  var has = {};
  var i;
  for (i = 0; i < candidates.length; i++) has[candidates[i].id] = true;

  function exists(id) {
    return !!has[id];
  }

  var matchSC = exists(_ADMIN_AGENT_ID_SUCCESS_CASES) &&
    /(success case|caso de exito|caso de éxito|referencia|impacto|resultado)/.test(q);
  var matchPR = exists(_ADMIN_AGENT_ID_PROPOSALS) &&
    /(propuesta|proposal|alcance|rfp|estimaci[oó]n|pricing|entregable|cronograma)/.test(q);
  var matchCL = exists(_ADMIN_AGENT_ID_CLIENTS) &&
    /(cliente|cuenta|account|proyecto activo|mantenimiento|n[oó]mina)/.test(q);
  var matchWork = /(que hicimos|experiencia|hemos hecho|trabajamos|trabajos|proyectos?)/.test(q);

  var agents = [];

  if (matchWork && !matchSC && !matchPR) {
    if (exists(_ADMIN_AGENT_ID_SUCCESS_CASES)) agents.push(_ADMIN_AGENT_ID_SUCCESS_CASES);
    if (exists(_ADMIN_AGENT_ID_PROPOSALS)) agents.push(_ADMIN_AGENT_ID_PROPOSALS);
  }
  if (matchSC) agents.push(_ADMIN_AGENT_ID_SUCCESS_CASES);
  if (matchPR) agents.push(_ADMIN_AGENT_ID_PROPOSALS);
  if (matchCL) agents.push(_ADMIN_AGENT_ID_CLIENTS);

  var unique = [];
  var seen = {};
  for (i = 0; i < agents.length; i++) {
    if (!seen[agents[i]]) { unique.push(agents[i]); seen[agents[i]] = true; }
  }

  if (unique.length) {
    return {
      agents: unique,
      agentId: unique[0],
      confidence: 'medium',
      reason: 'keyword',
    };
  }

  var fallbackId = exists(_ADMIN_AGENT_ID_ORCHESTRATOR)
    ? _ADMIN_AGENT_ID_ORCHESTRATOR
    : candidates.length
      ? candidates[0].id
      : _ADMIN_AGENT_ID_ORCHESTRATOR;

  return {
    agents: [fallbackId],
    agentId: fallbackId,
    confidence: 'low',
    reason: 'fallback',
  };
}

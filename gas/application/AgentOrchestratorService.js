/**
 * @fileoverview Orquestador de agentes: clasifica la consulta y la deriva al agente(s) mas adecuado(s).
 */

var _ORCH_NO_CONTENT_SENTINEL = '[[NO_RELEVANT_CONTENT]]';

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
 * @param {string} question
 * @param {string} agentId
 * @return {{ answer: string, model: string, providerLabel: string, rawJson: string, filterLabel: string, agentName: string, references?: Array<Object> }}
 */
function AgentOrchestrator_answerWith(question, agentId, history) {
  AgentOrchestrator_requireGlobant_();

  var q = AgentOrchestrator_requireQuestion_(question);

  var ctx = AgentOrchestrator_loadContext_();
  var chosen = ctx.byId[agentId] || ctx.orchestrator;
  var systemPrompt = chosen.systemPrompt;
  if (chosen.id === _ADMIN_AGENT_ID_ORCHESTRATOR) {
    systemPrompt = AgentOrchestrator_buildSelfAnswerPrompt_();
  }
  systemPrompt += '\n' + AgentOrchestrator_languageInstruction_(q);

  var histArr = Array.isArray(history) ? history : [];
  var promptWithHistory = q;
  if (histArr.length > 0) {
    var histLines = [];
    for (var h = 0; h < histArr.length; h++) {
      var entry = histArr[h];
      if (entry && entry.role && entry.content) {
        histLines.push('[' + entry.role.toUpperCase() + ']\n' + entry.content);
      }
    }
    if (histLines.length > 0) {
      promptWithHistory = '[CONVERSATION HISTORY]\n' + histLines.join('\n\n') + '\n[/CONVERSATION HISTORY]\n\n[CURRENT QUESTION]\n' + q + '\n[/CURRENT QUESTION]';
    }
  }

  var answer = LlmProviderGlobant_consultPromptWithAgent(
    chosen.profileName,
    promptWithHistory,
    systemPrompt,
  );

  answer.answer = AgentOrchestrator_sanitizeAnswer_(answer.answer);
  answer.filterLabel = UiStrings_fmt_('meta_orchestrator_selected_agent', {
    agent: chosen.profileName,
    confidence: 'routed',
  });
  answer.agentName = chosen.profileName;
  answer.references = AgentOrchestrator_matchCatalogReferences_(
    answer.answer,
    [AgentOrchestrator_mapAgentIdToContentType_(chosen.id)],
  );
  return answer;
}

/**
 * Consulta multiples agentes y devuelve solo los que tengan contenido relevante.
 * @param {string} question
 * @param {Array<string>} agentIds
 * @return {Array<{answer:string, agentName:string, model:string, providerLabel:string, rawJson:string, filterLabel:string, references?:Array<Object>}>}
 */
function AgentOrchestrator_answerMulti(question, agentIds, history) {
  AgentOrchestrator_requireGlobant_();
  var q = AgentOrchestrator_requireQuestion_(question);
  var ctx = AgentOrchestrator_loadContext_();
  var langInstr = AgentOrchestrator_languageInstruction_(q);

  var histArr = Array.isArray(history) ? history : [];
  var promptWithHistory = q;
  if (histArr.length > 0) {
    var histLines = [];
    for (var h = 0; h < histArr.length; h++) {
      var entry = histArr[h];
      if (entry && entry.role && entry.content) {
        histLines.push('[' + entry.role.toUpperCase() + ']\n' + entry.content);
      }
    }
    if (histLines.length > 0) {
      promptWithHistory = '[CONVERSATION HISTORY]\n' + histLines.join('\n\n') + '\n[/CONVERSATION HISTORY]\n\n[CURRENT QUESTION]\n' + q + '\n[/CURRENT QUESTION]';
    }
  }

  var results = [];
  for (var i = 0; i < agentIds.length; i++) {
    var chosen = ctx.byId[agentIds[i]];
    if (!chosen) continue;

    var systemPrompt = chosen.systemPrompt;
    if (chosen.id === _ADMIN_AGENT_ID_ORCHESTRATOR) {
      systemPrompt = AgentOrchestrator_buildSelfAnswerPrompt_();
    }
    systemPrompt += '\n' + langInstr;

    try {
      var answer = LlmProviderGlobant_consultPromptWithAgent(
        chosen.profileName,
        promptWithHistory,
        systemPrompt,
      );
      answer.agentName = chosen.profileName;
      answer.filterLabel = UiStrings_fmt_('meta_orchestrator_selected_agent', {
        agent: chosen.profileName,
        confidence: 'routed',
      });

      if (!AgentOrchestrator_isEmptyResponse_(answer.answer)) {
        answer.answer = AgentOrchestrator_sanitizeAnswer_(answer.answer);
        answer.references = AgentOrchestrator_matchCatalogReferences_(
          answer.answer,
          [AgentOrchestrator_mapAgentIdToContentType_(chosen.id)],
        );
        results.push(answer);
      }
    } catch (e) {
      // Si falla un agente, no abortar la ejecucion completa
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
 * Genera una instrucción de idioma basada en la consulta del usuario.
 * @param {string} question
 * @return {string}
 */
function AgentOrchestrator_languageInstruction_(question) {
  var q = (question || '').trim();
  var spanishPattern = /[áéíóúñ¿¡]|(\b(hola|qué|cómo|cuál|dónde|por qué|tenemos|dame|quiero|para|sobre|del|los|las|con)\b)/i;
  var lang = spanishPattern.test(q) ? 'es' : 'en';
  if (lang === 'es') {
    return 'IMPORTANTE: Respondé SIEMPRE en español.';
  }
  return 'IMPORTANT: Always respond in English.';
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
  lines.push('- "orchestrator" solo si es charla/saludo o no requiere corpus.');
  lines.push('');
  lines.push('Consulta del usuario:');
  lines.push(question);
  return lines.join('\n');
}

/**
 * Prompt del orquestador en modo "respuesta final al usuario".
 * Se separa del prompt de ruteo para evitar fugas de JSON al chat.
 * @return {string}
 */
function AgentOrchestrator_buildSelfAnswerPrompt_() {
  var lines = [];
  lines.push(
    'Sos el Orquestador de Aviators respondiendo DIRECTAMENTE al usuario final.',
  );
  lines.push(
    'En este modo NO clasifiques ni enrutes, y NO muestres decision interna.',
  );
  lines.push(
    'Regla estricta: NO respondas en JSON ni bloques estructurados de routing.',
  );
  lines.push(
    'Si el usuario saluda o hace charla breve, respondé cordialmente y en pocas lineas.',
  );
  lines.push(
    'Si la consulta es general/ambigua y no requiere un agente especializado, respondé vos con claridad.',
  );
  lines.push(
    'Mantenete en contexto Aviators cuando aplique y no inventes datos no verificados.',
  );
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

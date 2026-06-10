/**
 * @fileoverview Central LLM prompt catalog — editable by admins, rendered at runtime with {{params}}.
 * Persistence: Drive JSON (same pattern as AdminAgents registry).
 */

var _PROMPT_CATALOG_FILE_ID_PROP = 'PROMPT_CATALOG_FILE_ID';
var _PROMPT_CATALOG_FILE_NAME = 'aviators-prompt-catalog.json';
var PROMPT_CATALOG_REVISION = 2;
var PROMPT_CATALOG_DEFAULT_MAX_LENGTH = 14000;
var PROMPT_CATALOG_RAG_MAX_LENGTH = 12000;

/** @type {Object<string,string>} */
var PROMPT_CATALOG_AGENT_ID_MAP = {
  orchestrator: 'agents.orchestrator.routing.system',
  success_cases: 'agents.success_cases.system',
  proposals: 'agents.proposals.system',
  clients: 'agents.clients.system',
  onboarding: 'agents.onboarding.system',
};

/**
 * @param {string} agentId
 * @return {string}
 */
function PromptCatalog_agentPromptId_(agentId) {
  return PROMPT_CATALOG_AGENT_ID_MAP[String(agentId || '').trim()] || '';
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {GoogleAppsScript.Drive.File|null}
 */
function PromptCatalog_getStoreFile_(props) {
  var id = (props.getProperty(_PROMPT_CATALOG_FILE_ID_PROP) || '').trim();
  if (!id) return null;
  try {
    return DriveApp.getFileById(id);
  } catch (e) {
    return null;
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {GoogleAppsScript.Drive.File}
 */
function PromptCatalog_getOrCreateStoreFile_(props) {
  var existing = PromptCatalog_getStoreFile_(props);
  if (existing) return existing;
  var file = DriveApp.createFile(
    _PROMPT_CATALOG_FILE_NAME,
    JSON.stringify({ revision: PROMPT_CATALOG_REVISION, entries: {} }),
    MimeType.PLAIN_TEXT,
  );
  props.setProperty(_PROMPT_CATALOG_FILE_ID_PROP, file.getId());
  return file;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{revision:number, entries:Object<string,Object>}}
 */
function PromptCatalog_loadStore_(props) {
  props = props || PropertiesService.getScriptProperties();
  var file = PromptCatalog_getStoreFile_(props);
  if (!file) {
    return { revision: PROMPT_CATALOG_REVISION, entries: {} };
  }
  try {
    var raw = (file.getBlob().getDataAsString() || '').trim();
    if (!raw) return { revision: PROMPT_CATALOG_REVISION, entries: {} };
    var o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return { revision: PROMPT_CATALOG_REVISION, entries: {} };
    if (!o.entries || typeof o.entries !== 'object') o.entries = {};
    return o;
  } catch (eParse) {
    return { revision: PROMPT_CATALOG_REVISION, entries: {} };
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {{revision:number, entries:Object}} store
 */
function PromptCatalog_saveStore_(props, store) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var file = PromptCatalog_getOrCreateStoreFile_(props);
    file.setContent(JSON.stringify(store));
  } finally {
    lock.releaseLock();
  }
}

/**
 * @return {Array<Object>}
 */
function PromptCatalog_allDefinitions_() {
  return PromptCatalogDefaults_all_();
}

/**
 * @param {string} id
 * @return {Object|null}
 */
function PromptCatalog_getDefinition_(id) {
  var sid = String(id || '').trim();
  if (!sid) return null;
  var defs = PromptCatalog_allDefinitions_();
  var i;
  for (i = 0; i < defs.length; i++) {
    if (defs[i].id === sid) return defs[i];
  }
  return null;
}

/**
 * @param {{revision:number, entries:Object}} store
 * @return {boolean}
 */
function PromptCatalog_mergeDefaultsIntoStore_(store) {
  var defs = PromptCatalog_allDefinitions_();
  var changed = false;
  var i;
  for (i = 0; i < defs.length; i++) {
    var def = defs[i];
    var ent = store.entries[def.id];
    if (!ent || typeof ent !== 'object') {
      store.entries[def.id] = {
        template: def.template,
        originalTemplate: def.template,
        revision: def.revision || PROMPT_CATALOG_REVISION,
        updatedAt: '',
        updatedBy: '',
      };
      changed = true;
      continue;
    }
    if (!ent.originalTemplate) {
      ent.originalTemplate = def.template;
      changed = true;
    }
    var entRev = typeof ent.revision === 'number' ? ent.revision : 0;
    var defRev = def.revision || PROMPT_CATALOG_REVISION;
    var customized = String(ent.template || '') !== String(ent.originalTemplate || '');
    if (defRev > entRev && !customized) {
      ent.template = def.template;
      ent.originalTemplate = def.template;
      ent.revision = defRev;
      changed = true;
    }
  }
  if (store.revision !== PROMPT_CATALOG_REVISION) {
    store.revision = PROMPT_CATALOG_REVISION;
    changed = true;
  }
  return changed;
}

/**
 * @return {{revision:number, entries:Object}}
 */
function PromptCatalog_ensureStore_() {
  var props = PropertiesService.getScriptProperties();
  var store = PromptCatalog_loadStore_(props);
  var changed = PromptCatalog_mergeDefaultsIntoStore_(store);
  if (changed) PromptCatalog_saveStore_(props, store);
  return store;
}

/**
 * @param {string} id
 * @return {string}
 */
function PromptCatalog_getTemplate(id) {
  var def = PromptCatalog_getDefinition_(id);
  if (!def) {
    AviatorsError_throw_('ERR_PROMPT_NOT_FOUND', 'PromptCatalog_getTemplate', id);
  }
  var store = PromptCatalog_ensureStore_();
  var ent = store.entries[id];
  if (ent && ent.template) return String(ent.template);
  return String(def.template || '');
}

/**
 * @param {string} id
 * @param {Object<string,string>} params
 * @return {string}
 */
function PromptCatalog_render(id, params) {
  params = params || {};
  var def = PromptCatalog_getDefinition_(id);
  if (!def) {
    AviatorsError_throw_('ERR_PROMPT_NOT_FOUND', 'PromptCatalog_render', id);
  }
  var template = PromptCatalog_getTemplate(id);
  var paramDefs = def.params || [];
  var i;
  for (i = 0; i < paramDefs.length; i++) {
    var pd = paramDefs[i];
    var name = String(pd.name || '').trim();
    if (!name) continue;
    var val = params[name];
    if (val == null || val === '') {
      if (pd.required) {
        AviatorsError_throw_(
          'ERR_PROMPT_PARAM_MISSING',
          'PromptCatalog_render',
          id + ':' + name,
        );
      }
      val = pd.defaultValue != null ? String(pd.defaultValue) : '';
    } else {
      val = String(val);
    }
    template = template.split('{{' + name + '}}').join(val);
  }
  template = template.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  return template;
}

/**
 * @param {Object} def
 * @param {string} template
 */
function PromptCatalog_validateTemplate_(def, template) {
  var t = String(template || '');
  var maxLen =
    typeof def.maxLength === 'number'
      ? def.maxLength
      : def.role === 'rag_search'
        ? PROMPT_CATALOG_RAG_MAX_LENGTH
        : PROMPT_CATALOG_DEFAULT_MAX_LENGTH;
  if (t.length > maxLen) {
    AviatorsError_throw_(
      'ERR_PROMPT_TOO_LONG',
      'PromptCatalog_validateTemplate_',
      String(t.length) + '>' + String(maxLen),
    );
  }
  var validation = String(def.validation || '').trim();
  var lower = t.toLowerCase();
  if (validation === 'routing_json') {
    if (lower.indexOf('json') < 0 || t.indexOf('"agents"') < 0) {
      AviatorsError_throw_('ERR_PROMPT_ROUTING_INVALID', 'PromptCatalog_validateTemplate_', def.id);
    }
  } else if (validation === 'strict_json') {
    if (lower.indexOf('json') < 0) {
      AviatorsError_throw_('ERR_PROMPT_JSON_INVALID', 'PromptCatalog_validateTemplate_', def.id);
    }
  } else if (validation === 'rag_markers') {
    if (t.indexOf('{context}') < 0 || t.indexOf('{question}') < 0) {
      AviatorsError_throw_('ERR_PROMPT_RAG_MARKERS', 'PromptCatalog_validateTemplate_', def.id);
    }
  }
}

/**
 * @return {Array<{section:string, sectionKey:string, items:Array<Object>}>}
 */
function PromptCatalog_listGrouped_() {
  AdminAuth_requireAdmin();
  PromptCatalog_ensureStore_();
  var defs = PromptCatalog_allDefinitions_();
  var store = PromptCatalog_loadStore_(PropertiesService.getScriptProperties());
  var bySection = {};
  var order = [];
  var i;
  for (i = 0; i < defs.length; i++) {
    var def = defs[i];
    var sec = def.section || 'other';
    if (!bySection[sec]) {
      bySection[sec] = {
        section: sec,
        sectionKey: def.sectionKey || 'prompt_section_' + sec,
        items: [],
      };
      order.push(sec);
    }
    var ent = store.entries[def.id] || {};
    var tpl = ent.template != null ? String(ent.template) : String(def.template || '');
    var orig =
      ent.originalTemplate != null ? String(ent.originalTemplate) : String(def.template || '');
    bySection[sec].items.push({
      id: def.id,
      labelKey: def.labelKey || def.id,
      descriptionKey: def.descriptionKey || '',
      role: def.role || 'system',
      paramCount: (def.params || []).length,
      customized: tpl !== orig,
      length: tpl.length,
      maxLength:
        typeof def.maxLength === 'number'
          ? def.maxLength
          : def.role === 'rag_search'
            ? PROMPT_CATALOG_RAG_MAX_LENGTH
            : PROMPT_CATALOG_DEFAULT_MAX_LENGTH,
      validation: def.validation || '',
    });
  }
  var out = [];
  for (i = 0; i < order.length; i++) {
    out.push(bySection[order[i]]);
  }
  return out;
}

/**
 * @param {string} id
 * @return {Object}
 */
function PromptCatalog_getEntry(id) {
  AdminAuth_requireAdmin();
  var sid = String(id || '').trim();
  var def = PromptCatalog_getDefinition_(sid);
  if (!def) {
    AviatorsError_throw_('ERR_PROMPT_NOT_FOUND', 'PromptCatalog_getEntry', sid);
  }
  PromptCatalog_ensureStore_();
  var store = PromptCatalog_loadStore_(PropertiesService.getScriptProperties());
  var ent = store.entries[sid] || {};
  var tpl = ent.template != null ? String(ent.template) : String(def.template || '');
  var orig =
    ent.originalTemplate != null ? String(ent.originalTemplate) : String(def.template || '');
  return {
    ok: true,
    id: sid,
    section: def.section,
    sectionKey: def.sectionKey,
    labelKey: def.labelKey,
    descriptionKey: def.descriptionKey,
    role: def.role,
    validation: def.validation || '',
    maxLength:
      typeof def.maxLength === 'number'
        ? def.maxLength
        : def.role === 'rag_search'
          ? PROMPT_CATALOG_RAG_MAX_LENGTH
          : PROMPT_CATALOG_DEFAULT_MAX_LENGTH,
    params: def.params || [],
    template: tpl,
    originalTemplate: orig,
    customized: tpl !== orig,
    updatedAt: ent.updatedAt || '',
    updatedBy: ent.updatedBy || '',
  };
}

/**
 * @param {string} id
 * @param {string} template
 * @return {{ok:boolean, id:string}}
 */
function PromptCatalog_saveEntry(id, template) {
  AdminAuth_requireAdmin();
  var sid = String(id || '').trim();
  var def = PromptCatalog_getDefinition_(sid);
  if (!def) {
    AviatorsError_throw_('ERR_PROMPT_NOT_FOUND', 'PromptCatalog_saveEntry', sid);
  }
  var tpl = String(template != null ? template : '').trim();
  if (!tpl) {
    AviatorsError_throw_('ERR_PROMPT_EMPTY', 'PromptCatalog_saveEntry', sid);
  }
  PromptCatalog_validateTemplate_(def, tpl);
  var props = PropertiesService.getScriptProperties();
  var store = PromptCatalog_ensureStore_();
  var ent = store.entries[sid] || {};
  if (!ent.originalTemplate) {
    ent.originalTemplate = String(def.template || '');
  }
  ent.template = tpl;
  ent.updatedAt = new Date().toISOString();
  try {
    ent.updatedBy = Session.getActiveUser().getEmail();
  } catch (eEmail) {
    ent.updatedBy = '';
  }
  if (typeof ent.revision !== 'number') ent.revision = def.revision || PROMPT_CATALOG_REVISION;
  store.entries[sid] = ent;
  PromptCatalog_saveStore_(props, store);
  PromptCatalog_syncLinkedAgentRegistry_(sid, tpl);
  return { ok: true, id: sid };
}

/**
 * Keep AdminAgents registry systemPrompt in sync for mapped agent prompts.
 * @param {string} promptId
 * @param {string} template
 */
function PromptCatalog_syncLinkedAgentRegistry_(promptId, template) {
  var agentId = '';
  var k;
  for (k in PROMPT_CATALOG_AGENT_ID_MAP) {
    if (PROMPT_CATALOG_AGENT_ID_MAP.hasOwnProperty(k) && PROMPT_CATALOG_AGENT_ID_MAP[k] === promptId) {
      agentId = k;
      break;
    }
  }
  if (!agentId) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var reg = AdminAgents_loadRegistry_(props);
    if (!reg || !Array.isArray(reg.agents)) return;
    var i;
    var changed = false;
    for (i = 0; i < reg.agents.length; i++) {
      var ag = reg.agents[i];
      if (!ag || String(ag.id || '').trim() !== agentId) continue;
      ag.systemPrompt = template;
      changed = true;
      break;
    }
    if (changed) AdminAgents_saveRegistry_(props, reg);
  } catch (eSync) {
    AviatorsError_log_('PromptCatalog_syncLinkedAgentRegistry_', String(eSync && eSync.message));
  }
}

/**
 * @param {string} id
 * @return {{ok:boolean, id:string, template:string}}
 */
function PromptCatalog_resetEntry(id) {
  AdminAuth_requireAdmin();
  var sid = String(id || '').trim();
  var def = PromptCatalog_getDefinition_(sid);
  if (!def) {
    AviatorsError_throw_('ERR_PROMPT_NOT_FOUND', 'PromptCatalog_resetEntry', sid);
  }
  var props = PropertiesService.getScriptProperties();
  var store = PromptCatalog_ensureStore_();
  var ent = store.entries[sid] || {};
  var orig =
    ent.originalTemplate != null ? String(ent.originalTemplate) : String(def.template || '');
  ent.template = orig;
  ent.updatedAt = new Date().toISOString();
  try {
    ent.updatedBy = Session.getActiveUser().getEmail();
  } catch (eEmail) {
    ent.updatedBy = '';
  }
  store.entries[sid] = ent;
  PromptCatalog_saveStore_(props, store);
  PromptCatalog_syncLinkedAgentRegistry_(sid, orig);
  return { ok: true, id: sid, template: orig };
}

/**
 * @return {{ok:boolean, sections:Array<Object>}}
 */
function PromptCatalog_list() {
  return { ok: true, sections: PromptCatalog_listGrouped_() };
}

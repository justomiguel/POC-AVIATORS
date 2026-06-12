/**
 * @fileoverview Generación y persistencia de embeddings del catálogo (Globant + pgvector).
 */

/** @type {number} */
var CONTENT_EMBEDDING_MAX_INPUT_CHARS = 8000;

/** @type {number} */
var CONTENT_EMBEDDING_MATCH_THRESHOLD = 0.55;

/** @type {Object<string, Array<number>>} */
var _CONTENT_EMB_VECTOR_CACHE_ = {};

/**
 * @return {string}
 */
function ContentEmbedding_defaultModel_() {
  var props = PropertiesService.getScriptProperties();
  var custom = String(props.getProperty(LLM_PROP.GLOBANT_EMBEDDING_MODEL) || '').trim();
  return custom || GLOBANT_EMBEDDING_DEFAULT_MODEL;
}

/**
 * @param {Array<number>} vector
 * @return {string}
 */
function ContentEmbedding_formatVectorForSupabase_(vector) {
  if (!vector || !vector.length) return '[]';
  var parts = [];
  for (var i = 0; i < vector.length; i++) {
    parts.push(String(Number(vector[i])));
  }
  return '[' + parts.join(',') + ']';
}

/**
 * @param {Object} row
 * @return {string}
 */
function ContentEmbedding_sourceTextFromRow_(row) {
  var fromSearch = String(row.search_text || '').trim();
  if (fromSearch) return fromSearch.slice(0, CONTENT_EMBEDDING_MAX_INPUT_CHARS);
  return ContentCatalog_buildSearchText_(row).slice(0, CONTENT_EMBEDDING_MAX_INPUT_CHARS);
}

/**
 * @return {ReturnType<GlobantEmbeddingsApiClient_create>}
 */
function ContentEmbedding_createClient_() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  return GlobantEmbeddingsApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
}

/**
 * @param {string} text
 * @return {Array<number>}
 */
function ContentEmbedding_createVector_(text) {
  var q = String(text || '').trim();
  if (!q) return [];
  if (_CONTENT_EMB_VECTOR_CACHE_[q]) return _CONTENT_EMB_VECTOR_CACHE_[q];
  var client = ContentEmbedding_createClient_();
  var model = ContentEmbedding_defaultModel_();
  var out = client.createEmbedding(q.slice(0, CONTENT_EMBEDDING_MAX_INPUT_CHARS), model);
  var vec = out.embedding || [];
  if (vec.length !== GLOBANT_EMBEDDING_DIMENSIONS) {
    throw new Error(
      'ERR_EMBEDDING_DIM: expected ' +
        GLOBANT_EMBEDDING_DIMENSIONS +
        ' got ' +
        vec.length,
    );
  }
  _CONTENT_EMB_VECTOR_CACHE_[q] = vec;
  return vec;
}

/**
 * Regenera y persiste el embedding de una fila del catálogo.
 * @param {Object} row
 * @return {{ok:boolean,contentId:string,model:string}}
 */
function ContentEmbedding_refreshForRow_(row) {
  var contentId = String(row.content_id || '').trim();
  if (!contentId) throw new Error('content_id requerido');
  var source = ContentEmbedding_sourceTextFromRow_(row);
  if (!source) {
    ContentCatalogStore_clearEmbedding(contentId);
    return { ok: true, contentId: contentId, model: '', skipped: true };
  }
  var client = ContentEmbedding_createClient_();
  var model = ContentEmbedding_defaultModel_();
  var out = client.createEmbedding(source, model);
  ContentCatalogStore_updateEmbedding(contentId, out.embedding, out.model || model);
  return { ok: true, contentId: contentId, model: out.model || model };
}

/**
 * @param {string} contentId
 * @return {{ok:boolean,contentId:string,model:string}}
 */
function ContentEmbedding_refreshForContentId_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) throw new Error('content_id requerido');
  var row = ContentCatalogStore_getById(id);
  if (!row) throw new Error('content_id no encontrado');
  return ContentEmbedding_refreshForRow_(row);
}

/**
 * Regenera embedding solo si la fila no tiene vector persistido.
 * @param {string} contentId
 * @return {{ok:boolean,contentId:string,model:string,skipped?:boolean}}
 */
function ContentEmbedding_refreshForContentIdIfMissing_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) throw new Error('content_id requerido');
  var row = ContentCatalogStore_getById(id);
  if (!row) throw new Error('content_id no encontrado');
  if (ContentCatalogStore_rowHasEmbedding_(row)) {
    return { ok: true, contentId: id, model: String(row.embedding_model || ''), skipped: true };
  }
  return ContentEmbedding_refreshForRow_(row);
}

/**
 * Backfill paginado de embeddings (admin / contribuidor de contenidos).
 * @param {number} skip
 * @param {number} limit
 * @return {{ok:boolean,processed:number,done:number,failed:number,skip:number,limit:number,total:number,hasMore:boolean,errors:Array<string>}}
 */
function ContentEmbedding_rebuildBatch_(skip, limit) {
  ContentCatalog_requireContributor_();
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(25, Math.max(1, Number(limit) || 10));
  var total = ContentCatalogStore_countFiltered({});
  var rows = ContentCatalogStore_listPage(s, lim + 1);
  if (rows.length > lim) rows = rows.slice(0, lim);
  var done = 0;
  var failed = 0;
  /** @type {Array<string>} */
  var errors = [];

  for (var i = 0; i < rows.length; i++) {
    try {
      ContentEmbedding_refreshForRow_(rows[i]);
      done += 1;
    } catch (eRow) {
      failed += 1;
      errors.push(
        String(rows[i].content_id || '') +
          ': ' +
          String(eRow.message || eRow).slice(0, 120),
      );
    }
  }

  return {
    ok: true,
    processed: rows.length,
    done: done,
    failed: failed,
    skip: s,
    limit: lim,
    total: total,
    hasMore: s + lim < total,
    errors: errors.slice(0, 5),
  };
}

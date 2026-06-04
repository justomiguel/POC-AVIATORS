/**
 * @fileoverview Persistencia del catálogo de contenidos en Supabase.
 */

/**
 * @param {Object} row
 * @return {Object}
 */
function ContentCatalogStore_rowToSpecific_(row) {
  var specific = row.specific;
  if (specific && typeof specific === 'object' && !Array.isArray(specific)) {
    var out = {};
    var k;
    for (k in specific) {
      if (Object.prototype.hasOwnProperty.call(specific, k)) out[k] = specific[k];
    }
    out.content_id = String(row.content_id || '');
    return out;
  }
  return { content_id: String(row.content_id || '') };
}

/**
 * @return {Array<Object>}
 */
function ContentCatalogStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.CONTENTS,
    'select=*&order=updated_at.desc',
  );
}

/**
 * @param {string} contentId
 * @return {Object|null}
 */
function ContentCatalogStore_getById(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return null;
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('content_id', 'eq', id),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CONTENTS, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {Object} commonRow
 * @param {Object} specificRow
 * @return {Object}
 */
function ContentCatalogStore_upsert(commonRow, specificRow) {
  var contentId = String(commonRow.content_id || '').trim() || Utilities.getUuid();
  var specific = specificRow || {};
  var specificPayload = {};
  var k;
  for (k in specific) {
    if (!Object.prototype.hasOwnProperty.call(specific, k)) continue;
    if (k === 'content_id') continue;
    specificPayload[k] = String(specific[k] != null ? specific[k] : '').trim();
  }

  var payload = {
    content_id: contentId,
    content_type: String(commonRow.content_type || '').trim(),
    title: String(commonRow.title || '').trim(),
    summary: String(commonRow.summary || '').trim(),
    client_name: String(commonRow.client_name || '').trim(),
    industry: String(commonRow.industry || '').trim(),
    tags_csv: String(commonRow.tags_csv || '').trim(),
    file_name: String(commonRow.file_name || '').trim(),
    mime_type: String(commonRow.mime_type || '').trim(),
    drive_file_id: String(commonRow.drive_file_id || '').trim(),
    drive_file_url: String(commonRow.drive_file_url || '').trim(),
    globant_profile_name: String(commonRow.globant_profile_name || '').trim(),
    globant_document_id: String(commonRow.globant_document_id || '').trim(),
    uploaded_by: String(commonRow.uploaded_by || '').trim(),
    search_text: String(commonRow.search_text || '').trim(),
    created_at: commonRow.created_at || new Date().toISOString(),
    updated_at: commonRow.updated_at || new Date().toISOString(),
    specific: specificPayload,
  };

  var saved = SupabaseRest_upsert(SUPABASE_TABLE.CONTENTS, payload, 'content_id');
  if (Array.isArray(saved) && saved.length) return saved[0];
  return payload;
}

/**
 * @param {string} contentId
 * @param {Array<number>} vector
 * @param {string} model
 */
function ContentCatalogStore_updateEmbedding(contentId, vector, model) {
  var id = String(contentId || '').trim();
  if (!id) return;
  var vecStr = ContentEmbedding_formatVectorForSupabase_(vector);
  SupabaseRest_update(
    SUPABASE_TABLE.CONTENTS,
    {
      embedding: vecStr,
      embedding_model: String(model || '').trim(),
      embedding_updated_at: new Date().toISOString(),
    },
    SupabaseRest_query_([
      SupabaseRest_filter_('content_id', 'eq', id),
    ]),
  );
}

/**
 * @param {string} contentId
 */
function ContentCatalogStore_clearEmbedding(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  SupabaseRest_update(
    SUPABASE_TABLE.CONTENTS,
    {
      embedding: null,
      embedding_model: '',
      embedding_updated_at: new Date().toISOString(),
    },
    SupabaseRest_query_([
      SupabaseRest_filter_('content_id', 'eq', id),
    ]),
  );
}

/**
 * Búsqueda semántica vía RPC pgvector.
 * @param {Array<number>} vector
 * @param {{limit?:number,threshold?:number}} [opts]
 * @return {Array<Object>}
 */
function ContentCatalogStore_matchSemantic(vector, opts) {
  if (!vector || !vector.length) return [];
  var limit = opts && opts.limit ? Math.min(25, Math.max(1, opts.limit)) : 8;
  var threshold =
    opts && opts.threshold != null ? Number(opts.threshold) : CONTENT_EMBEDDING_MATCH_THRESHOLD;
  var vecStr = ContentEmbedding_formatVectorForSupabase_(vector);
  var rows = SupabaseRest_rpc('match_contents_semantic', {
    query_embedding: vecStr,
    match_count: limit,
    match_threshold: threshold,
  });
  return Array.isArray(rows) ? rows : [];
}

/**
 * @param {string} contentId
 * @return {boolean}
 */
function ContentCatalogStore_delete(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return false;
  SupabaseRest_delete(
    SUPABASE_TABLE.CONTENTS,
    SupabaseRest_filter_('content_id', 'eq', id),
  );
  return true;
}

/**
 * @return {Array<string>}
 */
function ContentCatalogStore_getControlledTags() {
  var q = SupabaseRest_query_([
    'select=value',
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.CONTROLLED_TAGS),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.APP_SETTINGS, q);
  if (!rows.length) return [];
  var val = rows[0].value;
  if (!Array.isArray(val)) return [];
  var out = [];
  var seen = {};
  for (var i = 0; i < val.length; i++) {
    var t = String(val[i] || '').trim();
    if (!t) continue;
    if (t.charAt(0) !== '#') t = '#' + t;
    var k = t.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true;
    out.push(t);
  }
  return out;
}

/**
 * Mapa aliasKey (sin #, minúsculas alfanum) → display #tag canónico.
 * @return {Object<string,string>}
 */
function ContentCatalogStore_getTagAliases() {
  var q = SupabaseRest_query_([
    'select=value',
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.TAG_ALIASES),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.APP_SETTINGS, q);
  if (!rows.length) return {};
  var val = rows[0].value;
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  var out = {};
  var k;
  for (k in val) {
    if (!Object.prototype.hasOwnProperty.call(val, k)) continue;
    var canon = ContentExtraction_toCamelTag_(val[k]);
    if (!canon) continue;
    var ak = ContentExtraction_tagKey_(k);
    if (!ak) continue;
    out[ak] = canon;
  }
  return out;
}

/**
 * @param {Object<string,string>} aliasMap tagKey → #display
 */
function ContentCatalogStore_setTagAliases(aliasMap) {
  var clean = {};
  var k;
  for (k in aliasMap || {}) {
    if (!Object.prototype.hasOwnProperty.call(aliasMap, k)) continue;
    var canon = ContentExtraction_toCamelTag_(aliasMap[k]);
    if (!canon) continue;
    var ak = ContentExtraction_tagKey_(k);
    if (!ak) continue;
    clean[ak] = canon;
  }
  SupabaseRest_upsert(
    SUPABASE_TABLE.APP_SETTINGS,
    {
      key: SUPABASE_SETTINGS_KEY.TAG_ALIASES,
      value: clean,
      updated_at: new Date().toISOString(),
    },
    'key',
  );
}

/**
 * @param {Array<string>} tags
 */
function ContentCatalogStore_setControlledTags(tags) {
  SupabaseRest_upsert(
    SUPABASE_TABLE.APP_SETTINGS,
    {
      key: SUPABASE_SETTINGS_KEY.CONTROLLED_TAGS,
      value: tags || [],
      updated_at: new Date().toISOString(),
    },
    'key',
  );
}

/**
 * @return {number}
 */
function ContentCatalogStore_clearAll() {
  var rows = ContentCatalogStore_listAll();
  if (!rows.length) return 0;
  SupabaseRest_delete(SUPABASE_TABLE.CONTENTS, 'content_id=not.is.null');
  SupabaseRest_delete(
    SUPABASE_TABLE.APP_SETTINGS,
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.CONTROLLED_TAGS),
  );
  return rows.length;
}

/**
 * @param {Object} row
 * @return {{common:Object,specific:Object}}
 */
function ContentCatalogStore_toApiItem_(row, tagParser) {
  var specific = ContentCatalogStore_rowToSpecific_(row);
  return {
    common: {
      content_id: String(row.content_id || ''),
      content_type: String(row.content_type || ''),
      title: String(row.title || ''),
      summary: String(row.summary || ''),
      client_name: String(row.client_name || ''),
      industry: String(row.industry || ''),
      tags: tagParser(String(row.tags_csv || '')),
      file_name: String(row.file_name || ''),
      mime_type: String(row.mime_type || ''),
      drive_file_id: String(row.drive_file_id || ''),
      drive_file_url: String(row.drive_file_url || ''),
      globant_profile_name: String(row.globant_profile_name || ''),
      globant_document_id: String(row.globant_document_id || ''),
      uploaded_by: String(row.uploaded_by || ''),
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    },
    specific: specific,
  };
}

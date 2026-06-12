/**
 * @fileoverview Detección de success cases con metadata muy similar a contenido existente.
 */

/** @type {number} Similitud Jaccard mínima (tokens) para señalar duplicado. */
var CONTENT_DUPLICATE_SC_LEXICAL_MIN = 0.38;

/** @type {number} Similitud semántica mínima (pgvector / embedding). */
var CONTENT_DUPLICATE_SC_SEMANTIC_MIN = 0.78;

/** @type {number} Umbral combinado para incluir en resultados. */
var CONTENT_DUPLICATE_SC_COMBINED_MIN = 0.72;

/** @type {number} Máximo de coincidencias devueltas. */
var CONTENT_DUPLICATE_SC_MAX_MATCHES = 5;

/**
 * @param {string} text
 * @return {string}
 */
function ContentDuplicateCheck_normalizePlain_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} title
 * @param {string} fileName
 * @return {string}
 */
function ContentDuplicateCheck_normalizeTitle_(title, fileName) {
  var t = String(title || '').trim();
  if (!t) t = String(fileName || '').replace(/\.pdf$/i, '').trim();
  return ContentDuplicateCheck_normalizePlain_(t);
}

/**
 * @param {string} fileName
 * @return {string}
 */
function ContentDuplicateCheck_normalizeFileName_(fileName) {
  return ContentDuplicateCheck_normalizePlain_(String(fileName || '').replace(/\.pdf$/i, ''));
}

/**
 * @param {string} text
 * @return {Object<string, boolean>}
 */
function ContentDuplicateCheck_tokenSet_(text) {
  var tokens = ContentCatalog_questionSearchTokens_(text);
  var set = {};
  var i;
  for (i = 0; i < tokens.length; i++) {
    set[tokens[i]] = true;
  }
  return set;
}

/**
 * @param {Object<string, boolean>} a
 * @param {Object<string, boolean>} b
 * @return {number} 0–1
 */
function ContentDuplicateCheck_jaccard_(a, b) {
  var inter = 0;
  var union = 0;
  var k;
  for (k in a) {
    if (!Object.prototype.hasOwnProperty.call(a, k)) continue;
    union++;
    if (b[k]) inter++;
  }
  for (k in b) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
    if (!a[k]) union++;
  }
  if (!union) return 0;
  return inter / union;
}

/**
 * @param {Object} common
 * @param {Object} specific
 * @return {string}
 */
function ContentDuplicateCheck_buildCandidateText_(common, specific) {
  var tags = common.tags || [];
  var tagsCsv = ContentCatalog_tagsToCsv_(Array.isArray(tags) ? tags : []);
  return ContentCatalog_buildSearchText_({
    title: common.title,
    summary: common.summary,
    client_name: common.client_name,
    industry: common.industry,
    tags_csv: tagsCsv,
    content_type: 'success_case',
    file_name: common.file_name,
    specific: specific || {},
  });
}

/**
 * @param {{common:Object,specific:Object,excludeContentId?:string}} input
 * @return {{ok:boolean,matches:Array<Object>}}
 */
function ContentDuplicateCheck_findSimilarSuccessCases_(input) {
  ContentCatalog_requireContributor_();
  var common = (input && input.common) || {};
  var specific = (input && input.specific) || {};
  var excludeId = String(
    (input && input.excludeContentId) || common.content_id || '',
  ).trim();

  var candidateText = ContentDuplicateCheck_buildCandidateText_(common, specific);
  if (!candidateText) {
    return { ok: true, matches: [] };
  }

  var candTitle = ContentDuplicateCheck_normalizeTitle_(common.title, common.file_name);
  var candFile = ContentDuplicateCheck_normalizeFileName_(common.file_name);
  var candTokens = ContentDuplicateCheck_tokenSet_(candidateText);

  /** @type {Object<string, Object>} */
  var byId = {};

  function mergeHit_(id, patch) {
    if (!id || id === excludeId) return;
    if (!byId[id]) {
      byId[id] = {
        content_id: id,
        title: '',
        client_name: '',
        industry: '',
        file_name: '',
        similarity: 0,
        lexical: 0,
        semantic: 0,
      };
    }
    var cur = byId[id];
    if (patch.title) cur.title = patch.title;
    if (patch.client_name) cur.client_name = patch.client_name;
    if (patch.industry) cur.industry = patch.industry;
    if (patch.file_name) cur.file_name = patch.file_name;
    if (patch.lexical != null) cur.lexical = Math.max(cur.lexical, patch.lexical);
    if (patch.semantic != null) cur.semantic = Math.max(cur.semantic, patch.semantic);
    var combined = Math.max(cur.lexical, cur.semantic);
    if (patch.titleMatch) combined = Math.max(combined, 0.92);
    if (patch.fileMatch) combined = Math.max(combined, 0.88);
    cur.similarity = Math.max(cur.similarity, combined);
  }

  var rows = ContentCatalogStore_listAllPages_({ contentType: 'success_case' }, 100, 1500);
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    if (String(row.content_type || '').trim() !== 'success_case') continue;
    var rid = String(row.content_id || '').trim();
    if (!rid || rid === excludeId) continue;

    var rowText = String(row.search_text || '').trim();
    if (!rowText) {
      rowText = ContentCatalog_buildSearchText_({
        title: row.title,
        summary: row.summary,
        client_name: row.client_name,
        industry: row.industry,
        tags_csv: row.tags_csv,
        content_type: row.content_type,
        file_name: row.file_name,
        specific: row.specific,
      });
    }
    var lex = ContentDuplicateCheck_jaccard_(
      candTokens,
      ContentDuplicateCheck_tokenSet_(rowText),
    );
    var rowTitle = ContentDuplicateCheck_normalizeTitle_(row.title, row.file_name);
    var rowFile = ContentDuplicateCheck_normalizeFileName_(row.file_name);
    var titleMatch = !!candTitle && candTitle === rowTitle;
    var fileMatch = !!candFile && !!rowFile && candFile === rowFile;
    if (
      lex < CONTENT_DUPLICATE_SC_LEXICAL_MIN &&
      !titleMatch &&
      !fileMatch
    ) {
      continue;
    }
    mergeHit_(rid, {
      title: String(row.title || '').trim(),
      client_name: String(row.client_name || '').trim(),
      industry: String(row.industry || '').trim(),
      file_name: String(row.file_name || '').trim(),
      lexical: lex,
      titleMatch: titleMatch,
      fileMatch: fileMatch,
    });
  }

  var semHits = ContentCatalog_findRowsSemantic_(candidateText, {
    limit: 8,
    threshold: CONTENT_DUPLICATE_SC_SEMANTIC_MIN,
  });
  var si;
  for (si = 0; si < semHits.length; si++) {
    var doc = semHits[si].doc || {};
    if (String(doc.contentType || '').trim() !== 'success_case') continue;
    mergeHit_(String(doc.contentId || '').trim(), {
      title: doc.title,
      client_name: doc.clientName,
      industry: doc.industry,
      file_name: doc.fileName,
      semantic: Number(semHits[si].similarity || 0),
    });
  }

  var matches = [];
  var key;
  for (key in byId) {
    if (!Object.prototype.hasOwnProperty.call(byId, key)) continue;
    var m = byId[key];
    if (m.similarity < CONTENT_DUPLICATE_SC_COMBINED_MIN) continue;
    matches.push(m);
  }
  matches.sort(function (a, b) {
    return b.similarity - a.similarity;
  });
  if (matches.length > CONTENT_DUPLICATE_SC_MAX_MATCHES) {
    matches = matches.slice(0, CONTENT_DUPLICATE_SC_MAX_MATCHES);
  }

  return { ok: true, matches: matches };
}

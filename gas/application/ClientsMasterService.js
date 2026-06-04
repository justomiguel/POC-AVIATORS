/**
 * @fileoverview Maestro de clientes — Supabase (ClientsMasterStore).
 */

/** @deprecated Solo migración legacy desde planilla; runtime usa Supabase. */
var CLIENTS_PROP_SPREADSHEET_ID = 'CLIENTS_MASTER_SPREADSHEET_ID';

/** @deprecated Solo referencia histórica; el catálogo vivo sale de la BD (ClientsMaster_listFilterOptions). */
var CLIENTS_ALLOWED_INDUSTRIES = [
  'Agencias de Turismo',
  'Logistica',
  'Agencias AeroEspaciales',
  'Aeropuertos',
];

/**
 * @param {string} text
 * @return {string}
 */
function ClientsMaster_normalizeIndustryToken_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * @param {string} raw
 * @return {string} Canonical industry value or empty string
 */
function ClientsMaster_resolveIndustry_(raw) {
  var token = ClientsMaster_normalizeIndustryToken_(raw);
  if (!token) return '';
  var i;
  for (i = 0; i < CLIENTS_ALLOWED_INDUSTRIES.length; i++) {
    var canonical = CLIENTS_ALLOWED_INDUSTRIES[i];
    if (ClientsMaster_normalizeIndustryToken_(canonical) === token) return canonical;
  }
  var map = {
    agenciasdeturismo: 'Agencias de Turismo',
    travelagencies: 'Agencias de Turismo',
    tourismagencies: 'Agencias de Turismo',
    logistica: 'Logistica',
    logistics: 'Logistica',
    agenciasaeroespaciales: 'Agencias AeroEspaciales',
    aerospaceagencies: 'Agencias AeroEspaciales',
    aeropuertos: 'Aeropuertos',
    airports: 'Aeropuertos',
  };
  return map[token] || '';
}

/**
 * @param {string} id
 * @return {boolean}
 */
function ClientsMaster_isUuid_(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(id || '').trim(),
  );
}

/**
 * @param {string} raw
 * @param {Array<string>} list
 * @return {string}
 */
function ClientsMaster_resolveFromCatalogList_(raw, list) {
  var trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  var items = list || [];
  if (!items.length) return trimmed;
  var token = ClientsMaster_normalizeIndustryToken_(trimmed);
  if (!token) return '';
  var i;
  for (i = 0; i < items.length; i++) {
    var item = String(items[i] || '').trim();
    if (!item) continue;
    if (ClientsMaster_normalizeIndustryToken_(item) === token) return item;
  }
  for (i = 0; i < items.length; i++) {
    var item2 = String(items[i] || '').trim();
    var tok2 = ClientsMaster_normalizeIndustryToken_(item2);
    if (!tok2) continue;
    if (token.indexOf(tok2) >= 0 || tok2.indexOf(token) >= 0) return item2;
  }
  return '';
}

/**
 * Industria solo si existe en el maestro de clientes (valores distintos en BD).
 * @param {string} raw
 * @return {string}
 */
function ClientsMaster_resolveIndustryFromCatalog_(raw) {
  var catalog = ClientsMaster_listFilterOptions();
  return ClientsMaster_resolveFromCatalogList_(raw, catalog.industries || []);
}

/**
 * Subindustria solo si existe en el maestro (opcionalmente acotada por industria).
 * @param {string} raw
 * @param {string=} industry
 * @return {string}
 */
function ClientsMaster_resolveSubIndustryFromCatalog_(raw, industry) {
  var catalog = ClientsMaster_listFilterOptions();
  var ind = String(industry || '').trim();
  var list = catalog.sub_industries || [];
  if (ind && catalog.sub_industries_by_industry && catalog.sub_industries_by_industry[ind]) {
    list = catalog.sub_industries_by_industry[ind];
  }
  return ClientsMaster_resolveFromCatalogList_(raw, list);
}

/** @return {string[]} */
function ClientsMaster_headers_() {
  return [
    'client_id',
    'client_name',
    'normalized_name',
    'industry',
    'sub_industry',
    'country',
    'main_contact_name',
    'main_contact_email',
    'logo_url',
    'notes',
    'created_at',
    'created_by',
    'updated_at',
  ];
}

/** @const {number} */
var CLIENTS_LIST_MAX_LIMIT_ = 100;

/**
 * Lista clientes con filtros y paginación.
 * @param {{q?:string, industry?:string, sub_industry?:string, skip?:number, limit?:number}} filters
 * @return {{ok:boolean, items:Array<Object>, total:number, skip:number, limit:number, hasMore:boolean}}
 */
function ClientsMaster_list(filters) {
  AdminAuth_requireClientsView();
  var f = filters || {};
  var q = String(f.q || '').toLowerCase().trim();
  var industryFilter = String(f.industry || '').trim();
  var subIndustryFilter = String(f.sub_industry || '').toLowerCase().trim();

  var dbRows = ClientsMasterStore_listAll();
  var items = [];
  for (var si = 0; si < dbRows.length; si++) {
    var apiItem = ClientsMasterStore_toApiItem_(dbRows[si]);
    if (!apiItem.client_id) continue;
    if (industryFilter && String(apiItem.industry || '').trim() !== industryFilter) {
      continue;
    }
    if (subIndustryFilter && String(apiItem.sub_industry || '').trim() !== subIndustryFilter) {
      continue;
    }
    if (q) {
      var hayDb =
        (
          apiItem.client_name +
          ' ' +
          apiItem.industry +
          ' ' +
          apiItem.sub_industry +
          ' ' +
          apiItem.country +
          ' ' +
          apiItem.main_contact_name +
          ' ' +
          apiItem.main_contact_email
        ).toLowerCase();
      if (hayDb.indexOf(q) < 0) continue;
    }
    items.push(apiItem);
  }
  items.sort(function (a, b) {
    return a.client_name.localeCompare(b.client_name);
  });
  var totalDb = items.length;
  var skipDb = f.skip != null ? Math.max(0, Number(f.skip)) : 0;
  var limitRaw = f.limit != null ? Number(f.limit) : 0;
  var limitDb =
    limitRaw > 0 ? Math.min(CLIENTS_LIST_MAX_LIMIT_, Math.max(1, limitRaw)) : 0;
  var pagedDb = items;
  var hasMoreDb = false;
  if (limitDb > 0) {
    pagedDb = items.slice(skipDb, skipDb + limitDb);
    hasMoreDb = skipDb + pagedDb.length < totalDb;
  } else {
    limitDb = totalDb;
    skipDb = 0;
  }
  return {
    ok: true,
    items: pagedDb,
    total: totalDb,
    skip: skipDb,
    limit: limitDb,
    hasMore: hasMoreDb,
  };
}

/**
 * Valores distintos presentes en la cartera (para filtros de UI).
 * @return {{
 *   ok: boolean,
 *   industries: Array<string>,
 *   sub_industries: Array<string>,
 *   sub_industries_by_industry: Object<string, Array<string>>
 * }}
 */
function ClientsMaster_listFilterOptions() {
  AdminAuth_requireClientsView();
  var dbRows = ClientsMasterStore_listAll();
  var industrySet = {};
  var subSet = {};
  var subByIndustry = {};
  var si;
  for (si = 0; si < dbRows.length; si++) {
    var optItem = ClientsMasterStore_toApiItem_(dbRows[si]);
    if (!optItem.client_id) continue;
    var indOpt = String(optItem.industry || '').trim();
    var subOpt = String(optItem.sub_industry || '').trim();
    if (indOpt) industrySet[indOpt] = true;
    if (subOpt) {
      subSet[subOpt] = true;
      if (indOpt) {
        if (!subByIndustry[indOpt]) subByIndustry[indOpt] = {};
        subByIndustry[indOpt][subOpt] = true;
      }
    }
  }
  var industries = Object.keys(industrySet).sort(function (a, b) {
    return a.localeCompare(b);
  });
  var subIndustries = Object.keys(subSet).sort(function (a, b) {
    return a.localeCompare(b);
  });
  var subMapOut = {};
  var indKeys = Object.keys(subByIndustry);
  var ij;
  for (ij = 0; ij < indKeys.length; ij++) {
    var indKey = indKeys[ij];
    subMapOut[indKey] = Object.keys(subByIndustry[indKey]).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }
  return {
    ok: true,
    industries: industries,
    sub_industries: subIndustries,
    sub_industries_by_industry: subMapOut,
  };
}

/**
 * Obtiene solo nombres para combo (ligero).
 * @return {{ok:boolean, clients:Array<{id:string,name:string}>}}
 */
function ClientsMaster_listForCombo() {
  var res = ClientsMaster_list({});
  var out = [];
  for (var i = 0; i < res.items.length; i++) {
    out.push({
      id: res.items[i].client_id,
      name: res.items[i].client_name,
    });
  }
  return { ok: true, clients: out };
}

/**
 * @param {string} clientId
 * @return {{ok:boolean, item:Object}}
 */
function ClientsMaster_get(clientId) {
  AdminAuth_requireClientsView();
  var id = String(clientId || '').trim();
  if (!id) throw new Error('client_id requerido');
  var res = ClientsMaster_list({});
  for (var i = 0; i < res.items.length; i++) {
    if (res.items[i].client_id === id) {
      return { ok: true, item: res.items[i] };
    }
  }
  throw new Error('Cliente no encontrado');
}

/**
 * Busca cliente por nombre (normalizado).
 * @param {string} name
 * @return {Object|null}
 */
function ClientsMaster_findByName(name) {
  var norm = ClientsMaster_normalizeName_(name);
  if (!norm) return null;
  var hit = ClientsMasterStore_getByNormalizedName(norm);
  return hit ? ClientsMasterStore_toApiItem_(hit) : null;
}

/**
 * @param {string} raw
 * @return {string}
 */
function ClientsMaster_sanitizeLogoUrl_(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  if (/^https:\/\//i.test(s)) {
    if (s.length > 2048) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_logo_invalid'));
    }
    return s;
  }
  var m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(s);
  if (!m) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_logo_invalid'));
  }
  if (m[2].length > 800000) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_logo_too_large'));
  }
  return s;
}

/**
 * @param {string} name
 * @return {string}
 */
function ClientsMaster_normalizeName_(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Umbral mínimo de similitud (0–1) para vincular a un cliente existente. */
var CLIENTS_MASTER_MATCH_MIN_SCORE = 0.72;

/**
 * @param {string} a
 * @param {string} b
 * @return {number}
 */
function ClientsMaster_levenshtein_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a === b) return 0;
  var la = a.length;
  var lb = b.length;
  if (!la) return lb;
  if (!lb) return la;
  var i;
  var j;
  var prev = [];
  var cur = [];
  for (j = 0; j <= lb; j++) prev[j] = j;
  for (i = 1; i <= la; i++) {
    cur[0] = i;
    for (j = 1; j <= lb; j++) {
      var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    var swap = prev;
    prev = cur;
    cur = swap;
  }
  return prev[lb];
}

/**
 * @param {string} candNorm
 * @param {string} clientNorm
 * @return {number} 0..1
 */
function ClientsMaster_nameMatchScore_(candNorm, clientNorm) {
  if (!candNorm || !clientNorm) return 0;
  if (candNorm === clientNorm) return 1;
  if (candNorm.indexOf(clientNorm) >= 0 || clientNorm.indexOf(candNorm) >= 0) {
    return (
      Math.min(candNorm.length, clientNorm.length) /
      Math.max(candNorm.length, clientNorm.length)
    );
  }
  var maxLen = Math.max(candNorm.length, clientNorm.length);
  if (!maxLen) return 0;
  var dist = ClientsMaster_levenshtein_(candNorm, clientNorm);
  return 1 - dist / maxLen;
}

/**
 * @param {string} name
 * @return {string[]}
 */
function ClientsMaster_extractNameTokens_(name) {
  var s = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  var parts = s.split(/[^a-z0-9]+/);
  var out = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    var t = String(parts[i] || '').trim();
    if (t.length >= 2) out.push(t);
  }
  return out;
}

/**
 * @param {string} candRaw
 * @param {string} clientRaw
 * @return {number} 0..1
 */
function ClientsMaster_tokenOverlapScore_(candRaw, clientRaw) {
  var ct = ClientsMaster_extractNameTokens_(candRaw);
  var kt = ClientsMaster_extractNameTokens_(clientRaw);
  if (!ct.length || !kt.length) return 0;
  var shorter = ct.length <= kt.length ? ct : kt;
  var longer = ct.length <= kt.length ? kt : ct;
  var matched = 0;
  var si;
  var lj;
  for (si = 0; si < shorter.length; si++) {
    var st = shorter[si];
    if (st.length < 3 && shorter.length > 1) continue;
    for (lj = 0; lj < longer.length; lj++) {
      var lt = longer[lj];
      if (lt === st || lt.indexOf(st) >= 0 || st.indexOf(lt) >= 0) {
        matched++;
        break;
      }
    }
  }
  if (!matched) return 0;
  return matched / shorter.length;
}

/**
 * @param {string} candNorm
 * @param {string} clientNorm
 * @param {string} candRaw
 * @param {string} clientRaw
 * @return {number} 0..1
 */
function ClientsMaster_combinedMatchScore_(candNorm, clientNorm, candRaw, clientRaw) {
  var base = ClientsMaster_nameMatchScore_(candNorm, clientNorm);
  var tokens = ClientsMaster_tokenOverlapScore_(candRaw, clientRaw);
  var minLen = Math.min(candNorm.length, clientNorm.length);
  var minScore =
    minLen > 0 && minLen < 5 ? Math.max(CLIENTS_MASTER_MATCH_MIN_SCORE, 0.88) : CLIENTS_MASTER_MATCH_MIN_SCORE;
  var score = Math.max(base, tokens * 0.95);
  return score >= minScore ? score : Math.max(base, tokens);
}

/**
 * @param {string} rawName
 * @param {string} fileName
 * @return {string[]}
 */
function ClientsMaster_buildMatchCandidates_(rawName, fileName) {
  var candidates = [];
  var raw = String(rawName || '').trim();
  if (raw) candidates.push(raw);

  var stem = String(fileName || '').replace(/\.[^.]+$/i, '');
  var segs = stem.split(/[\s_\-–—]+/);
  var si;
  for (si = 0; si < segs.length; si++) {
    var seg = String(segs[si] || '').trim();
    if (seg.length >= 2) candidates.push(seg);
  }
  if (segs.length >= 2) {
    candidates.push((String(segs[0] || '') + ' ' + String(segs[1] || '')).trim());
  }

  var seenC = {};
  var uniq = [];
  var ci;
  for (ci = 0; ci < candidates.length; ci++) {
    var key = ClientsMaster_normalizeName_(candidates[ci]);
    if (!key || seenC[key]) continue;
    seenC[key] = true;
    uniq.push(candidates[ci]);
  }
  return uniq;
}

/**
 * @param {string} rawName
 * @param {string} fileName
 * @return {string}
 */
function ClientsMaster_guessClientNameWhenUnmatched_(rawName, fileName) {
  var raw = String(rawName || '').trim();
  if (raw.length >= 2) return raw;

  var stem = String(fileName || '').replace(/\.[^.]+$/i, '');
  var segs = stem.split(/[\s_\-–—]+/);
  var best = '';
  var si;
  for (si = 0; si < segs.length; si++) {
    var seg = String(segs[si] || '').trim();
    if (seg.length >= 3 && seg.length > best.length) best = seg;
  }
  if (!best && segs.length >= 2) {
    best = (String(segs[0] || '') + ' ' + String(segs[1] || '')).trim();
  }
  return best;
}

/**
 * Resuelve cliente del maestro: match exacto/fuzzy (acentos, typos leves) o nombre sugerido para alta.
 * @param {string} rawName
 * @param {string} fileName
 * @return {{client_name:string, industry:string, sub_industry:string, matched:boolean, matchScore:number}}
 */
function ClientsMaster_matchFromHints_(rawName, fileName) {
  var guess = ClientsMaster_guessClientNameWhenUnmatched_(rawName, fileName);
  var empty = {
    client_name: guess || String(rawName || '').trim(),
    industry: '',
    sub_industry: '',
    matched: false,
    matchScore: 0,
  };
  var rows = ClientsMasterStore_listAll();
  if (!rows.length) return empty;

  var uniq = ClientsMaster_buildMatchCandidates_(rawName, fileName);
  var ci;
  for (ci = 0; ci < uniq.length; ci++) {
    var exact = ClientsMaster_findByName(uniq[ci]);
    if (exact) {
      return {
        client_name: exact.client_name,
        industry: String(exact.industry || '').trim(),
        sub_industry: String(exact.sub_industry || '').trim(),
        matched: true,
        matchScore: 1,
      };
    }
  }

  var best = null;
  var bestScore = 0;
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var client = ClientsMasterStore_toApiItem_(rows[ri]);
    var cn = ClientsMaster_normalizeName_(client.client_name);
    if (!cn || cn.length < 2) continue;
    var uj;
    for (uj = 0; uj < uniq.length; uj++) {
      var candRaw = uniq[uj];
      var cand = ClientsMaster_normalizeName_(candRaw);
      if (!cand || cand.length < 2) continue;
      var score = ClientsMaster_combinedMatchScore_(
        cand,
        cn,
        candRaw,
        client.client_name,
      );
      if (score > bestScore) {
        bestScore = score;
        best = client;
      }
    }
  }

  var minAccept =
    best && ClientsMaster_normalizeName_(best.client_name).length < 5
      ? Math.max(CLIENTS_MASTER_MATCH_MIN_SCORE, 0.88)
      : CLIENTS_MASTER_MATCH_MIN_SCORE;

  if (best && bestScore >= minAccept) {
    return {
      client_name: best.client_name,
      industry: String(best.industry || '').trim(),
      sub_industry: String(best.sub_industry || '').trim(),
      matched: true,
      matchScore: bestScore,
    };
  }

  return empty;
}

/**
 * @param {string} name
 * @return {boolean}
 */
function ClientsMaster_nameHasAccentMarks_(name) {
  var s = String(name || '');
  if (!s) return false;
  return s !== s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * @param {Object} row
 * @return {number}
 */
function ClientsMaster_clientCompletenessScore_(row) {
  var score = 0;
  if (String(row.industry || '').trim()) score += 2;
  if (String(row.sub_industry || '').trim()) score += 2;
  if (String(row.country || '').trim()) score += 1;
  if (String(row.main_contact_name || '').trim()) score += 1;
  if (String(row.main_contact_email || '').trim()) score += 1;
  if (String(row.logo_url || '').trim()) score += 2;
  if (String(row.notes || '').trim()) score += 1;
  if (ClientsMaster_nameHasAccentMarks_(row.client_name)) score += 3;
  score += Math.min(5, String(row.client_name || '').length / 20);
  return score;
}

/**
 * @param {Array<Object>} members
 * @return {string}
 */
function ClientsMaster_pickCanonicalDisplayName_(members) {
  var best = '';
  var bestScore = -1;
  var i;
  for (i = 0; i < members.length; i++) {
    var n = String(members[i].client_name || '').trim();
    if (!n) continue;
    var sc = n.length;
    if (ClientsMaster_nameHasAccentMarks_(n)) sc += 100;
    if (sc > bestScore) {
      bestScore = sc;
      best = n;
    }
  }
  return best || String((members[0] && members[0].client_name) || '').trim();
}

/**
 * @param {Object} winner
 * @param {Object} loser
 * @return {Object}
 */
function ClientsMaster_mergeClientRows_(winner, loser) {
  var out = {
    client_id: String(winner.client_id || ''),
    client_name: ClientsMaster_pickCanonicalDisplayName_([winner, loser]),
    normalized_name: '',
    industry: String(winner.industry || '').trim() || String(loser.industry || '').trim(),
    sub_industry:
      String(winner.sub_industry || '').trim() || String(loser.sub_industry || '').trim(),
    country: String(winner.country || '').trim() || String(loser.country || '').trim(),
    main_contact_name:
      String(winner.main_contact_name || '').trim() ||
      String(loser.main_contact_name || '').trim(),
    main_contact_email:
      String(winner.main_contact_email || '').trim() ||
      String(loser.main_contact_email || '').trim(),
    logo_url: String(winner.logo_url || '').trim() || String(loser.logo_url || '').trim(),
    notes: String(winner.notes || '').trim(),
    created_at: String(winner.created_at || loser.created_at || ''),
    created_by: String(winner.created_by || loser.created_by || ''),
    updated_at: new Date().toISOString(),
  };
  out.normalized_name = ClientsMaster_normalizeName_(out.client_name);
  var loserNotes = String(loser.notes || '').trim();
  if (loserNotes) {
    if (!out.notes) out.notes = loserNotes;
    else if (out.notes.indexOf(loserNotes) < 0) {
      out.notes = out.notes + '\n---\n' + loserNotes;
    }
  }
  return out;
}

/**
 * @param {Object} winner
 * @param {Object} loser
 * @param {Object} stats
 */
function ClientsMaster_repointClientReferences_(winner, loser, stats) {
  var winnerName = String(winner.client_name || '').trim();
  var norm = ClientsMaster_normalizeName_(winnerName);
  var loserName = String(loser.client_name || '').trim();

  var contents = ContentCatalogStore_listAll();
  var ci;
  for (ci = 0; ci < contents.length; ci++) {
    var row = contents[ci];
    var cn = String(row.client_name || '').trim();
    if (!cn) continue;
    var cnNorm = ClientsMaster_normalizeName_(cn);
    if (cnNorm !== norm && cn !== loserName) continue;
    if (cn === winnerName) continue;
    row.client_name = winnerName;
    row.updated_at = new Date().toISOString();
    row.search_text = ContentCatalog_buildSearchText_(row);
    ContentCatalogStore_upsert(row, ContentCatalogStore_rowToSpecific_(row));
    stats.contentsUpdated++;
  }

  var sfRows = SalesforceAccountsStore_listAll();
  var si;
  for (si = 0; si < sfRows.length; si++) {
    var sf = sfRows[si];
    if (String(sf.client_id || '').trim() !== String(loser.client_id || '').trim()) continue;
    sf.client_id = String(winner.client_id || '').trim();
    sf.updated_at = new Date().toISOString();
    SalesforceAccountsStore_upsert(sf);
    stats.salesforceRowsUpdated++;
  }
}

/**
 * Fusiona clientes cuyo nombre coincide al ignorar acentos y mayúsculas.
 * Actualiza contenidos y cuentas Salesforce que apuntaban al duplicado.
 * @return {{ok:boolean, stats:Object}}
 */
function ClientsMaster_reconcileDuplicates() {
  var rows = ClientsMasterStore_listAll();
  var groups = {};
  var i;
  for (i = 0; i < rows.length; i++) {
    var item = ClientsMasterStore_toApiItem_(rows[i]);
    if (!item.client_id) continue;
    var norm = ClientsMaster_normalizeName_(item.client_name);
    if (!norm) continue;
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(item);
  }

  var stats = {
    groupsChecked: 0,
    mergedGroups: 0,
    clientsRemoved: 0,
    clientsUpdated: 0,
    contentsUpdated: 0,
    salesforceRowsUpdated: 0,
  };

  var norms = Object.keys(groups);
  for (i = 0; i < norms.length; i++) {
    var normKey = norms[i];
    var members = groups[normKey];
    stats.groupsChecked++;
    if (members.length <= 1) {
      var solo = members[0];
      var soloNorm = ClientsMaster_normalizeName_(solo.client_name);
      if (String(solo.normalized_name || '') !== soloNorm) {
        solo.normalized_name = soloNorm;
        solo.updated_at = new Date().toISOString();
        ClientsMasterStore_upsert(solo);
        stats.clientsUpdated++;
      }
      continue;
    }

    members.sort(function (a, b) {
      return ClientsMaster_clientCompletenessScore_(b) - ClientsMaster_clientCompletenessScore_(a);
    });

    var winner = members[0];
    var gi;
    for (gi = 1; gi < members.length; gi++) {
      var loser = members[gi];
      ClientsMaster_repointClientReferences_(winner, loser, stats);
      winner = ClientsMaster_mergeClientRows_(winner, loser);
      var loserId = String(loser.client_id || '').trim();
      ClientsMasterStore_delete(loserId);
      stats.clientsRemoved++;
      try {
        KnowledgeGraph_removeClient_(loserId);
      } catch (eKgRm) {
        console.log('[KG] dedupe remove client: ' + String(eKgRm.message || eKgRm).slice(0, 80));
      }
    }
    winner.normalized_name = normKey;
    winner.updated_at = new Date().toISOString();
    ClientsMasterStore_upsert(winner);
    stats.clientsUpdated++;
    stats.mergedGroups++;
    try {
      KnowledgeGraph_syncClient_(String(winner.client_id || ''));
    } catch (eKgDedupe) {
      console.log(
        '[KG] after client dedupe: ' + String(eKgDedupe.message || eKgDedupe).slice(0, 100),
      );
    }
  }

  return { ok: true, stats: stats };
}

/**
 * Crea o actualiza un cliente.
 * @param {Object} data
 * @return {{ok:boolean, item:Object}}
 */
function ClientsMaster_upsert(data) {
  var who = ContentCatalog_requireContributor_();
  if (!data || typeof data !== 'object') throw new Error('Payload inválido');
  var clientId = String(data.client_id || '').trim();
  var clientName = String(data.client_name || '').trim();
  if (!clientName) throw new Error('client_name requerido');
  var rawIndustry = String(data.industry || '').trim();
  var resolvedIndustry = ClientsMaster_resolveIndustryFromCatalog_(rawIndustry);
  if (rawIndustry && !resolvedIndustry) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_industry_invalid'));
  }
  var rawSub = String(data.sub_industry != null ? data.sub_industry : '').trim();
  var resolvedSub = ClientsMaster_resolveSubIndustryFromCatalog_(rawSub, resolvedIndustry);
  if (rawSub && !resolvedSub) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_sub_industry_invalid'));
  }
  var normalized = ClientsMaster_normalizeName_(clientName);

  var existingDb = clientId ? ClientsMasterStore_getById(clientId) : null;
  var dupDb = ClientsMasterStore_getByNormalizedName(normalized);
  if (dupDb && String(dupDb.client_id || '') !== clientId) {
    throw new Error(
      'Ya existe un cliente con nombre similar: ' + String(dupDb.client_name || ''),
    );
  }
  var nowDb = new Date().toISOString();
  var isNewDb = !existingDb;
  if (isNewDb && !clientId) clientId = Utilities.getUuid();
  var rowDb = {
    client_id: clientId,
    client_name: clientName,
    normalized_name: normalized,
    industry: resolvedIndustry,
    sub_industry:
      data.sub_industry != null
        ? resolvedSub
        : existingDb
          ? String(existingDb.sub_industry || '').trim()
          : '',
    country: String(data.country || '').trim(),
    main_contact_name: String(data.main_contact_name || '').trim(),
    main_contact_email: String(data.main_contact_email || '').trim(),
    logo_url: ClientsMaster_sanitizeLogoUrl_(data.logo_url),
    notes: String(data.notes || '').trim(),
    created_at: isNewDb ? nowDb : String(existingDb.created_at || nowDb),
    created_by: isNewDb ? who.email : String(existingDb.created_by || who.email),
    updated_at: nowDb,
  };
  var savedDb = ClientsMasterStore_upsert(rowDb);
  try {
    KnowledgeGraph_syncClient_(String(savedDb.client_id || clientId));
  } catch (eKg) {
    console.log('[KG] sync after client upsert: ' + String(eKg.message || eKg).slice(0, 200));
  }
  return { ok: true, item: ClientsMasterStore_toApiItem_(savedDb) };
}

/**
 * Rellena industria / sub-industria desde Salesforce sin pisar valores ya cargados.
 * @param {Object|null} existing
 * @param {Object} incoming
 * @return {{industry:string, sub_industry:string}}
 */
function ClientsMaster_mergeIndustryFromSync_(existing, incoming) {
  var sfIndustry = String(incoming.industry || '').trim();
  var sfSubIndustry = String(incoming.sub_industry || '').trim();
  var curIndustry = existing ? String(existing.industry || '').trim() : '';
  var curSub = existing ? String(existing.sub_industry || '').trim() : '';

  var outIndustry = curIndustry;
  if (!outIndustry && sfIndustry) {
    outIndustry = ClientsMaster_resolveIndustry_(sfIndustry) || sfIndustry;
  }

  var outSub = curSub;
  if (!outSub && sfSubIndustry) {
    outSub = sfSubIndustry;
  }

  return { industry: outIndustry, sub_industry: outSub };
}

/**
 * Alta/actualización desde sync Salesforce (sin permisos de contribuidor).
 * Enriquece clientes existentes: industria y sub-industria solo si estaban vacías.
 * @param {Object} data — client_name, industry, sub_industry, main_contact_name, notes
 * @return {{client_id:string, created:boolean, enriched:boolean}}
 */
function ClientsMaster_upsertFromSync_(data) {
  if (!data || typeof data !== 'object') throw new Error('Payload inválido');
  var clientName = String(data.client_name || '').trim();
  if (!clientName) throw new Error('client_name requerido');
  var normalized = ClientsMaster_normalizeName_(clientName);
  var existing = ClientsMasterStore_getByNormalizedName(normalized);
  var now = new Date().toISOString();
  var isNew = !existing;
  var clientId = existing
    ? String(existing.client_id || '')
    : Utilities.getUuid();

  var mergedIndustry = ClientsMaster_mergeIndustryFromSync_(existing, data);
  var sfContact = String(data.main_contact_name || '').trim();
  var mergedContact = existing
    ? String(existing.main_contact_name || '').trim() || sfContact
    : sfContact;
  var mergedNotes = existing
    ? String(existing.notes || '').trim()
    : String(data.notes || '').trim();
  if (!mergedNotes && data.notes) mergedNotes = String(data.notes || '').trim();

  var enriched =
    !isNew &&
    ((!String(existing.industry || '').trim() && !!mergedIndustry.industry) ||
      (!String(existing.sub_industry || '').trim() && !!mergedIndustry.sub_industry) ||
      (!String(existing.main_contact_name || '').trim() && !!mergedContact));

  var rowDb = {
    client_id: clientId,
    client_name: clientName,
    normalized_name: normalized,
    industry: mergedIndustry.industry,
    sub_industry: mergedIndustry.sub_industry,
    country: existing ? String(existing.country || '').trim() : '',
    main_contact_name: mergedContact,
    main_contact_email: existing
      ? String(existing.main_contact_email || '').trim()
      : '',
    logo_url: existing ? String(existing.logo_url || '').trim() : '',
    notes: mergedNotes,
    created_at: isNew ? now : String(existing.created_at || now),
    created_by: isNew
      ? 'salesforce-sync'
      : String(existing.created_by || 'salesforce-sync'),
    updated_at: now,
  };
  ClientsMasterStore_upsert(rowDb);
  return { client_id: clientId, created: isNew, enriched: enriched };
}

/**
 * Crea cliente rápido (solo nombre) si no existe — para uso inline.
 * @param {string} name
 * @param {string=} industry
 * @return {{ok:boolean, item:Object, created:boolean}}
 */
/** Prefijo estable del cliente placeholder por industria (success cases sin cuenta nombrada). */
var CLIENTS_GENERIC_NAME_PREFIX = 'Cliente genérico — ';

/**
 * Nombre canónico del cliente genérico para una industria del catálogo.
 * @param {string} industry — valor ya resuelto contra el maestro
 * @return {string}
 */
function ClientsMaster_genericClientNameForIndustry_(industry) {
  return CLIENTS_GENERIC_NAME_PREFIX + String(industry || '').trim();
}

/**
 * Obtiene o crea el cliente genérico reutilizable para casos de éxito sin cuenta en el PDF.
 * @param {string} industry
 * @return {{ok:boolean, item:Object, created:boolean}|null} null si la industria no está en catálogo
 */
function ClientsMaster_ensureGenericForIndustry(industry) {
  var resolvedIndustry = ClientsMaster_resolveIndustryFromCatalog_(industry || '');
  if (!resolvedIndustry) return null;
  var name = ClientsMaster_genericClientNameForIndustry_(resolvedIndustry);
  var res = ClientsMaster_ensureByName(name, resolvedIndustry);
  return { ok: true, item: res.item, created: res.created };
}

function ClientsMaster_ensureByName(name, industry) {
  var resolvedIndustry = ClientsMaster_resolveIndustryFromCatalog_(industry || '');
  var existing = ClientsMaster_findByName(name);
  if (existing) {
    if (resolvedIndustry && String(existing.industry || '').trim() !== resolvedIndustry) {
      var merged = Object.assign({}, existing, {
        client_id: existing.client_id,
        client_name: existing.client_name,
        industry: resolvedIndustry,
      });
      var upd = ClientsMaster_upsert(merged);
      return { ok: true, item: upd.item, created: false };
    }
    return { ok: true, item: existing, created: false };
  }
  var res = ClientsMaster_upsert({ client_name: name, industry: resolvedIndustry });
  return { ok: true, item: res.item, created: true };
}

/**
 * Elimina un cliente.
 * @param {string} clientId
 * @return {{ok:boolean}}
 */
function ClientsMaster_delete(clientId) {
  ContentCatalog_requireContributor_();
  var id = String(clientId || '').trim();
  if (!id) throw new Error('client_id requerido');

  var found = ClientsMasterStore_getById(id);
  if (!found && !ClientsMaster_isUuid_(id)) {
    found = ClientsMasterStore_getByNormalizedName(ClientsMaster_normalizeName_(id));
  }
  if (!found) {
    if (!ClientsMaster_isUuid_(id)) {
      AviatorsError_throw_('ERR_CLIENT_ID_INVALID', 'ClientsMaster_delete', id);
    }
    throw new Error('Cliente no encontrado');
  }
  var removedId = String(found.client_id || '').trim();
  ClientsMasterStore_delete(removedId);
  try {
    KnowledgeGraph_removeClient_(removedId);
  } catch (eKg) {
    console.log('[KG] remove after client delete: ' + String(eKg.message || eKg).slice(0, 200));
  }
  return { ok: true };
}

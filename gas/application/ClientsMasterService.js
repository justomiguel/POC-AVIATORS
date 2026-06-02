/**
 * @fileoverview Maestro de clientes — Supabase (ClientsMasterStore).
 */

/** @deprecated Solo migración legacy desde planilla; runtime usa Supabase. */
var CLIENTS_PROP_SPREADSHEET_ID = 'CLIENTS_MASTER_SPREADSHEET_ID';

var CLIENTS_ALLOWED_INDUSTRIES = [
  'Agencias de Turismo',
  'Logistica',
  'Agencias AeroEspaciales',
  'Aeropuertos',
  'Aerolineas',
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
    aerolineas: 'Aerolineas',
    airlines: 'Aerolineas',
  };
  return map[token] || '';
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
  ContentCatalog_requireAnyRole_();
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
    if (subIndustryFilter) {
      var subHay = String(apiItem.sub_industry || '').toLowerCase();
      if (subHay.indexOf(subIndustryFilter) < 0) continue;
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
  ContentCatalog_requireAnyRole_();
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
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
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
  var resolvedIndustry = ClientsMaster_resolveIndustry_(rawIndustry);
  if (rawIndustry && !resolvedIndustry) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'clients_err_industry_invalid'));
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
    sub_industry: String(
      data.sub_industry != null
        ? data.sub_industry
        : existingDb
          ? existingDb.sub_industry
          : '',
    ).trim(),
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
function ClientsMaster_ensureByName(name, industry) {
  var resolvedIndustry = ClientsMaster_resolveIndustry_(industry || '');
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
  if (!found) throw new Error('Cliente no encontrado');
  ClientsMasterStore_delete(id);
  return { ok: true };
}

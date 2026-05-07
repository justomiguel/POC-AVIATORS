/**
 * @fileoverview Maestro de clientes — spreadsheet separado con metadata.
 */

var CLIENTS_PROP_SPREADSHEET_ID = 'CLIENTS_MASTER_SPREADSHEET_ID';
var CLIENTS_TAB_NAME = 'clients';
var CLIENTS_ROOT_FOLDER_ID = '1gkNVvIEN3UfPMnphZKLJ3600s5bkmTwG';
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
    'country',
    'main_contact_name',
    'main_contact_email',
    'notes',
    'created_at',
    'created_by',
    'updated_at',
  ];
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
 * @return {{spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet, sheet:GoogleAppsScript.Spreadsheet.Sheet}}
 */
function ClientsMaster_getOrCreateSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = (props.getProperty(CLIENTS_PROP_SPREADSHEET_ID) || '').trim();
  var ss = null;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Aviators - Clients Master');
    var file = DriveApp.getFileById(ss.getId());
    try {
      var folder = DriveApp.getFolderById(CLIENTS_ROOT_FOLDER_ID);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (ignoreMove) {}
    props.setProperty(CLIENTS_PROP_SPREADSHEET_ID, ss.getId());
  }
  var sheet = ss.getSheetByName(CLIENTS_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CLIENTS_TAB_NAME);
    var headers = ClientsMaster_headers_();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return { spreadsheet: ss, sheet: sheet };
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @return {Array<Object>}
 */
function ClientsMaster_readRows_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var data = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var out = [];
  for (var r = 0; r < data.length; r++) {
    var row = data[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    out.push(obj);
  }
  return out;
}

/**
 * Lista todos los clientes.
 * @param {{q?:string}} filters
 * @return {{ok:boolean, items:Array<Object>}}
 */
function ClientsMaster_list(filters) {
  ContentCatalog_requireAnyRole_();
  var f = filters || {};
  var q = String(f.q || '').toLowerCase().trim();
  var catalog = ClientsMaster_getOrCreateSpreadsheet_();
  var headers = ClientsMaster_headers_();
  var rows = ClientsMaster_readRows_(catalog.sheet, headers);
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var id = String(r.client_id || '').trim();
    if (!id) continue;
    var name = String(r.client_name || '');
    if (q) {
      var hay = (name + ' ' + String(r.industry || '') + ' ' + String(r.country || '')).toLowerCase();
      if (hay.indexOf(q) < 0) continue;
    }
    items.push({
      client_id: id,
      client_name: name,
      normalized_name: String(r.normalized_name || ''),
      industry: String(r.industry || ''),
      country: String(r.country || ''),
      main_contact_name: String(r.main_contact_name || ''),
      main_contact_email: String(r.main_contact_email || ''),
      notes: String(r.notes || ''),
      created_at: String(r.created_at || ''),
      created_by: String(r.created_by || ''),
      updated_at: String(r.updated_at || ''),
    });
  }
  items.sort(function (a, b) {
    return a.client_name.localeCompare(b.client_name);
  });

  var total = items.length;
  var skip = f.skip != null ? Math.max(0, Number(f.skip)) : 0;
  var limit = f.limit != null && Number(f.limit) > 0 ? Number(f.limit) : 0;
  var paged = items;
  var hasMore = false;
  if (limit > 0) {
    paged = items.slice(skip, skip + limit);
    hasMore = skip + limit < total;
  }
  return { ok: true, items: paged, total: total, hasMore: hasMore };
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
  var res = ClientsMaster_list({});
  for (var i = 0; i < res.items.length; i++) {
    if (res.items[i].normalized_name === norm) {
      return res.items[i];
    }
  }
  return null;
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

  var catalog = ClientsMaster_getOrCreateSpreadsheet_();
  var sheet = catalog.sheet;
  var headers = ClientsMaster_headers_();
  var rows = ClientsMaster_readRows_(sheet, headers);

  var existingRow = -1;
  var duplicateRow = -1;
  for (var i = 0; i < rows.length; i++) {
    var rid = String(rows[i].client_id || '').trim();
    var rnorm = String(rows[i].normalized_name || '').trim();
    if (clientId && rid === clientId) {
      existingRow = i;
    } else if (rnorm === normalized) {
      duplicateRow = i;
    }
  }

  if (duplicateRow >= 0 && (existingRow < 0 || duplicateRow !== existingRow)) {
    throw new Error('Ya existe un cliente con nombre similar: ' + rows[duplicateRow].client_name);
  }

  var now = new Date().toISOString();
  var isNew = existingRow < 0;
  if (isNew) {
    clientId = Utilities.getUuid();
  }

  var rowData = {
    client_id: clientId,
    client_name: clientName,
    normalized_name: normalized,
    industry: resolvedIndustry,
    country: String(data.country || '').trim(),
    main_contact_name: String(data.main_contact_name || '').trim(),
    main_contact_email: String(data.main_contact_email || '').trim(),
    notes: String(data.notes || '').trim(),
    created_at: isNew ? now : String(rows[existingRow].created_at || now),
    created_by: isNew ? who.email : String(rows[existingRow].created_by || who.email),
    updated_at: now,
  };

  var values = [];
  for (var h = 0; h < headers.length; h++) {
    values.push(rowData[headers[h]] || '');
  }

  if (isNew) {
    sheet.appendRow(values);
  } else {
    sheet.getRange(existingRow + 2, 1, 1, headers.length).setValues([values]);
  }

  return { ok: true, item: rowData };
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

  var catalog = ClientsMaster_getOrCreateSpreadsheet_();
  var sheet = catalog.sheet;
  var headers = ClientsMaster_headers_();
  var last = sheet.getLastRow();
  if (last < 2) throw new Error('Cliente no encontrado');

  var idCol = headers.indexOf('client_id') + 1;
  var data = sheet.getRange(2, idCol, last - 1, 1).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][0] || '').trim() === id) {
      sheet.deleteRow(r + 2);
      return { ok: true };
    }
  }
  throw new Error('Cliente no encontrado');
}

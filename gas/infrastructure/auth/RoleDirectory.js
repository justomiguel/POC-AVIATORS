/**
 * @fileoverview Roles desde hoja de cálculo (columnas Rol + E-mail en pestaña `data`).
 * ID de spreadsheet: propiedad ROLES_SPREADSHEET_ID o valor por defecto del proyecto.
 */

var ROLE_DIR_DEFAULT_SPREADSHEET_ID =
  '126bt-3YJJ1aiLsvSGIyq8cZluHlPi7_h47j9KAtg3o0';
var ROLE_DIR_SHEET_NAME = 'data';
var ROLE_DIR_CACHE_SEC = 300;

/**
 * Varios canales: `Logger` + `console.log` / `info` / `warn` (en Ejecuciones a veces solo
 * aparece uno de ellos).
 *
 * @param {string} msg
 */
function RoleDirectory_trace_(msg) {
  Logger.log(msg);
  try {
    console.log(msg);
    console.info(msg);
    console.warn(msg);
  } catch (ignore) {}
}

/**
 * @param {unknown} err
 */
function RoleDirectory_traceError_(err) {
  var m = err && err.message ? String(err.message) : String(err);
  var st = err && err.stack ? String(err.stack) : '';
  RoleDirectory_trace_('[RoleDirectory] EXCEPTION message=' + m);
  try {
    console.error('[RoleDirectory] EXCEPTION message=' + m);
  } catch (ignore) {}
  if (st) {
    var stMsg = '[RoleDirectory] EXCEPTION stack (trim)=' + st.slice(0, 2500);
    RoleDirectory_trace_(stMsg);
    try {
      console.error(stMsg);
    } catch (ignore2) {}
  }
}

/**
 * @param {unknown} cell
 * @return {string}
 */
function RoleDirectory_normalizeHeaderCell_(cell) {
  return String(cell || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();
}

/**
 * @param {string} email
 * @return {{ label: string, key: string }|null} null → visitante
 */
function RoleDirectory_lookupRole(email) {
  var em = ('' + (email || '')).trim().toLowerCase();
  if (!em) {
    RoleDirectory_trace_('[RoleDirectory_lookupRole] Empty email → no role.');
    return null;
  }

  try {
    var au = Session.getActiveUser().getEmail();
    var eu = Session.getEffectiveUser().getEmail();
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Session activeUser=' +
        au +
        ' effectiveUser=' +
        eu +
        ' lookupEmailParam=' +
        em,
    );
  } catch (sessEx) {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Session.get*User email failed: ' +
        (sessEx && sessEx.message ? sessEx.message : String(sessEx)),
    );
  }

  var cache = CacheService.getScriptCache();
  var ck = 'rd_v2_' + em;
  var hit = cache.get(ck);
  if (hit !== null) {
    if (hit === '__none__') {
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Cache hit → no mapping for this session email.',
      );
      return null;
    }
    try {
      RoleDirectory_trace_('[RoleDirectory_lookupRole] Cache hit → role JSON from cache.');
      return JSON.parse(hit);
    } catch (e) {
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Cache hit but JSON parse failed, reloading sheet.',
      );
    }
  } else {
    RoleDirectory_trace_('[RoleDirectory_lookupRole] Cache miss → reading spreadsheet.');
  }

  var props = PropertiesService.getScriptProperties();
  var ssId =
    (props.getProperty('ROLES_SPREADSHEET_ID') || '').trim() ||
    ROLE_DIR_DEFAULT_SPREADSHEET_ID;
  var idSource = props.getProperty('ROLES_SPREADSHEET_ID')
    ? 'ROLES_SPREADSHEET_ID'
    : 'ROLE_DIR_DEFAULT_SPREADSHEET_ID';
  RoleDirectory_trace_(
    '[RoleDirectory_lookupRole] spreadsheetId=' +
      ssId +
      ' idLength=' +
      ssId.length +
      ' (' +
      idSource +
      ') sheetTab="' +
      ROLE_DIR_SHEET_NAME +
      '"',
  );
  RoleDirectory_trace_(
    '[RoleDirectory_lookupRole] openUrlHint=https://docs.google.com/spreadsheets/d/' +
      ssId +
      '/edit',
  );

  var sheet;
  /** @type {GoogleAppsScript.Spreadsheet.Spreadsheet|null} */
  var spreadsheet = null;
  try {
    RoleDirectory_trace_('[RoleDirectory_lookupRole] STEP_A calling SpreadsheetApp.openById only…');
    spreadsheet = SpreadsheetApp.openById(ssId);
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] STEP_A openById OK spreadsheetName=' +
        spreadsheet.getName(),
    );
  } catch (eOpen) {
    RoleDirectory_traceError_(eOpen);
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] STEP_A openById FAILED → ERR_ROLE_LOOKUP_OPEN (permiso ID o archivo inexistente para este usuario)',
    );
    throw new Error('ERR_ROLE_LOOKUP_OPEN');
  }
  try {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] STEP_B getSheetByName("' + ROLE_DIR_SHEET_NAME + '")…',
    );
    sheet = spreadsheet.getSheetByName(ROLE_DIR_SHEET_NAME);
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] STEP_B result=' +
        (sheet ? 'sheet OK' : 'NULL (wrong tab name) → would be ERR_ROLE_LOOKUP_TAB'),
    );
  } catch (eTab) {
    RoleDirectory_traceError_(eTab);
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] STEP_B threw (unexpected for getSheetByName)',
    );
    throw new Error('ERR_ROLE_LOOKUP_OPEN');
  }

  if (!sheet) {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Sheet not found — no tab named "' +
        ROLE_DIR_SHEET_NAME +
        '" (ERR_ROLE_LOOKUP_TAB)',
    );
    throw new Error('ERR_ROLE_LOOKUP_TAB');
  }

  var rows = sheet.getDataRange().getValues();
  RoleDirectory_trace_('[RoleDirectory_lookupRole] Rows in data range=' + rows.length);
  if (rows.length < 2) {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Fewer than 2 rows → no data rows → visitor.',
    );
    cache.put(ck, '__none__', 60);
    return null;
  }

  var header = rows[0];
  var colRole = -1;
  var colEmail = -1;
  for (var h = 0; h < header.length; h++) {
    var hn = RoleDirectory_normalizeHeaderCell_(header[h]);
    if (hn === 'rol' || hn === 'role') colRole = h;
    if (
      hn === 'e-mail' ||
      hn === 'email' ||
      hn === 'correo' ||
      hn === 'mail'
    )
      colEmail = h;
  }
  RoleDirectory_trace_(
    '[RoleDirectory_lookupRole] Parsed headers colRole=' +
      colRole +
      ' colEmail=' +
      colEmail,
  );
  if (colRole < 0 || colEmail < 0) {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Headers not recognized → need Rol/Role and email column. Raw header row: ' +
        JSON.stringify(
          header.map(function (c) {
            return String(c || '').trim();
          }),
        ),
    );
    throw new Error('ERR_ROLE_LOOKUP_COLS');
  }

  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var cellMail = String(row[colEmail] || '')
      .trim()
      .toLowerCase();
    if (cellMail && cellMail === em) {
      var label = String(row[colRole] || '').trim();
      if (!label) label = 'Miembro';
      var slug = label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_áéíóúñ]/gi, '');
      if (!slug) slug = 'miembro';
      var out = { label: label, key: slug };
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Match at row index ' +
          r +
          ' email=' +
          em +
          ' → role="' +
          label +
          '"',
      );
      cache.put(ck, JSON.stringify(out), ROLE_DIR_CACHE_SEC);
      return out;
    }
  }

  RoleDirectory_trace_(
    '[RoleDirectory_lookupRole] No matching row for email=' +
      em +
      ' (scanned ' +
      (rows.length - 1) +
      ' data rows)',
  );
  cache.put(ck, '__none__', ROLE_DIR_CACHE_SEC);
  return null;
}

/**
 * Detecta rol preventa desde clave o etiqueta de hoja (misma heurística que contenidos).
 *
 * @param {{ label?: string, key?: string }|null} rec
 * @return {boolean}
 */
function RoleDirectory_roleRecordIsPresale_(rec) {
  if (!rec) return false;
  var label = rec.label ? String(rec.label) : '';
  var key = rec.key ? String(rec.key) : '';
  var keyNorm = key.toLowerCase();
  var labelNorm = label.toLowerCase();
  return (
    keyNorm.indexOf('presale') >= 0 ||
    keyNorm.indexOf('pre_sale') >= 0 ||
    keyNorm.indexOf('preventa') >= 0 ||
    labelNorm.indexOf('presale') >= 0 ||
    labelNorm.indexOf('pre sale') >= 0 ||
    labelNorm.indexOf('pre-') >= 0 ||
    labelNorm.indexOf('preventa') >= 0
  );
}

/**
 * @param {string} email
 * @return {boolean}
 */
function RoleDirectory_emailIsPresale(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  return RoleDirectory_roleRecordIsPresale_(RoleDirectory_lookupRole(em));
}

/**
 * Diagnóstico sin exponer filas de datos: ejecutar desde el editor Apps Script
 * (Ejecutar) con tu usuario, o como despliegue «usuario que accede» con la misma cuenta.
 *
 * @return {Object}
 */
function RoleDirectory_diagnostic() {
  var email = ('' + Session.getActiveUser().getEmail()).trim().toLowerCase();
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] Active user email (normalized)=' + email,
  );
  var props = PropertiesService.getScriptProperties();
  var ssId =
    (props.getProperty('ROLES_SPREADSHEET_ID') || '').trim() ||
    ROLE_DIR_DEFAULT_SPREADSHEET_ID;
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] spreadsheetId=' +
      ssId +
      ' idLength=' +
      ssId.length +
      ' tab="' +
      ROLE_DIR_SHEET_NAME +
      '"',
  );
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] openUrlHint=https://docs.google.com/spreadsheets/d/' +
      ssId +
      '/edit',
  );

  /** @type {Object} */
  var out = {
    emailUsed: email,
    spreadsheetId: ssId,
    step: 'init',
    openOk: false,
    sheetFound: false,
    rowCount: 0,
    dataRowCount: 0,
    headerLabels: /** @type {string[]} */ ([]),
    colRole: -1,
    colEmail: -1,
    headerParseOk: false,
    emailRowMatch: false,
    thrownCode: null,
    errorMessage: null,
  };

  /** @type {GoogleAppsScript.Spreadsheet.Spreadsheet|null} */
  var spreadsheet = null;
  var sheet = null;
  try {
    RoleDirectory_trace_('[RoleDirectory_diagnostic] STEP_A openById…');
    spreadsheet = SpreadsheetApp.openById(ssId);
    out.openOk = true;
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] STEP_A OK name=' + spreadsheet.getName(),
    );
  } catch (e1) {
    out.step = 'open';
    out.thrownCode = 'ERR_ROLE_LOOKUP_OPEN';
    out.errorMessage = e1 && e1.message ? e1.message : String(e1);
    RoleDirectory_traceError_(e1);
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] STEP_A FAILED (see EXCEPTION lines above)',
    );
    return out;
  }
  try {
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] STEP_B getSheetByName("' +
        ROLE_DIR_SHEET_NAME +
        '")…',
    );
    sheet = spreadsheet.getSheetByName(ROLE_DIR_SHEET_NAME);
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] STEP_B sheet ' + (sheet ? 'OK' : 'NULL'),
    );
  } catch (e2) {
    out.step = 'open';
    out.thrownCode = 'ERR_ROLE_LOOKUP_OPEN';
    out.errorMessage = e2 && e2.message ? e2.message : String(e2);
    RoleDirectory_traceError_(e2);
    return out;
  }

  if (!sheet) {
    out.step = 'tab';
    out.thrownCode = 'ERR_ROLE_LOOKUP_TAB';
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] Sheet not found — tab "' +
        ROLE_DIR_SHEET_NAME +
        '" missing.',
    );
    return out;
  }
  out.sheetFound = true;
  var rows = sheet.getDataRange().getValues();
  out.rowCount = rows.length;
  if (!rows.length) {
    out.step = 'empty_sheet';
    RoleDirectory_trace_('[RoleDirectory_diagnostic] Empty sheet (0 rows).');
    return out;
  }
  out.dataRowCount = Math.max(0, rows.length - 1);
  out.headerLabels = rows[0].map(function (c) {
    return String(c || '').trim();
  });
  var header = rows[0];
  var hr;
  for (hr = 0; hr < header.length; hr++) {
    var hn = RoleDirectory_normalizeHeaderCell_(header[hr]);
    if (hn === 'rol' || hn === 'role') out.colRole = hr;
    if (
      hn === 'e-mail' ||
      hn === 'email' ||
      hn === 'correo' ||
      hn === 'mail'
    )
      out.colEmail = hr;
  }
  out.headerParseOk = out.colRole >= 0 && out.colEmail >= 0;
  if (!out.headerParseOk) {
    out.step = 'headers';
    out.thrownCode = 'ERR_ROLE_LOOKUP_COLS';
    RoleDirectory_trace_(
      '[RoleDirectory_diagnostic] Bad headers headerLabels=' +
        JSON.stringify(out.headerLabels),
    );
    return out;
  }
  out.step = 'scan_rows';
  var rw;
  for (rw = 1; rw < rows.length; rw++) {
    var row = rows[rw];
    var cellMail = String(row[out.colEmail] || '')
      .trim()
      .toLowerCase();
    if (cellMail && cellMail === email) {
      out.emailRowMatch = true;
      break;
    }
  }
  if (!out.emailRowMatch) out.step = 'no_email_row';
  else out.step = 'ok';
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] Result step=' +
      out.step +
      ' emailRowMatch=' +
      out.emailRowMatch +
      ' JSON=' +
      JSON.stringify(out),
  );
  return out;
}

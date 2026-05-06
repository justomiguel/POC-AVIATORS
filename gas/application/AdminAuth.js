/**
 * @fileoverview Autorización de modo administrador (solo servidor; revalidar en cada RPC).
 *
 * Fuente única: rol en la planilla de roles (pestaña «data», columna Rol).
 * Las etiquetas que cuentan como admin se configuran en la propiedad ADMIN_SHEET_ROLES
 * (coma-separada, case-insensitive). Default: Admin,Administrador,administrator.
 */

/**
 * @return {string[]}
 */
function AdminAuth_getSheetAdminRoleLabelsLower_() {
  var raw = (
    PropertiesService.getScriptProperties().getProperty('ADMIN_SHEET_ROLES') ||
    'Admin,Administrador,administrator'
  ).trim();
  var parts = raw.split(',');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var t = (parts[i] || '').trim().toLowerCase();
    if (t) out.push(t);
  }
  return out;
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailIsAdmin(email) {
  var normalized = ((email || '') + '').trim().toLowerCase();
  if (!normalized) return false;
  var rec = null;
  try { rec = RoleDirectory_lookupRole(email); } catch (e) { return false; }
  if (!rec || !rec.label) return false;
  var rl = rec.label.trim().toLowerCase();
  var admins = AdminAuth_getSheetAdminRoleLabelsLower_();
  for (var j = 0; j < admins.length; j++) {
    if (admins[j] === rl) return true;
  }
  return false;
}

/**
 * @return {boolean}
 */
function AdminAuth_sessionIsAdmin() {
  var email = Session.getActiveUser().getEmail();
  return AdminAuth_emailIsAdmin(email);
}

/**
 * Administración de agentes RAG / Agent API: excluye filas de rol preventa aunque
 * el correo esté en allowlist o la etiqueta cuente como admin en hoja.
 *
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_canManageAgents(email) {
  if (!AdminAuth_emailIsAdmin(email)) return false;
  return !RoleDirectory_emailIsPresale(email);
}

/**
 * @param {string} email
 * @return {{key:string,label:string}}
 */
function AdminAuth_roleMeta_(email) {
  try {
    var rec = RoleDirectory_lookupRole(email);
    return {
      key: rec && rec.key ? String(rec.key).trim().toLowerCase() : '',
      label: rec && rec.label ? String(rec.label).trim().toLowerCase() : '',
    };
  } catch (e) {
    return { key: '', label: '' };
  }
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailIsTechOrClientPartner(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  var meta = AdminAuth_roleMeta_(em);
  return meta.key === 'tech' ||
    meta.label === 'tech' ||
    meta.key === 'client_partner' ||
    meta.label === 'client partner';
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewAgents(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  return AdminAuth_canManageAgents(em) || AdminAuth_emailIsTechOrClientPartner(em);
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewCatalog(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  var isPresale = false;
  try { isPresale = RoleDirectory_emailIsPresale(em); } catch (ePresale) {}
  return AdminAuth_emailIsAdmin(em) ||
    isPresale ||
    AdminAuth_emailIsTechOrClientPartner(em);
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewMetrics(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  if (AdminAuth_emailIsAdmin(em)) return true;
  var isPresale = false;
  try { isPresale = RoleDirectory_emailIsPresale(em); } catch (ePresale) {}
  if (isPresale) return true;
  if (AdminAuth_emailIsTechOrClientPartner(em)) return true;
  var meta = AdminAuth_roleMeta_(em);
  return meta.key === 'manager' || meta.label === 'manager';
}

/**
 * @return {boolean}
 */
function AdminAuth_sessionCanManageAgents() {
  var email = Session.getActiveUser().getEmail();
  return AdminAuth_canManageAgents(email);
}

function AdminAuth_requireAgentsAdmin() {
  if (!AdminAuth_sessionCanManageAgents()) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

function AdminAuth_requireAgentsView() {
  var email = Session.getActiveUser().getEmail();
  if (!AdminAuth_emailCanViewAgents(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

function AdminAuth_requireAdmin() {
  if (!AdminAuth_sessionIsAdmin()) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

/**
 * @fileoverview Autorización de modo administrador (solo servidor; revalidar en cada RPC).
 *
 * Allowlist: propiedad del script **ADMIN_EMAILS** (coma-separada, case-insensitive).
 * Si está vacía, el único admin por defecto es justo.vargas@globant.com.
 */

var ADMIN_DEFAULT_EMAIL = 'justo.vargas@globant.com';

/**
 * @return {string[]}
 */
function AdminAuth_getAllowlist() {
  var raw = (
    PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || ''
  ).trim();
  var parts = raw.split(',');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var e = (parts[i] || '').trim().toLowerCase();
    if (e) out.push(e);
  }
  if (out.length === 0) out.push(ADMIN_DEFAULT_EMAIL);
  return out;
}

/**
 * Roles de la hoja «data» que cuentan como administrador (coma-separada, sin espacios obligatorios).
 * Propiedad: ADMIN_SHEET_ROLES — por defecto Admin,Administrador,administrator
 *
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
  var list = AdminAuth_getAllowlist();
  for (var i = 0; i < list.length; i++) {
    if (list[i] === normalized) return true;
  }
  var rec = RoleDirectory_lookupRole(email);
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

function AdminAuth_requireAdmin() {
  if (!AdminAuth_sessionIsAdmin()) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

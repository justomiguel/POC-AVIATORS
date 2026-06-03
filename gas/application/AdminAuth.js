/**
 * @fileoverview Autorización (solo servidor; revalidar en cada RPC).
 *
 * Fuente de roles por email: tabla `roles` en Supabase.
 * Matriz de permisos: app_settings `role_definitions` (AdminRoleConfigService).
 */

/**
 * @param {string} email
 * @return {string}
 */
function AdminAuth_roleKeyForEmail_(email) {
  try {
    return RoleDirectory_roleKeyForEmail_(email);
  } catch (ignore) {
    return '';
  }
}

/**
 * @param {string} roleKey
 * @param {string} permKey
 * @return {boolean}
 */
function AdminAuth_roleHasPermission_(roleKey, permKey) {
  return RoleConfig_roleHasPermission_(roleKey, permKey);
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailIsAdmin(email) {
  return AdminAuth_roleKeyForEmail_(email) === 'admin';
}

/**
 * @return {boolean}
 */
function AdminAuth_sessionIsAdmin() {
  var email = Session.getActiveUser().getEmail();
  return AdminAuth_emailIsAdmin(email);
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_canManageAgents(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'manage_agents');
}

/**
 * @param {string} email
 * @return {{key:string,label:string}}
 */
function AdminAuth_roleMeta_(email) {
  try {
    var rec = RoleDirectory_lookupRole(email);
    return {
      key: RoleDirectory_roleKeyFromRec_(rec),
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
function AdminAuth_emailCanViewAgents(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return (
    AdminAuth_roleHasPermission_(k, 'view_agents') ||
    AdminAuth_roleHasPermission_(k, 'manage_agents')
  );
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewCatalog(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return (
    AdminAuth_roleHasPermission_(k, 'view_catalog') ||
    AdminAuth_roleHasPermission_(k, 'write_catalog')
  );
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanWriteCatalog(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'write_catalog');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewMetrics(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'view_metrics');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanResetMetrics(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'reset_metrics');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanManageUsers(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'manage_users');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanViewOnboarding(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'view_onboarding');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanManageUnansweredQueue(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'manage_unanswered_queue');
}

/**
 * @param {string} email
 * @return {boolean}
 */
function AdminAuth_emailCanSyncSalesforce(email) {
  var k = AdminAuth_roleKeyForEmail_(email);
  if (!k) return false;
  return AdminAuth_roleHasPermission_(k, 'sync_salesforce');
}

function AdminAuth_requireOnboardingView() {
  var email = Session.getActiveUser().getEmail();
  if (!AdminAuth_emailCanViewOnboarding(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_onboarding_forbidden'));
  }
}

function AdminAuth_requireSyncSalesforce() {
  var email = Session.getActiveUser().getEmail();
  if (!AdminAuth_emailCanSyncSalesforce(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
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

/**
 * Gestión de usuarios / solicitudes de acceso (misma puerta que canManageUsers en bootstrap).
 */
function AdminAuth_requireManageUsers() {
  var email = Session.getActiveUser().getEmail();
  if (!AdminAuth_emailCanManageUsers(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

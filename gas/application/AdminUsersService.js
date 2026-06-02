/**
 * @fileoverview Gestión de visitantes y roles (solo admin).
 */

var ADMIN_USERS_PAGE_MAX = 100;
var ADMIN_USERS_PAGE_DEFAULT = 25;

/**
 * @param {string} roleKey
 * @return {boolean}
 */
function AdminUsers_isAllowedRoleKey_(roleKey) {
  return RoleConfig_isKnownRoleKey_(roleKey);
}

/**
 * @param {string} roleKey
 * @param {string} [locale]
 * @return {string}
 */
function AdminUsers_roleLabelForKey_(roleKey, locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var k = String(roleKey || '').trim().toLowerCase();
  var role = RoleConfig_findRole_(k);
  if (role && role.label) {
    return String(role.label[loc] || role.label.es || k).trim() || k;
  }
  return k || UiStrings_t(loc, 'role_option_miembro');
}

/**
 * @param {Object} [filters]
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function AdminUsers_listVisitors(filters) {
  AdminAuth_requireAdmin();
  var f = filters || {};
  var q = String(f.q || '').trim().toLowerCase();
  var skip = f.skip != null ? Math.max(0, Number(f.skip)) : 0;
  var limit =
    f.limit != null && Number(f.limit) > 0
      ? Math.min(ADMIN_USERS_PAGE_MAX, Number(f.limit))
      : ADMIN_USERS_PAGE_DEFAULT;

  var rows = VisitorsStore_listAll();
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var api = VisitorsStore_toApiItem_(rows[i]);
    if (!api.email) continue;
    if (q) {
      var hay =
        (api.email + ' ' + api.display_name).toLowerCase();
      if (hay.indexOf(q) < 0) continue;
    }
    items.push(api);
  }
  var total = items.length;
  var page = items.slice(skip, skip + limit);
  return {
    ok: true,
    items: page,
    total: total,
    skip: skip,
    limit: limit,
    hasMore: skip + page.length < total,
  };
}

/**
 * @param {Object} [filters]
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function AdminUsers_listRoles(filters) {
  AdminAuth_requireAdmin();
  var f = filters || {};
  var q = String(f.q || '').trim().toLowerCase();
  var skip = f.skip != null ? Math.max(0, Number(f.skip)) : 0;
  var limit =
    f.limit != null && Number(f.limit) > 0
      ? Math.min(ADMIN_USERS_PAGE_MAX, Number(f.limit))
      : ADMIN_USERS_PAGE_DEFAULT;

  var rows = RoleDirectoryStore_listAll();
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var api = RoleDirectoryStore_toApiItem_(rows[i]);
    if (!api.email) continue;
    if (q) {
      var hay =
        (api.email + ' ' + api.role_label + ' ' + api.role_key).toLowerCase();
      if (hay.indexOf(q) < 0) continue;
    }
    items.push(api);
  }
  items.sort(function (a, b) {
    return a.email.localeCompare(b.email);
  });
  var total = items.length;
  var page = items.slice(skip, skip + limit);
  return {
    ok: true,
    items: page,
    total: total,
    skip: skip,
    limit: limit,
    hasMore: skip + page.length < total,
  };
}

/**
 * @return {Array<{key:string,label:string}>}
 */
function AdminUsers_roleOptions() {
  AdminAuth_requireAdmin();
  return RoleConfig_roleOptionsForUi_(UiStrings_activeLocale_());
}

/**
 * @param {string} email
 * @param {string} roleKey
 * @return {{ok:boolean,email:string,role_key:string,role_label:string}}
 */
function AdminUsers_assignRole(email, roleKey) {
  AdminAuth_requireAdmin();
  var em = String(email || '').trim().toLowerCase();
  if (!em || em.indexOf('@') < 1) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'admin_users_err_email'));
  }
  var key = String(roleKey || '').trim().toLowerCase();
  if (!AdminUsers_isAllowedRoleKey_(key)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'admin_users_err_role'));
  }
  var locale = UiStrings_activeLocale_();
  var label = AdminUsers_roleLabelForKey_(key, locale);
  var now = new Date().toISOString();
  RoleDirectoryStore_upsert({
    email: em,
    role_key: key,
    role_label: label,
    updated_at: now,
  });
  try {
    VisitorsStore_delete(em);
  } catch (ignoreVisitor) {}
  try {
    AccessRequest_markApprovedForEmail_(
      em,
      String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(),
    );
  } catch (ignoreRequest) {}
  RoleDirectory_invalidateCache_(em);
  return { ok: true, email: em, role_key: key, role_label: label };
}

/**
 * @param {string} email
 * @param {string} roleKey
 * @return {{ok:boolean,email:string,role_key:string,role_label:string}}
 */
function AdminUsers_updateRole(email, roleKey) {
  return AdminUsers_assignRole(email, roleKey);
}

/**
 * @param {string} email
 * @return {{ok:boolean,email:string}}
 */
function AdminUsers_removeRole(email) {
  AdminAuth_requireAdmin();
  var em = String(email || '').trim().toLowerCase();
  if (!em || em.indexOf('@') < 1) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'admin_users_err_email'));
  }
  RoleDirectoryStore_delete(em);
  RoleDirectory_invalidateCache_(em);
  return { ok: true, email: em };
}

/**
 * Registra visitante al iniciar sesión (sin bloquear si falla Supabase).
 * @param {string} email
 * @param {string} [displayName]
 */
function AdminUsers_touchVisitorSession_(email, displayName) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var em = String(email || '').trim().toLowerCase();
  if (!em) return;
  try {
    if (RoleDirectoryStore_lookup(em)) return;
  } catch (ignoreRole) {
    return;
  }
  try {
    VisitorsStore_touchSession(em, displayName);
  } catch (eTouch) {
    Logger.log(
      '[AdminUsers_touchVisitorSession_] ' +
        (eTouch && eTouch.message ? eTouch.message : String(eTouch)),
    );
  }
}

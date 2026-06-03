/**
 * @fileoverview Solicitudes de acceso para visitantes y revisión admin.
 */

var ACCESS_REQUEST_REASON_MAX = 2000;
var ACCESS_REQUEST_PAGE_MAX = 100;
var ACCESS_REQUEST_PAGE_DEFAULT = 25;

/** Roles que un visitante puede solicitar (nunca admin). */
var ACCESS_REQUEST_BLOCKED_ROLE_KEYS = ['admin'];

/**
 * @return {string}
 */
function AccessRequest_activeEmail_() {
  return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
}

/**
 * @return {boolean}
 */
function AccessRequest_isVisitor_() {
  var email = AccessRequest_activeEmail_();
  if (!email) return false;
  try {
    return !RoleDirectory_lookupRole(email);
  } catch (ignore) {
    return true;
  }
}

/**
 * @param {string} [locale]
 * @return {Array<{key:string,label:string}>}
 */
function AccessRequest_roleOptionsForVisitor_(locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var all = RoleConfig_roleOptionsForUi_(loc);
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var k = String(all[i].key || '').trim().toLowerCase();
    if (!k || ACCESS_REQUEST_BLOCKED_ROLE_KEYS.indexOf(k) >= 0) continue;
    out.push({ key: k, label: all[i].label || k });
  }
  return out;
}

/**
 * @param {string} roleKey
 * @param {string} [locale]
 * @return {boolean}
 */
function AccessRequest_isAllowedDesiredRole_(roleKey, locale) {
  var k = String(roleKey || '').trim().toLowerCase();
  if (!k || ACCESS_REQUEST_BLOCKED_ROLE_KEYS.indexOf(k) >= 0) return false;
  if (!RoleConfig_isKnownRoleKey_(k)) return false;
  var opts = AccessRequest_roleOptionsForVisitor_(locale);
  for (var i = 0; i < opts.length; i++) {
    if (opts[i].key === k) return true;
  }
  return false;
}

/**
 * @return {Array<{key:string,label:string}>}
 */
function AccessRequest_roleOptions() {
  if (!AccessRequest_activeEmail_()) {
    throw new Error('ERR_ACCESS_REQUEST_NO_SESSION');
  }
  return AccessRequest_roleOptionsForVisitor_(UiStrings_activeLocale_());
}

/**
 * @return {{ok:boolean,request:Object|null}}
 */
function AccessRequest_getMine() {
  var email = AccessRequest_activeEmail_();
  if (!email) {
    throw new Error('ERR_ACCESS_REQUEST_NO_SESSION');
  }
  if (!AccessRequest_isVisitor_()) {
    return { ok: true, request: null };
  }
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    throw new Error('ERR_SUPABASE_NOT_CONFIGURED');
  }
  var pending = AccessRequestsStore_getPendingByEmail(email);
  return {
    ok: true,
    request: pending ? AccessRequestsStore_toApiItem_(pending) : null,
  };
}

/**
 * @param {string} roleKey
 * @param {string} reason
 * @return {{ok:boolean,request:Object}}
 */
function AccessRequest_submit(roleKey, reason) {
  var locale = UiStrings_activeLocale_();
  var email = AccessRequest_activeEmail_();
  if (!email) {
    throw new Error('ERR_ACCESS_REQUEST_NO_SESSION');
  }
  if (!AccessRequest_isVisitor_()) {
    throw new Error('ERR_ACCESS_REQUEST_NOT_VISITOR');
  }
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    throw new Error('ERR_SUPABASE_NOT_CONFIGURED');
  }
  var key = String(roleKey || '').trim().toLowerCase();
  if (!AccessRequest_isAllowedDesiredRole_(key, locale)) {
    throw new Error('ERR_ACCESS_REQUEST_INVALID_ROLE');
  }
  var reasonText = String(reason || '').trim();
  if (!reasonText) {
    throw new Error('ERR_ACCESS_REQUEST_REASON_REQUIRED');
  }
  if (reasonText.length > ACCESS_REQUEST_REASON_MAX) {
    throw new Error('ERR_ACCESS_REQUEST_REASON_TOO_LONG');
  }
  if (AccessRequestsStore_getPendingByEmail(email)) {
    throw new Error('ERR_ACCESS_REQUEST_ALREADY_PENDING');
  }
  var card = SessionProfile_getGoogleCard_();
  var localPart = email.split('@')[0] || email;
  var label = AdminUsers_roleLabelForKey_(key, locale);
  var row = AccessRequestsStore_insert({
    email: email,
    display_name: card.displayName || localPart,
    desired_role_key: key,
    desired_role_label: label,
    reason: reasonText,
  });
  var api = AccessRequestsStore_toApiItem_(row);
  try {
    AccessRequestMail_notifyAdmins_(api, locale);
  } catch (ignoreMail) {}
  return { ok: true, request: api };
}

/**
 * @param {Object} [filters]
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function AccessRequest_listForAdmin(filters) {
  AdminAuth_requireManageUsers();
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    throw new Error('ERR_SUPABASE_NOT_CONFIGURED');
  }
  var f = filters || {};
  var q = String(f.q || '').trim().toLowerCase();
  var status = String(f.status || 'pending').trim().toLowerCase();
  if (
    status !== ACCESS_REQUEST_STATUS.PENDING &&
    status !== ACCESS_REQUEST_STATUS.APPROVED &&
    status !== ACCESS_REQUEST_STATUS.DISMISSED &&
    status !== 'all'
  ) {
    status = ACCESS_REQUEST_STATUS.PENDING;
  }
  var skip = f.skip != null ? Math.max(0, Number(f.skip)) : 0;
  var limit =
    f.limit != null && Number(f.limit) > 0
      ? Math.min(ACCESS_REQUEST_PAGE_MAX, Number(f.limit))
      : ACCESS_REQUEST_PAGE_DEFAULT;

  var rows = AccessRequestsStore_listAll();
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var api = AccessRequestsStore_toApiItem_(rows[i]);
    if (status !== 'all' && api.status !== status) continue;
    if (q) {
      var hay =
        (
          api.email +
          ' ' +
          api.display_name +
          ' ' +
          api.desired_role_label +
          ' ' +
          api.desired_role_key +
          ' ' +
          api.reason
        ).toLowerCase();
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
 * @param {string} requestId
 * @return {{ok:boolean,id:string}}
 */
function AccessRequest_dismiss(requestId) {
  AdminAuth_requireManageUsers();
  var id = String(requestId || '').trim();
  if (!id) {
    throw new Error('ERR_ACCESS_REQUEST_ID_REQUIRED');
  }
  var reviewer = AccessRequest_activeEmail_();
  AccessRequestsStore_updateStatus(id, ACCESS_REQUEST_STATUS.DISMISSED, reviewer);
  return { ok: true, id: id };
}

/**
 * Marca solicitudes pendientes como aprobadas al asignar rol (llamado desde AdminUsers).
 * @param {string} email
 * @param {string} [reviewerEmail]
 */
function AccessRequest_markApprovedForEmail_(email, reviewerEmail) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  try {
    AccessRequestsStore_updatePendingForEmail(
      email,
      ACCESS_REQUEST_STATUS.APPROVED,
      reviewerEmail,
    );
  } catch (ignore) {}
}

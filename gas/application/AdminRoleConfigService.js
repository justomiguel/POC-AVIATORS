/**
 * @fileoverview Catálogo de roles y matriz de permisos (solo admin).
 */

var ROLE_CONFIG_CACHE_SEC = 120;

var ROLE_CONFIG_PERMISSION_KEYS = [
  'view_agents',
  'manage_agents',
  'view_catalog',
  'view_tags',
  'view_clients',
  'write_catalog',
  'view_onboarding',
  'view_metrics',
  'reset_metrics',
  'manage_users',
  'manage_unanswered_queue',
  'sync_salesforce',
  'view_knowledge_graph',
];

/** Permisos añadidos en matriz v2: se heredan del default del rol sistema si no estaban guardados. */
var ROLE_CONFIG_PERMISSION_KEYS_V2_ADDED = [
  'view_onboarding',
  'manage_unanswered_queue',
  'sync_salesforce',
  'view_tags',
  'view_clients',
  'view_knowledge_graph',
];

/** @type {Object<string, 'read'|'write'>} */
var ROLE_CONFIG_PERMISSION_KIND = {
  view_agents: 'read',
  view_catalog: 'read',
  view_tags: 'read',
  view_clients: 'read',
  view_onboarding: 'read',
  view_metrics: 'read',
  view_knowledge_graph: 'read',
  manage_agents: 'write',
  write_catalog: 'write',
  reset_metrics: 'write',
  manage_users: 'write',
  manage_unanswered_queue: 'write',
  sync_salesforce: 'write',
};

/**
 * @param {string} permKey
 * @return {'read'|'write'}
 */
function RoleConfig_permissionKind_(permKey) {
  var k = String(permKey || '').trim();
  return ROLE_CONFIG_PERMISSION_KIND[k] === 'write' ? 'write' : 'read';
}

/**
 * @param {string} permKey
 * @return {boolean}
 */
function RoleConfig_isNewPermissionKey_(permKey) {
  var p = String(permKey || '').trim();
  for (var i = 0; i < ROLE_CONFIG_PERMISSION_KEYS_V2_ADDED.length; i++) {
    if (ROLE_CONFIG_PERMISSION_KEYS_V2_ADDED[i] === p) return true;
  }
  return false;
}

/**
 * @return {Array<Object>}
 */
function RoleConfig_defaultRoles_() {
  return [
    {
      key: 'admin',
      label: { es: 'Admin', en: 'Admin' },
      system: true,
      permissions: RoleConfig_allPermissionsTrue_(),
    },
    {
      key: 'presales',
      label: { es: 'Presales', en: 'Presales' },
      system: true,
      permissions: {
        view_catalog: true,
        view_tags: true,
        view_clients: true,
        write_catalog: true,
        view_onboarding: true,
        view_metrics: true,
        manage_unanswered_queue: true,
        view_knowledge_graph: true,
      },
    },
    {
      key: 'manager',
      label: { es: 'Manager', en: 'Manager' },
      system: true,
      permissions: { view_onboarding: true, view_metrics: true },
    },
    {
      key: 'tech',
      label: { es: 'Tech', en: 'Tech' },
      system: true,
      permissions: {
        view_agents: true,
        view_catalog: true,
        view_tags: true,
        view_clients: true,
        view_onboarding: true,
        view_metrics: true,
        view_knowledge_graph: true,
      },
    },
    {
      key: 'client_partner',
      label: { es: 'Client Partner', en: 'Client Partner' },
      system: true,
      permissions: {
        view_agents: true,
        view_catalog: true,
        view_tags: true,
        view_clients: true,
        view_onboarding: true,
        view_metrics: true,
      },
    },
    {
      key: 'miembro',
      label: { es: 'Miembro', en: 'Member' },
      system: true,
      permissions: { view_onboarding: true },
    },
  ];
}

/**
 * @return {Object<string, boolean>}
 */
function RoleConfig_allPermissionsTrue_() {
  var out = {};
  for (var i = 0; i < ROLE_CONFIG_PERMISSION_KEYS.length; i++) {
    out[ROLE_CONFIG_PERMISSION_KEYS[i]] = true;
  }
  return out;
}

/**
 * @param {Object} raw
 * @return {Object}
 */
function RoleConfig_normalizeStored_(raw) {
  var defaults = RoleConfig_defaultRoles_();
  if (!raw || !raw.roles || !raw.roles.length) {
    return { version: 1, roles: defaults };
  }
  var byKey = {};
  var i;
  for (i = 0; i < defaults.length; i++) {
    byKey[defaults[i].key] = defaults[i];
  }
  for (i = 0; i < raw.roles.length; i++) {
    var r = raw.roles[i];
    var key = String(r.key || '').trim().toLowerCase();
    if (!key) continue;
    var base = byKey[key] || {
      key: key,
      label: { es: key, en: key },
      system: false,
      permissions: {},
    };
    var label = r.label && typeof r.label === 'object' ? r.label : base.label;
    var permsIn = r.permissions && typeof r.permissions === 'object' ? r.permissions : {};
    var permsOut = {};
    var j;
    for (j = 0; j < ROLE_CONFIG_PERMISSION_KEYS.length; j++) {
      var pk = ROLE_CONFIG_PERMISSION_KEYS[j];
      if (key === 'admin') {
        permsOut[pk] = true;
      } else if (permsIn[pk]) {
        permsOut[pk] = true;
      } else if (
        base.system &&
        base.permissions &&
        base.permissions[pk] &&
        RoleConfig_isNewPermissionKey_(pk) &&
        !Object.prototype.hasOwnProperty.call(permsIn, pk)
      ) {
        permsOut[pk] = true;
      }
    }
    if (key !== 'admin' && !Object.prototype.hasOwnProperty.call(permsIn, 'view_tags')) {
      if (
        permsOut.view_tags ||
        permsOut.view_catalog ||
        permsIn.view_catalog ||
        permsOut.write_catalog ||
        permsIn.write_catalog
      ) {
        permsOut.view_tags = true;
      }
    }
    if (key !== 'admin' && !Object.prototype.hasOwnProperty.call(permsIn, 'view_clients')) {
      if (
        permsOut.view_clients ||
        permsOut.view_catalog ||
        permsIn.view_catalog ||
        permsOut.write_catalog ||
        permsIn.write_catalog
      ) {
        permsOut.view_clients = true;
      }
    }
    byKey[key] = {
      key: key,
      label: {
        es: String(label.es || base.label.es || key).trim() || key,
        en: String(label.en || base.label.en || key).trim() || key,
      },
      system: key === 'admin' ? true : !!r.system || !!base.system,
      permissions: permsOut,
    };
  }
  var roles = [];
  var seen = {};
  for (i = 0; i < raw.roles.length; i++) {
    var rk = String(raw.roles[i].key || '').trim().toLowerCase();
    if (!rk || seen[rk] || !byKey[rk]) continue;
    seen[rk] = true;
    roles.push(byKey[rk]);
  }
  for (i = 0; i < defaults.length; i++) {
    var dk = defaults[i].key;
    if (!seen[dk]) {
      seen[dk] = true;
      roles.push(byKey[dk]);
    }
  }
  return { version: 1, roles: roles };
}

function RoleConfig_invalidateCache_() {
  try {
    CacheService.getScriptCache().remove('role_cfg_v1');
  } catch (ignore) {}
}

/**
 * @return {Object}
 */
function RoleConfig_getDefinitions() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('role_cfg_v1');
  if (hit) {
    try {
      return JSON.parse(hit);
    } catch (ignoreParse) {}
  }
  var raw = null;
  if (AviatorsDataBackend_supabaseConfigured_()) {
    try {
      raw = RoleConfigStore_loadRaw_();
    } catch (ignoreLoad) {}
  }
  var normalized = RoleConfig_normalizeStored_(raw);
  try {
    cache.put('role_cfg_v1', JSON.stringify(normalized), ROLE_CONFIG_CACHE_SEC);
  } catch (ignorePut) {}
  return normalized;
}

/**
 * @param {string} roleKey
 * @return {Object|null}
 */
function RoleConfig_findRole_(roleKey) {
  var k = String(roleKey || '').trim().toLowerCase();
  if (!k) return null;
  var defs = RoleConfig_getDefinitions();
  for (var i = 0; i < defs.roles.length; i++) {
    if (defs.roles[i].key === k) return defs.roles[i];
  }
  return null;
}

/**
 * @param {string} roleKey
 * @param {string} permKey
 * @return {boolean}
 */
function RoleConfig_roleHasPermission_(roleKey, permKey) {
  var k = String(roleKey || '').trim().toLowerCase();
  var p = String(permKey || '').trim();
  if (!k || !p) return false;
  if (k === 'admin') return true;
  var role = RoleConfig_findRole_(k);
  if (!role || !role.permissions) return false;
  return !!role.permissions[p];
}

/**
 * @param {string} [locale]
 * @return {Array<{key:string,label:string}>}
 */
function RoleConfig_roleOptionsForUi_(locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var defs = RoleConfig_getDefinitions();
  var out = [];
  for (var i = 0; i < defs.roles.length; i++) {
    var r = defs.roles[i];
    out.push({
      key: r.key,
      label: String(r.label[loc] || r.label.es || r.key).trim() || r.key,
    });
  }
  return out;
}

/**
 * @param {string} roleKey
 * @return {boolean}
 */
function RoleConfig_isKnownRoleKey_(roleKey) {
  return !!RoleConfig_findRole_(roleKey);
}

/**
 * @param {string} roleKey
 * @return {number}
 */
function RoleConfig_countUsersWithRole_(roleKey) {
  var k = String(roleKey || '').trim().toLowerCase();
  if (!k) return 0;
  try {
    var rows = RoleDirectoryStore_listAll();
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      var rk = String(rows[i].role_key || '').trim().toLowerCase();
      if (rk === k) n++;
    }
    return n;
  } catch (ignore) {
    return 0;
  }
}

/**
 * @return {{ok:boolean,permissions:Array<Object>,roles:Array<Object>}}
 */
function AdminRoleConfig_get() {
  AdminAuth_requireAdmin();
  var locale = UiStrings_activeLocale_();
  var defs = RoleConfig_getDefinitions();
  var permCatalog = [];
  for (var i = 0; i < ROLE_CONFIG_PERMISSION_KEYS.length; i++) {
    var pk = ROLE_CONFIG_PERMISSION_KEYS[i];
    permCatalog.push({
      key: pk,
      kind: RoleConfig_permissionKind_(pk),
      label: UiStrings_t(locale, 'role_perm_' + pk),
      description: UiStrings_t(locale, 'role_perm_' + pk + '_desc'),
    });
  }
  var rolesOut = [];
  for (var j = 0; j < defs.roles.length; j++) {
    var r = defs.roles[j];
    rolesOut.push({
      key: r.key,
      label: r.label,
      system: !!r.system,
      permissions: r.permissions || {},
      userCount: RoleConfig_countUsersWithRole_(r.key),
    });
  }
  return { ok: true, permissions: permCatalog, roles: rolesOut };
}

/**
 * @param {string} configJson
 * @return {{ok:boolean}}
 */
function AdminRoleConfig_save(configJson) {
  AdminAuth_requireAdmin();
  AviatorsDataBackend_requireSupabase_();
  var parsed;
  try {
    parsed = JSON.parse(String(configJson || '{}'));
  } catch (eParse) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_invalid'));
  }
  if (!parsed || !parsed.roles || !parsed.roles.length) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_empty'));
  }
  var normalized = RoleConfig_normalizeStored_(parsed);
  var hasAdmin = false;
  for (var i = 0; i < normalized.roles.length; i++) {
    if (normalized.roles[i].key === 'admin') {
      hasAdmin = true;
      normalized.roles[i].system = true;
      normalized.roles[i].permissions = RoleConfig_allPermissionsTrue_();
    }
  }
  if (!hasAdmin) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_no_admin'));
  }
  RoleConfigStore_saveRaw_(normalized);
  RoleConfig_invalidateCache_();
  return { ok: true };
}

/**
 * @param {string} key
 * @param {string} labelEs
 * @param {string} labelEn
 * @return {{ok:boolean,role:Object}}
 */
function AdminRoleConfig_addRole(key, labelEs, labelEn) {
  AdminAuth_requireAdmin();
  AviatorsDataBackend_requireSupabase_();
  var k = String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (!k || k.length < 2) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_key'));
  }
  if (RoleConfig_findRole_(k)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_dup'));
  }
  var defs = RoleConfig_getDefinitions();
  defs.roles.push({
    key: k,
    label: {
      es: String(labelEs || k).trim() || k,
      en: String(labelEn || labelEs || k).trim() || k,
    },
    system: false,
    permissions: {},
  });
  RoleConfigStore_saveRaw_(defs);
  RoleConfig_invalidateCache_();
  return {
    ok: true,
    role: {
      key: k,
      label: defs.roles[defs.roles.length - 1].label,
      system: false,
      permissions: {},
      userCount: 0,
    },
  };
}

/**
 * @param {string} key
 * @return {{ok:boolean}}
 */
function AdminRoleConfig_removeRole(key) {
  AdminAuth_requireAdmin();
  AviatorsDataBackend_requireSupabase_();
  var k = String(key || '').trim().toLowerCase();
  if (!k) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_key'));
  }
  if (k === 'admin') {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_admin_delete'));
  }
  var role = RoleConfig_findRole_(k);
  if (!role) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_not_found'));
  }
  if (role.system) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'role_config_err_system'));
  }
  var users = RoleConfig_countUsersWithRole_(k);
  if (users > 0) {
    throw new Error(
      UiStrings_fmt_(UiStrings_activeLocale_(), 'role_config_err_in_use', { count: users }),
    );
  }
  var defs = RoleConfig_getDefinitions();
  var next = [];
  for (var i = 0; i < defs.roles.length; i++) {
    if (defs.roles[i].key !== k) next.push(defs.roles[i]);
  }
  defs.roles = next;
  RoleConfigStore_saveRaw_(defs);
  RoleConfig_invalidateCache_();
  return { ok: true };
}

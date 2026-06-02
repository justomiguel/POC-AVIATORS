/**
 * @fileoverview Backend de datos operativos (Supabase únicamente).
 */

var AVIATORS_DATA_BACKEND_SUPABASE = 'supabase';

/**
 * @return {boolean}
 */
function AviatorsDataBackend_supabaseConfigured_() {
  return (
    !!AviatorsConfig_scriptProp_(AVIATORS_PROP.SUPABASE_URL) &&
    !!AviatorsConfig_scriptProp_(AVIATORS_PROP.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * @return {string} supabase
 */
function AviatorsDataBackend_mode_() {
  var explicit = AviatorsConfig_scriptProp_(AVIATORS_PROP.DATA_BACKEND).toLowerCase();
  if (explicit === 'sheets') {
    throw new Error('ERR_SUPABASE_SHEETS_DISABLED');
  }
  AviatorsDataBackend_requireSupabase_();
  return AVIATORS_DATA_BACKEND_SUPABASE;
}

/**
 * @return {boolean}
 */
function AviatorsDataBackend_useSupabase_() {
  AviatorsDataBackend_requireSupabase_();
  return true;
}

/**
 * Exige Supabase configurado (runtime operativo, migración y reset).
 */
function AviatorsDataBackend_requireSupabase_() {
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    throw new Error('ERR_SUPABASE_NOT_CONFIGURED');
  }
}

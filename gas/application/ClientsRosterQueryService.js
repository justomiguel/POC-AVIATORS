/**
 * @fileoverview Consultas de nómina/cartera de clientes desde Supabase (roster Salesforce + maestro).
 * Usado por el agente clients sin depender del índice RAG de PDFs en Globant.
 */

/** @type {number} */
var CLIENTS_ROSTER_QUERY_MAX_ROWS_ = 100;

/**
 * En Aviators, «vendedor», «client partner» y «account owner» son el mismo rol (campo account_owner).
 * @param {string} qNorm pregunta ya normalizada (minúsculas, sin acentos)
 * @return {string}
 */
function ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(qNorm) {
  var q = String(qNorm || '');
  q = q.replace(/\bclient\s+partners?\b/g, 'account owner');
  q = q.replace(/\bvendedor(?:a|es)?\b/g, 'account owner');
  q = q.replace(/\bsales\s+persons?\b/g, 'account owner');
  q = q.replace(/\bsales\s+reps?\b/g, 'account owner');
  return q.replace(/\s+/g, ' ').trim();
}

/**
 * Etiqueta unificada del campo (mismo concepto en es/en).
 * @return {string}
 */
function ClientsRosterQuery_ownerFieldLabel_() {
  return 'Account Owner / Client Partner / Vendedor';
}

/**
 * @param {string} hint
 * @return {string}
 */
function ClientsRosterQuery_cleanOwnerHint_(hint) {
  var h = String(hint || '').trim().replace(/\s+/g, ' ');
  h = h.replace(
    /^(?:el|la|los|las|the)\s+(?:account owner|vendedor(?:a)?|client partner)\s+/,
    '',
  );
  h = h.replace(
    /^(?:account owner|vendedor(?:a)?|client partner)\s+(?:de|del|of|for)\s+/,
    '',
  );
  return h.trim();
}

/**
 * En el negocio Aviators, «aviación» en el chat ≈ subindustria Passenger Airlines (Salesforce).
 * Fallback de industria si esa subindustria aún no está en el catálogo.
 */
var CLIENTS_ROSTER_PASSENGER_AIRLINES_SUB_HINTS_ = [
  'Passenger Airlines',
  'passenger airlines',
];

/** @type {Array<string>} */
var CLIENTS_ROSTER_AVIATION_INDUSTRIES_FALLBACK_ = ['Aerolineas'];

/**
 * @return {boolean}
 */
function ClientsRosterQuery_hasRosterData_() {
  try {
    var sf = SalesforceAccountsStore_listAll();
    if (sf && sf.length) return true;
    var cm = ClientsMasterStore_listAll();
    return !!(cm && cm.length);
  } catch (e) {
    console.log('[CLIENTS-ROSTER] hasData error: ' + String(e.message || e));
    return false;
  }
}

/**
 * @param {string} question
 * @param {string} clientNameDetected
 * @return {boolean}
 */
/**
 * @param {string} qNorm pregunta normalizada
 * @return {boolean}
 */
function ClientsRosterQuery_isOwnerRosterQuestion_(qNorm) {
  var q = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(qNorm);
  return /(que cuentas|which accounts|cuentas tiene|accounts does|accounts for|cuentas de |cuentas del |clientes de |clientes del |accounts owned|owned by|a cargo de|account owner|dueno de cuenta|dueño de cuenta|de quien es|whose accounts|cuantas cuentas tiene|how many accounts does|cuentas a cargo)/.test(
    q,
  );
}

/**
 * @param {string} owner
 * @param {string} hint
 * @return {boolean}
 */
function ClientsRosterQuery_ownerMatchesHint_(owner, hint) {
  var ownerNorm = ClientsRosterQuery_norm_(owner);
  var hintNorm = ClientsRosterQuery_norm_(hint);
  if (!hintNorm) return true;
  if (!ownerNorm) return false;
  if (ownerNorm.indexOf(hintNorm) >= 0 || hintNorm.indexOf(ownerNorm) >= 0) return true;
  var parts = ownerNorm.split(/\s+/);
  var hi;
  for (hi = 0; hi < parts.length; hi++) {
    if (!parts[hi]) continue;
    if (parts[hi] === hintNorm) return true;
    if (hintNorm.length >= 4 && parts[hi].indexOf(hintNorm) === 0) return true;
  }
  return false;
}

/**
 * @param {string} qNorm
 * @return {string}
 */
function ClientsRosterQuery_extractOwnerHintFromQuestion_(qNorm) {
  var q = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(qNorm);
  var patterns = [
    /(?:que\s+)?cuentas?\s+tiene\s+(?:el\s+)?(?:account owner\s+)?([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,| en | con | y )/,
    /(?:cuantas|how many)\s+cuentas?\s+tiene\s+(?:el\s+)?(?:account owner\s+)?([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,)/,
    /cuentas?\s+(?:de|del)\s+(?:el\s+)?(?:account owner\s+)?([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,)/,
    /clientes?\s+(?:de|del)\s+(?:el\s+)?(?:account owner\s+)?([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,)/,
    /accounts?\s+(?:for|owned by|does)\s+(?:account owner\s+)?([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,)/,
    /account owner\s+(?:de|del|for|of)\s+([a-z][a-z\s.]{1,48}?)(?:\?|$|\.|,)/,
  ];
  var pi;
  for (pi = 0; pi < patterns.length; pi++) {
    var m = q.match(patterns[pi]);
    if (m && m[1]) {
      var hint = ClientsRosterQuery_cleanOwnerHint_(String(m[1]).trim().replace(/\s+/g, ' '));
      if (hint.length >= 2) return hint;
    }
  }
  return '';
}

/**
 * @param {string} question
 * @return {string}
 */
function ClientsRosterQuery_resolveOwnerFromQuestion_(question) {
  var qNorm = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(
    ClientsRosterQuery_norm_(question),
  );
  if (!qNorm) return '';
  var rows;
  try {
    rows = SalesforceAccountsStore_listAll();
  } catch (ignoreList) {
    return ClientsRosterQuery_extractOwnerHintFromQuestion_(qNorm);
  }
  var best = '';
  var bestLen = 0;
  var i;
  for (i = 0; i < rows.length; i++) {
    var owner = String(rows[i].account_owner || '').trim();
    if (!owner) continue;
    var ownerNorm = ClientsRosterQuery_norm_(owner);
    if (ownerNorm.length < 3) continue;
    if (qNorm.indexOf(ownerNorm) >= 0 && ownerNorm.length > bestLen) {
      best = owner;
      bestLen = ownerNorm.length;
    }
  }
  if (best) return best;
  var extracted = ClientsRosterQuery_extractOwnerHintFromQuestion_(qNorm);
  if (extracted) return extracted;
  return '';
}

function ClientsRosterQuery_isRosterQuestion_(question, clientNameDetected) {
  var q = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(
    String(question || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  );
  if (!q) return false;

  if (ClientsRosterQuery_isOwnerRosterQuestion_(q)) return true;

  var rosterCue =
    /(que clientes|cuales clientes|which clients|que cuentas|which accounts|lista(r)? de clientes|list of clients|listado|nomina|n[oó]mina|cuentas activas|active accounts|clientes activos|active clients|cuantos clientes|how many clients|cuenta[s]? tenemos|clients do we|client roster|salesforce roster|cartera de clientes|client portfolio|por industria|by industry|en aviacion|in aviation|subindustria|sub-industry|account owner|owners de|due[n]?o de cuenta|tiene globant)/.test(
      q,
    );
  var listCue =
    /(todos los clientes|all clients|todas las cuentas|all accounts|mostrar clientes|show clients|tenemos activos|have active)/.test(
      q,
    );
  var countCue = /(cuantos|how many|total de clientes|total clients|cantidad de clientes)/.test(q);
  var accountFactCue =
    /(oportunidad|opportunit|account owner|owner de|due[n]?o de cuenta|portfolio|cartera de cuenta|farming|hunting|prospect|ultim[ao] oportunidad|last opportunity|first opportunity|oportunidad ganada|opportunity won|last worked|ultima trabajada|fecha de|cuando se|timeline|estado de la cuenta|account status|tipo de cuenta|account type|labels de cuenta)/.test(
      q,
    );

  if (String(clientNameDetected || '').trim() && accountFactCue) return true;

  var opportunityCue =
    /(oportunidad|opportunit|ganad[ao]|won|last worked|ultima trabajada|fecha.*oportunidad|creo la ultima|created the last)/.test(
      q,
    );
  if (opportunityCue && ClientsRosterQuery_resolveAccountFromQuestion_(question)) return true;

  if (String(clientNameDetected || '').trim()) return false;

  return rosterCue || listCue || countCue || accountFactCue;
}

/**
 * Busca el nombre de cuenta del roster cuyo texto aparece en la pregunta (match más largo).
 * @param {string} question
 * @return {string}
 */
function ClientsRosterQuery_resolveAccountFromQuestion_(question) {
  var qNorm = ClientsRosterQuery_norm_(question);
  if (!qNorm) return '';
  var rows;
  try {
    rows = SalesforceAccountsStore_listAll();
  } catch (ignoreList) {
    return '';
  }
  var best = '';
  var bestLen = 0;
  var i;
  for (i = 0; i < rows.length; i++) {
    var name = String(rows[i].account_name || '').trim();
    if (!name) continue;
    var nameNorm = ClientsRosterQuery_norm_(name);
    if (nameNorm.length < 3) continue;
    if (qNorm.indexOf(nameNorm) >= 0 && nameNorm.length > bestLen) {
      best = name;
      bestLen = nameNorm.length;
    }
  }
  return best;
}

/**
 * @param {string} accountNameHint
 * @param {{activeOnly:boolean|null, industry:string, subIndustry:string, industryGroup:string, statusHint:string, accountNameHint:string}} filters
 * @return {Object|null}
 */
function ClientsRosterQuery_fetchSingleAccount_(accountNameHint, filters) {
  var hint = String(accountNameHint || '').trim();
  if (!hint) return null;
  filters = filters || {};
  var key = ClientsMaster_normalizeName_(hint);
  try {
    var byKey = SalesforceAccountsStore_getByKey(key);
    if (byKey) {
      var fromKey = ClientsRosterQuery_normalizeSalesforceRow_(byKey);
      if (ClientsRosterQuery_rowMatchesFilters_(fromKey, filters)) return fromKey;
    }
  } catch (ignoreKey) {}

  var hintNorm = ClientsRosterQuery_norm_(hint);
  var rows;
  try {
    rows = SalesforceAccountsStore_listAll();
  } catch (ignoreAll) {
    return null;
  }
  var i;
  for (i = 0; i < rows.length; i++) {
    var norm = ClientsRosterQuery_normalizeSalesforceRow_(rows[i]);
    var nameNorm = ClientsRosterQuery_norm_(norm.account_name || '');
    if (
      nameNorm === hintNorm ||
      nameNorm.indexOf(hintNorm) >= 0 ||
      hintNorm.indexOf(nameNorm) >= 0
    ) {
      if (ClientsRosterQuery_rowMatchesFilters_(norm, filters)) return norm;
    }
  }
  return null;
}

/**
 * @param {string} text
 * @return {string}
 */
function ClientsRosterQuery_norm_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * @param {string} question
 * @return {{activeOnly:boolean|null, industry:string, subIndustry:string, industryGroup:string, statusHint:string, q:string}}
 */
function ClientsRosterQuery_parseFilters_(question) {
  var qNorm = ClientsRosterQuery_norm_(question);
  var filters = {
    activeOnly: null,
    industry: '',
    subIndustry: '',
    industryGroup: '',
    statusHint: '',
    accountNameHint: '',
    accountOwnerHint: '',
    q: '',
  };

  if (/(inactiv|histor|baja|inactive|historical)/.test(qNorm)) {
    filters.activeOnly = false;
  } else if (/(activ|vigent|current|active)/.test(qNorm)) {
    filters.activeOnly = true;
  }

  if (
    /(aviacion|aviation|passenger airlines|aerolineas de pasajeros|lineas aereas comerciales|commercial airlines|airline passengers)/.test(
      qNorm,
    )
  ) {
    var paxSub = ClientsRosterQuery_resolvePassengerAirlinesSubIndustry_();
    if (paxSub) {
      filters.subIndustry = paxSub;
      filters.industryGroup = '';
    } else {
      filters.industryGroup = 'aviation';
    }
  } else if (/(aeroespacial|aerospace|aeropuertos|airports)/.test(qNorm)) {
    filters.industryGroup = 'aerospace';
  }

  var catalog = ClientsMaster_listFilterOptions();
  var industries = catalog.industries || [];
  var si;
  for (si = 0; si < industries.length; si++) {
    var ind = String(industries[si] || '').trim();
    if (!ind) continue;
    var indNorm = ClientsRosterQuery_norm_(ind);
    if (indNorm.length >= 4 && qNorm.indexOf(indNorm) >= 0) {
      filters.industry = ind;
      filters.industryGroup = '';
      break;
    }
  }

  if (!filters.industry) {
    var resolved = ClientsMaster_resolveIndustryFromCatalog_(question);
    if (resolved) {
      filters.industry = resolved;
      filters.industryGroup = '';
    }
  }

  var subList = catalog.sub_industries || [];
  for (si = 0; si < subList.length; si++) {
    var sub = String(subList[si] || '').trim();
    if (!sub) continue;
    var subNorm = ClientsRosterQuery_norm_(sub);
    if (subNorm.length >= 4 && qNorm.indexOf(subNorm) >= 0) {
      filters.subIndustry = sub;
      break;
    }
  }

  if (!filters.subIndustry) {
    var resolvedSub = ClientsMaster_resolveSubIndustryFromCatalog_(
      question,
      filters.industry,
    );
    if (resolvedSub) filters.subIndustry = resolvedSub;
  }

  var statusWords = ['prospect', 'farming', 'hunting', 'customer', 'partner'];
  var sw;
  for (sw = 0; sw < statusWords.length; sw++) {
    if (qNorm.indexOf(statusWords[sw]) >= 0) {
      filters.statusHint = statusWords[sw];
      break;
    }
  }

  return filters;
}

/**
 * Subindustria «Passenger Airlines» tal como está en Salesforce / catálogo.
 * @return {string}
 */
function ClientsRosterQuery_resolvePassengerAirlinesSubIndustry_() {
  var hi;
  for (hi = 0; hi < CLIENTS_ROSTER_PASSENGER_AIRLINES_SUB_HINTS_.length; hi++) {
    var resolved = ClientsMaster_resolveSubIndustryFromCatalog_(
      CLIENTS_ROSTER_PASSENGER_AIRLINES_SUB_HINTS_[hi],
      '',
    );
    if (resolved) return resolved;
  }
  var catalog = ClientsMaster_listFilterOptions();
  var list = catalog.sub_industries || [];
  var want = ClientsMaster_normalizeIndustryToken_('passenger airlines');
  for (hi = 0; hi < list.length; hi++) {
    var item = String(list[hi] || '').trim();
    if (!item) continue;
    var tok = ClientsMaster_normalizeIndustryToken_(item);
    if (tok === want || (tok.indexOf('passenger') >= 0 && tok.indexOf('airline') >= 0)) {
      return item;
    }
  }
  return 'Passenger Airlines';
}

/**
 * @param {string} subIndustry
 * @return {boolean}
 */
function ClientsRosterQuery_isPassengerAirlinesSub_(subIndustry) {
  var sub = String(subIndustry || '').trim();
  if (!sub) return false;
  return (
    ClientsMaster_normalizeIndustryToken_(sub) ===
    ClientsMaster_normalizeIndustryToken_('Passenger Airlines')
  );
}

/**
 * @param {string} industryGroup
 * @return {Array<string>}
 */
function ClientsRosterQuery_industriesForGroup_(industryGroup) {
  if (industryGroup === 'aerospace') {
    var catalogAe = ClientsMaster_listFilterOptions();
    var aeOut = [];
    var aeAllowed = { 'Agencias AeroEspaciales': true, Aeropuertos: true };
    var aeList = catalogAe.industries || [];
    var ai;
    for (ai = 0; ai < aeList.length; ai++) {
      var aeInd = String(aeList[ai] || '').trim();
      if (aeInd && aeAllowed[aeInd]) aeOut.push(aeInd);
    }
    if (!aeOut.length) return ['Agencias AeroEspaciales', 'Aeropuertos'];
    return aeOut;
  }
  if (industryGroup !== 'aviation') return [];
  var catalog = ClientsMaster_listFilterOptions();
  var allowed = {};
  var i;
  for (i = 0; i < CLIENTS_ROSTER_AVIATION_INDUSTRIES_FALLBACK_.length; i++) {
    allowed[CLIENTS_ROSTER_AVIATION_INDUSTRIES_FALLBACK_[i]] = true;
  }
  var out = [];
  var list = catalog.industries || [];
  for (i = 0; i < list.length; i++) {
    var ind = String(list[i] || '').trim();
    if (ind && allowed[ind]) out.push(ind);
  }
  if (!out.length) return CLIENTS_ROSTER_AVIATION_INDUSTRIES_FALLBACK_.slice();
  return out;
}

/**
 * @param {Object} row
 * @param {{activeOnly:boolean|null, industry:string, subIndustry:string, industryGroup:string, statusHint:string}} filters
 * @return {boolean}
 */
function ClientsRosterQuery_rowMatchesFilters_(row, filters) {
  var isActive = row.is_active !== false;
  if (filters.activeOnly === true && !isActive) return false;
  if (filters.activeOnly === false && isActive) return false;

  var accountHint = String(filters.accountNameHint || '').trim();
  if (accountHint) {
    var hintNorm = ClientsRosterQuery_norm_(accountHint);
    var nameNorm = ClientsRosterQuery_norm_(row.account_name || '');
    var keyNorm = ClientsRosterQuery_norm_(row.account_key || '');
    var hintKey = ClientsRosterQuery_norm_(ClientsMaster_normalizeName_(accountHint));
    var matchName =
      nameNorm === hintNorm ||
      nameNorm.indexOf(hintNorm) >= 0 ||
      hintNorm.indexOf(nameNorm) >= 0;
    var matchKey = keyNorm === hintKey || keyNorm.indexOf(hintKey) >= 0;
    if (!matchName && !matchKey) return false;
  }

  var ownerHint = String(filters.accountOwnerHint || '').trim();
  if (ownerHint && !ClientsRosterQuery_ownerMatchesHint_(row.account_owner, ownerHint)) {
    return false;
  }

  var industry = String(row.industry || '').trim();
  var subIndustry = String(row.sub_industry || '').trim();
  var status = ClientsRosterQuery_norm_(row.account_status || '');

  if (filters.industry && industry !== filters.industry) return false;

  if (filters.industryGroup && !filters.industry) {
    var groupIndustries = ClientsRosterQuery_industriesForGroup_(filters.industryGroup);
    if (groupIndustries.indexOf(industry) < 0) return false;
  }

  if (filters.subIndustry && subIndustry !== filters.subIndustry) return false;

  if (filters.statusHint && status.indexOf(filters.statusHint) < 0) return false;

  return true;
}

/**
 * @param {Object} sfRow
 * @return {Object}
 */
function ClientsRosterQuery_normalizeSalesforceRow_(sfRow) {
  return {
    account_key: String(sfRow.account_key || '').trim(),
    account_name: String(sfRow.account_name || '').trim(),
    account_owner: String(sfRow.account_owner || '').trim(),
    portfolio: String(sfRow.portfolio || '').trim(),
    account_status: String(sfRow.account_status || '').trim(),
    account_type: String(sfRow.account_type || '').trim(),
    account_labels: String(sfRow.account_labels || '').trim(),
    industry: String(sfRow.industry || '').trim(),
    sub_industry: String(sfRow.sub_industry || '').trim(),
    is_active: sfRow.is_active !== false,
    date_last_opty_created: sfRow.date_last_opty_created || '',
    last_opportunity_won: sfRow.last_opportunity_won || '',
    first_opportunity_won: sfRow.first_opportunity_won || '',
    last_worked_opportunity_date: sfRow.last_worked_opportunity_date || '',
    source: 'salesforce',
  };
}

/**
 * @param {Object} clientRow
 * @return {Object}
 */
function ClientsRosterQuery_normalizeClientMasterRow_(clientRow) {
  return {
    account_key: String(clientRow.normalized_name || clientRow.client_id || '').trim(),
    account_name: String(clientRow.client_name || '').trim(),
    account_owner: String(clientRow.main_contact_name || '').trim(),
    portfolio: '',
    account_status: '',
    account_type: '',
    account_labels: '',
    industry: String(clientRow.industry || '').trim(),
    sub_industry: String(clientRow.sub_industry || '').trim(),
    is_active: true,
    date_last_opty_created: '',
    last_opportunity_won: '',
    first_opportunity_won: '',
    last_worked_opportunity_date: '',
    source: 'clients_master',
  };
}

/**
 * @param {Object} row
 * @return {string}
 */
function ClientsRosterQuery_formatRowSummary_(row) {
  if (typeof SalesforceAccounts_buildSummary_ === 'function') {
    return SalesforceAccounts_buildSummary_(row, row.is_active !== false);
  }
  var lines = ['Account: ' + row.account_name];
  if (row.account_owner) {
    lines.push(ClientsRosterQuery_ownerFieldLabel_() + ': ' + row.account_owner);
  }
  if (row.portfolio) lines.push('Portfolio: ' + row.portfolio);
  if (row.account_status) lines.push('Client status: ' + row.account_status);
  if (row.industry) lines.push('Industry: ' + row.industry);
  if (row.sub_industry) lines.push('Sub-industry: ' + row.sub_industry);
  if (row.is_active === false) lines.push('Status: inactive in roster');
  return lines.join('\n');
}

/**
 * @param {{activeOnly:boolean|null, industry:string, subIndustry:string, industryGroup:string, statusHint:string}} filters
 * @param {string} question
 * @return {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}}
 */
function ClientsRosterQuery_fetch_(filters, question) {
  filters = filters || ClientsRosterQuery_parseFilters_(question);
  var accountHint = String(filters.accountNameHint || '').trim();
  var ownerHint = String(filters.accountOwnerHint || '').trim();
  if (accountHint && !ownerHint) {
    var single = ClientsRosterQuery_fetchSingleAccount_(accountHint, filters);
    if (single) {
      return {
        items: [single],
        total: 1,
        activeCount: single.is_active !== false ? 1 : 0,
        inactiveCount: single.is_active === false ? 1 : 0,
        source: 'salesforce',
        truncated: false,
        filters: filters,
      };
    }
  }

  /** @type {Array<Object>} */
  var items = [];
  var source = 'salesforce';

  try {
    var sfRows;
    var useDbFilter =
      !!filters.industry ||
      filters.industryGroup === 'aviation' ||
      filters.industryGroup === 'aerospace' ||
      !!filters.subIndustry ||
      filters.activeOnly === true ||
      filters.activeOnly === false;
    if (useDbFilter) {
      var dbFilters = {
        activeOnly: filters.activeOnly,
        subIndustry: filters.subIndustry,
      };
      if (filters.industry) {
        dbFilters.industry = filters.industry;
      } else if (
        filters.industryGroup === 'aviation' ||
        filters.industryGroup === 'aerospace'
      ) {
        dbFilters.industries = ClientsRosterQuery_industriesForGroup_(
          filters.industryGroup,
        );
      }
      sfRows = SalesforceAccountsStore_listMatching_(dbFilters);
      console.log(
        '[CLIENTS-ROSTER] salesforce filtered fetch rows=' + String(sfRows.length),
      );
    } else {
      sfRows = SalesforceAccountsStore_listAll();
    }
    var i;
    for (i = 0; i < sfRows.length; i++) {
      var norm = ClientsRosterQuery_normalizeSalesforceRow_(sfRows[i]);
      if (!norm.account_name) continue;
      if (!ClientsRosterQuery_rowMatchesFilters_(norm, filters)) continue;
      items.push(norm);
    }
  } catch (eSf) {
    console.log('[CLIENTS-ROSTER] salesforce fetch: ' + String(eSf.message || eSf));
  }

  if (!items.length) {
    source = 'clients_master';
    try {
      var cmRes = ClientsMaster_list({});
      var cmItems = (cmRes && cmRes.items) || [];
      for (i = 0; i < cmItems.length; i++) {
        var cmNorm = ClientsRosterQuery_normalizeClientMasterRow_(cmItems[i]);
        if (!cmNorm.account_name) continue;
        if (!ClientsRosterQuery_rowMatchesFilters_(cmNorm, filters)) continue;
        items.push(cmNorm);
      }
    } catch (eCm) {
      console.log('[CLIENTS-ROSTER] clients_master fetch: ' + String(eCm.message || eCm));
    }
  }

  items.sort(function (a, b) {
    return String(a.account_name || '').localeCompare(String(b.account_name || ''));
  });

  var total = items.length;
  var activeCount = 0;
  for (i = 0; i < items.length; i++) {
    if (items[i].is_active !== false) activeCount++;
  }
  var truncated = false;
  if (items.length > CLIENTS_ROSTER_QUERY_MAX_ROWS_) {
    truncated = true;
    items = items.slice(0, CLIENTS_ROSTER_QUERY_MAX_ROWS_);
  }

  return {
    items: items,
    total: total,
    activeCount: activeCount,
    inactiveCount: Math.max(0, total - activeCount),
    source: source,
    truncated: truncated,
    filters: filters,
  };
}

/**
 * @param {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}} result
 * @return {string}
 */
function ClientsRosterQuery_buildContext_(result) {
  var lines = [];
  lines.push('Salesforce Airlines Accounts / client master (Supabase).');
  lines.push(
    'Note: Account Owner, Client Partner and Vendedor are the same role (Salesforce field account_owner).',
  );
  lines.push('Source: ' + String(result.source || 'salesforce') + '.');
  lines.push('Total matching accounts: ' + String(result.total || 0) + '.');
  if (result.truncated) {
    lines.push(
      'Showing first ' +
        String(result.items.length) +
        ' accounts (cap ' +
        CLIENTS_ROSTER_QUERY_MAX_ROWS_ +
        ').',
    );
  }
  if (result.filters) {
    var f = result.filters;
    if (f.industry) lines.push('Filter industry: ' + f.industry);
    if (f.industryGroup) lines.push('Filter industry group: ' + f.industryGroup);
    if (f.subIndustry) lines.push('Filter sub-industry: ' + f.subIndustry);
    if (f.statusHint) lines.push('Filter status hint: ' + f.statusHint);
    if (f.activeOnly === true) lines.push('Filter: active accounts only.');
    if (f.activeOnly === false) lines.push('Filter: inactive/historical accounts only.');
    if (f.accountNameHint) lines.push('Filter account: ' + f.accountNameHint);
    if (f.accountOwnerHint) {
      lines.push(
        'Filter ' + ClientsRosterQuery_ownerFieldLabel_() + ': ' + f.accountOwnerHint,
      );
    }
  }
  lines.push('');

  if (!result.items || !result.items.length) {
    lines.push('No accounts matched the parsed filters in the database.');
    return lines.join('\n');
  }

  var i;
  for (i = 0; i < result.items.length; i++) {
    lines.push('--- ACCOUNT ' + (i + 1) + ' ---');
    lines.push(ClientsRosterQuery_formatRowSummary_(result.items[i]));
    lines.push('');
  }
  return lines.join('\n');
}

function ClientsRosterQuery_wantsOwnerDirect_(question) {
  var q = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(
    ClientsRosterQuery_norm_(question),
  );
  if (!q) return false;
  return (
    /(?:quien|who)\s+(?:es|is)\s+(?:el|la|the\s+)?account owner\b/.test(q) ||
    /(?:cual|which|what)\s+(?:es|is)\s+(?:el|la|the\s+)?account owner\b/.test(q) ||
    /\baccount owner\s+(?:de|del|of)\b/.test(q)
  );
}

/**
 * @param {Object} row
 * @return {string}
 */
function ClientsRosterQuery_formatOwnerDirectAnswer_(row) {
  var account = String(row.account_name || '').trim();
  var owner = String(row.account_owner || '').trim();
  if (!owner) {
    return UiStrings_fmt_('clients_roster_direct_owner_none', { account: account });
  }
  return UiStrings_fmt_('clients_roster_direct_owner', {
    account: account,
    owner: owner,
  });
}

/**
 * Preguntas de conteo/total que no requieren redacción LLM.
 * @param {string} question
 * @return {boolean}
 */
function ClientsRosterQuery_wantsDirectCount_(question) {
  var q = ClientsRosterQuery_norm_(question);
  if (!q) return false;
  return /(cuantos|how many|total de clientes|total clients|cantidad de clientes|numero de clientes|number of clients)/.test(
    q,
  );
}

/**
 * Listados de nómina/cartera (sin análisis narrativo).
 * @param {string} question
 * @return {boolean}
 */
function ClientsRosterQuery_wantsDirectList_(question) {
  var q = ClientsRosterQuery_norm_(question);
  if (!q) return false;
  return /(que clientes|cuales clientes|which clients|quienes son los clientes|lista(r)? de clientes|list of clients|listado de clientes|nomina de clientes|n[oó]mina de clientes|mostrar (los )?clientes|show (the )?clients|que cuentas|which accounts|cuentas tiene|cuentas de |accounts for|accounts does|cuentas en|accounts in|cartera de clientes|client portfolio|clientes tiene globant|clients does globant|clients globant has|cuantas cuentas tiene|how many accounts does)/.test(
    q,
  );
}

/**
 * @param {string} question
 * @return {boolean}
 */
function ClientsRosterQuery_shouldAnswerDirectly_(question) {
  var q = ClientsRosterQuery_norm_(question);
  if (!q) return false;
  if (
    /(comparar|analiz|recomend|estrategia|por que |why does|tendencia|forecast|predic|prioriz|ranking|mejor cuenta)/.test(
      q,
    )
  ) {
    return false;
  }
  return (
    ClientsRosterQuery_wantsDirectCount_(question) ||
    ClientsRosterQuery_wantsDirectList_(question)
  );
}

/**
 * @param {string} question
 * @return {boolean}
 */
function ClientsRosterQuery_wantsOpportunityDirect_(question) {
  var q = ClientsRosterQuery_norm_(question);
  return /(oportunidad|opportunit|ganad[ao]|won|last worked|ultima trabajada|creo la ultima|created the last|fecha.*oportun)/.test(
    q,
  );
}

/**
 * @param {Object} row
 * @return {string}
 */
function ClientsRosterQuery_formatOpportunityDirectAnswer_(row) {
  var locale = UiStrings_activeLocale_();
  var loc = locale === 'en' ? 'en' : 'es';
  var account = String(row.account_name || '').trim();
  var lines = [];
  var d1 =
    typeof SalesforceAccounts_formatDateForSummary_ === 'function'
      ? SalesforceAccounts_formatDateForSummary_(row.date_last_opty_created, loc)
      : String(row.date_last_opty_created || '').slice(0, 10);
  var d2 =
    typeof SalesforceAccounts_formatDateForSummary_ === 'function'
      ? SalesforceAccounts_formatDateForSummary_(row.last_opportunity_won, loc)
      : String(row.last_opportunity_won || '').slice(0, 10);
  var d3 =
    typeof SalesforceAccounts_formatDateForSummary_ === 'function'
      ? SalesforceAccounts_formatDateForSummary_(row.first_opportunity_won, loc)
      : String(row.first_opportunity_won || '').slice(0, 10);
  var d4 =
    typeof SalesforceAccounts_formatDateForSummary_ === 'function'
      ? SalesforceAccounts_formatDateForSummary_(row.last_worked_opportunity_date, loc)
      : String(row.last_worked_opportunity_date || '').slice(0, 10);
  if (d1) {
    lines.push(
      UiStrings_fmt_('clients_roster_oppty_line_last_created', { date: d1 }),
    );
  }
  if (d2) {
    lines.push(UiStrings_fmt_('clients_roster_oppty_line_last_won', { date: d2 }));
  }
  if (d3) {
    lines.push(UiStrings_fmt_('clients_roster_oppty_line_first_won', { date: d3 }));
  }
  if (d4) {
    lines.push(UiStrings_fmt_('clients_roster_oppty_line_last_worked', { date: d4 }));
  }
  if (!lines.length) {
    return UiStrings_fmt_('clients_roster_oppty_direct_none', { account: account });
  }
  return UiStrings_fmt_('clients_roster_oppty_direct', {
    account: account,
    lines: lines.join('\n'),
  });
}

/** @deprecated usar ClientsRosterQuery_shouldAnswerDirectly_ */
function ClientsRosterQuery_wantsDirectAnswer_(question) {
  return ClientsRosterQuery_shouldAnswerDirectly_(question);
}

/**
 * @param {{activeOnly:boolean|null, industry:string, subIndustry:string, industryGroup:string}} filters
 * @return {string}
 */
function ClientsRosterQuery_describeFilters_(filters) {
  var locale = UiStrings_activeLocale_();
  var note = '';
  if (!filters) return note;
  if (
    filters.industryGroup === 'aviation' ||
    ClientsRosterQuery_isPassengerAirlinesSub_(filters.subIndustry)
  ) {
    note += UiStrings_t(locale, 'clients_roster_direct_filter_aviation');
  }
  if (filters.industryGroup === 'aerospace') {
    note += UiStrings_t(locale, 'clients_roster_direct_filter_aerospace');
  }
  if (filters.industry) {
    note += UiStrings_fmt_('clients_roster_direct_filter_industry', {
      industry: filters.industry,
    });
  }
  if (filters.subIndustry) {
    note += UiStrings_fmt_('clients_roster_direct_filter_sub_industry', {
      subIndustry: filters.subIndustry,
    });
  }
  if (filters.activeOnly === true) {
    note += UiStrings_t(locale, 'clients_roster_direct_filter_active');
  }
  if (filters.activeOnly === false) {
    note += UiStrings_t(locale, 'clients_roster_direct_filter_inactive');
  }
  if (filters.accountOwnerHint) {
    note += UiStrings_fmt_('clients_roster_direct_filter_owner', {
      owner: String(filters.accountOwnerHint).trim(),
    });
  }
  return note;
}

/**
 * Respuesta determinística para preguntas de conteo (sin /chat).
 * @param {string} question
 * @param {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}} result
 * @return {string}
 */
function ClientsRosterQuery_formatDirectAnswer_(question, result) {
  var locale = UiStrings_activeLocale_();
  var total = result.total || 0;
  if (!total) {
    return UiStrings_t(locale, 'clients_roster_direct_count_none');
  }
  var active =
    typeof result.activeCount === 'number' ? result.activeCount : total;
  var inactive =
    typeof result.inactiveCount === 'number'
      ? result.inactiveCount
      : Math.max(0, total - active);
  var inactivePart =
    inactive > 0
      ? UiStrings_fmt_('clients_roster_direct_count_inactive_part', {
          inactive: String(inactive),
        })
      : '';
  var truncNote = result.truncated
    ? UiStrings_fmt_('clients_roster_direct_trunc', {
        cap: String(CLIENTS_ROSTER_QUERY_MAX_ROWS_),
      })
    : '';
  return UiStrings_fmt_('clients_roster_direct_count', {
    total: String(total),
    active: String(active),
    inactivePart: inactivePart,
    filterNote: ClientsRosterQuery_describeFilters_(result.filters),
    truncNote: truncNote,
  });
}

/**
 * @param {Object} row
 * @return {Object}
 */
function ClientsRosterQuery_rosterRowToReference_(row) {
  var name = String(row.account_name || '').trim();
  var title = name;
  if (row.industry || row.sub_industry) {
    title +=
      ' — ' +
      [row.industry, row.sub_industry].filter(function (p) {
        return !!String(p || '').trim();
      }).join(' / ');
  }
  return {
    contentId: '',
    title: title,
    contentType: 'client',
    clientName: name,
    url: '',
    fileName: '',
    driveFileId: '',
    globantDocumentId: '',
    globantProfileName: '',
    matched: true,
    accountKey: String(row.account_key || '').trim(),
    accountOwner: String(row.account_owner || '').trim(),
    industry: String(row.industry || '').trim(),
    subIndustry: String(row.sub_industry || '').trim(),
    isActive: row.is_active !== false,
  };
}

/**
 * @param {string} question
 * @param {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}} result
 * @return {string}
 */
function ClientsRosterQuery_formatDirectListAnswer_(question, result) {
  var locale = UiStrings_activeLocale_();
  var total = result.total || 0;
  var ownerHint =
    result.filters && result.filters.accountOwnerHint
      ? String(result.filters.accountOwnerHint).trim()
      : '';
  if (!total) {
    if (ownerHint) {
      return UiStrings_fmt_('clients_roster_direct_count_none_owner', {
        owner: ownerHint,
      });
    }
    return UiStrings_t(locale, 'clients_roster_direct_count_none');
  }
  var introKey = ownerHint
    ? 'clients_roster_direct_list_owner_intro'
    : 'clients_roster_direct_list_intro';
  var introArgs = {
    total: String(total),
    filterNote: ClientsRosterQuery_describeFilters_(result.filters),
  };
  if (ownerHint) introArgs.owner = ownerHint;
  var lines = [UiStrings_fmt_(introKey, introArgs)];
  if (result.truncated) {
    lines.push(
      UiStrings_fmt_('clients_roster_direct_trunc', {
        cap: String(CLIENTS_ROSTER_QUERY_MAX_ROWS_),
      }),
    );
  }
  lines.push('');
  var i;
  for (i = 0; i < (result.items || []).length; i++) {
    var row = result.items[i];
    var bullet = '• **' + String(row.account_name || '').trim() + '**';
    if (row.account_owner) bullet += ' — ' + String(row.account_owner).trim();
    if (row.sub_industry) bullet += ' (' + String(row.sub_industry).trim() + ')';
    else if (row.industry) bullet += ' (' + String(row.industry).trim() + ')';
    if (row.is_active === false) {
      bullet += ' ' + UiStrings_t(locale, 'clients_roster_direct_list_inactive_tag');
    }
    lines.push(bullet);
  }
  return lines.join('\n');
}

/**
 * @param {string} question
 * @param {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}} result
 * @return {{answer:string, references:Array<Object>}}
 */
function ClientsRosterQuery_buildDirectResponse_(question, result) {
  var answer;
  if (
    result.total === 1 &&
    result.items &&
    result.items.length === 1 &&
    ClientsRosterQuery_wantsOwnerDirect_(question)
  ) {
    answer = ClientsRosterQuery_formatOwnerDirectAnswer_(result.items[0]);
  } else if (
    result.total === 1 &&
    result.items &&
    result.items.length === 1 &&
    ClientsRosterQuery_wantsOpportunityDirect_(question)
  ) {
    answer = ClientsRosterQuery_formatOpportunityDirectAnswer_(result.items[0]);
  } else if (ClientsRosterQuery_wantsDirectCount_(question)) {
    answer = ClientsRosterQuery_formatDirectAnswer_(question, result);
  } else {
    answer = ClientsRosterQuery_formatDirectListAnswer_(question, result);
  }
  var references = [];
  var i;
  for (i = 0; i < (result.items || []).length; i++) {
    references.push(ClientsRosterQuery_rosterRowToReference_(result.items[i]));
  }
  return { answer: answer, references: references };
}

/**
 * @param {string} question
 * @param {string} clientNameDetected
 * @return {{items:Array<Object>, total:number, source:string, truncated:boolean, filters:Object}|null}
 */
function ClientsRosterQuery_tryPrepare_(question, clientNameDetected) {
  if (!ClientsRosterQuery_hasRosterData_()) return null;
  if (!ClientsRosterQuery_isRosterQuestion_(question, clientNameDetected)) return null;
  var filters = ClientsRosterQuery_parseFilters_(question);
  var qNorm = ClientsRosterQuery_normalizeOwnerRoleTermsInQuestion_(
    ClientsRosterQuery_norm_(question),
  );
  if (ClientsRosterQuery_isOwnerRosterQuestion_(qNorm)) {
    filters.accountOwnerHint = ClientsRosterQuery_resolveOwnerFromQuestion_(question);
  } else {
    var accountHint = String(clientNameDetected || '').trim();
    if (!accountHint) accountHint = ClientsRosterQuery_resolveAccountFromQuestion_(question);
    if (accountHint) filters.accountNameHint = accountHint;
  }
  return ClientsRosterQuery_fetch_(filters, question);
}

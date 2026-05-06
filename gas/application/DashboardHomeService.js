/**
 * @fileoverview Métricas agregadas para las tarjetas del inicio (sin exponer filas completas).
 */

/** @typedef {{kind:string, profileName:string, count:number}} DashboardHome_agentKindAgg */
/** @typedef {{name:string, count:number}} DashboardHome_namedCount */

/**
 * @param {Array<Object>} agents
 * @return {{total:number,kinds:Array<DashboardHome_agentKindAgg>,strategies:Array<DashboardHome_namedCount>}}
 */
function DashboardHome_aggregateAgents_(agents) {
  var kindMap = {}; // key kind or 'other:'+slug
  var stratMap = {};
  var i;

  function bumpKind(keyKind, pname) {
    if (!kindMap[keyKind]) kindMap[keyKind] = { kind: keyKind, profileName: pname, count: 0 };
    kindMap[keyKind].count++;
  }

  for (i = 0; i < agents.length; i++) {
    var ag = agents[i];
    if (!ag || typeof ag !== 'object') continue;
    var id = String(ag.id || '').trim();
    var pn = String(ag.profileName || '').trim();
    if (DashboardHome_isKnownAgentId_(id)) {
      bumpKind(id, pn);
    } else {
      var slug = (pn || id || 'custom').trim();
      var kOther = 'other:' + slug.toLowerCase();
      if (!kindMap[kOther])
        kindMap[kOther] = {
          kind: 'other',
          profileName: pn || id || slug,
          count: 0,
        };
      kindMap[kOther].count++;
    }

    var g = ag.globantAgent;
    var sn =
      g && typeof g === 'object' ? String(g.strategyName || '').trim() : '';
    if (sn) {
      if (!stratMap[sn]) stratMap[sn] = { name: sn, count: 0 };
      stratMap[sn].count++;
    }
  }

  var ORDER = ['orchestrator', 'success_cases', 'proposals', 'clients'];
  var kinds = [];
  for (i = 0; i < ORDER.length; i++) {
    var k = ORDER[i];
    if (kindMap[k] && kindMap[k].count > 0) kinds.push(kindMap[k]);
  }
  var otherKeys = Object.keys(kindMap).filter(function (x) {
    return x.indexOf('other:') === 0;
  });
  otherKeys.sort();
  var j;
  for (j = 0; j < otherKeys.length; j++) {
    kinds.push(kindMap[otherKeys[j]]);
  }

  var strats = [];
  for (var sk in stratMap) {
    if (Object.prototype.hasOwnProperty.call(stratMap, sk)) {
      strats.push(stratMap[sk]);
    }
  }
  strats.sort(function (a, b) {
    return b.count - a.count || a.name.localeCompare(b.name);
  });
  var MAX_S = 4;
  if (strats.length > MAX_S) strats = strats.slice(0, MAX_S);

  return {
    total: agents.length,
    kinds: kinds,
    strategies: strats,
  };
}

/**
 * @param {string} agentId
 * @return {boolean}
 */
function DashboardHome_isKnownAgentId_(agentId) {
  var id = String(agentId || '').trim();
  return (
    id === 'orchestrator' ||
    id === 'success_cases' ||
    id === 'proposals' ||
    id === 'clients'
  );
}

/**
 * @param {Array<Object>} items — filas como devuelve ContentCatalog_list(limit 0).
 * @return {{total:number, byType:{proposal:number,success_case:number,client:number}}}
 */
function DashboardHome_aggregateContents_(items) {
  var cProposal = 0;
  var cSuccess = 0;
  var cClient = 0;
  var i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    var cm = it && it.common ? it.common : {};
    var t = String(cm.content_type || '').trim();
    if (t === 'proposal') cProposal++;
    else if (t === 'success_case') cSuccess++;
    else if (t === 'client') cClient++;
  }
  return {
    total: items.length,
    byType: {
      proposal: cProposal,
      success_case: cSuccess,
      client: cClient,
    },
  };
}

/**
 * @param {Array<Object>} items
 * @param {number=} maxDistinct
 * @return {{total:number, industries:Array<DashboardHome_namedCount>}}
 */
function DashboardHome_aggregateClients_(items, maxDistinct) {
  var lim = typeof maxDistinct === 'number' && maxDistinct > 0 ? maxDistinct : 5;
  var byKey = {}; // lowercase -> { display: string, count }
  var i;
  for (i = 0; i < items.length; i++) {
    var r = items[i];
    if (!r || typeof r !== 'object') continue;
    var raw = String(r.industry || '').trim();
    var display = raw;
    var lk = raw ? raw.toLowerCase() : '';
    var key = lk || '__empty__';
    if (!byKey[key]) byKey[key] = { industry: display, count: 0 };
    byKey[key].count++;
  }

  var arr = [];
  for (var k in byKey) {
    if (Object.prototype.hasOwnProperty.call(byKey, k)) {
      arr.push({
        industry: k === '__empty__' ? '' : byKey[k].industry,
        count: byKey[k].count,
      });
    }
  }
  arr.sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    var ai = String(a.industry || '');
    var bi = String(b.industry || '');
    return ai.localeCompare(bi);
  });
  if (arr.length > lim) arr = arr.slice(0, lim);

  return { total: items.length, industries: arr };
}

/**
 * Agregaciones para tarjetas del home (roles mínimos: admin vs contributor).
 *
 * @return {{ok:boolean, agents:?Object, contents:?Object, clients:?Object}}
 */
function DashboardHome_metrics() {
  var out = /** @type {{ok:boolean, agents:?Object, contents:?Object, clients:?Object}} */ ({
    ok: true,
    agents: null,
    contents: null,
    clients: null,
  });
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) return out;

  var isContributor = false;
  try {
    ContentCatalog_requireContributor_();
    isContributor = true;
  } catch (eC) {}

  var canSeeAgents = AdminAuth_canManageAgents(email);

  if (canSeeAgents) {
    try {
      var resA = AdminAgents_listForDashboardMetrics();
      out.agents = DashboardHome_aggregateAgents_(resA.agents || []);
    } catch (eA) {
      out.agents = null;
    }
  }

  if (isContributor) {
    try {
      var resCat = ContentCatalog_list({
        skip: 0,
        limit: 0,
        skipReconcile: true,
      });
      out.contents = DashboardHome_aggregateContents_(resCat.items || []);
    } catch (eCat) {
      out.contents = null;
    }

    try {
      var resCl = ClientsMaster_list({});
      out.clients = DashboardHome_aggregateClients_(resCl.items || [], 6);
    } catch (eCli) {
      out.clients = null;
    }
  }

  return out;
}

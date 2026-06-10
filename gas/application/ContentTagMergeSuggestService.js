/**
 * @fileoverview Sugerencias de fusión de tags: heurística (grafías) + Globant Chat (sinónimos).
 */

/** Máximo de tags enviados al LLM (por conteo descendente). */
var CONTENT_TAG_MERGE_SUGGEST_MAX = 150;

/**
 * @param {Array<{tag:string,count:number}>} cloud
 * @param {Object<string,{count:number,displays:Object<string,number>}>} buckets
 * @return {{countByKey:Object<string,number>,displayByKey:Object<string,string>,allDisplaysByKey:Object<string,Array<string>>}}
 */
function ContentTagMergeSuggest_buildCloudMaps_(cloud, buckets) {
  var countByKey = {};
  var displayByKey = {};
  var allDisplaysByKey = {};
  var i;
  for (i = 0; i < cloud.length; i++) {
    var disp = ContentExtraction_toCamelTag_(cloud[i].tag);
    if (!disp) continue;
    var k = ContentExtraction_tagKey_(disp);
    if (!k) continue;
    countByKey[k] = cloud[i].count || 0;
    if (!displayByKey[k]) displayByKey[k] = disp;
  }
  var bk;
  for (bk in buckets) {
    if (!buckets.hasOwnProperty(bk)) continue;
    var displays = buckets[bk].displays || {};
    var list = [];
    var d;
    for (d in displays) {
      if (displays.hasOwnProperty(d)) list.push(d);
    }
    if (!list.length) continue;
    list.sort(function (a, b) {
      var ca = displays[a] || 0;
      var cb = displays[b] || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b));
    });
    allDisplaysByKey[bk] = list;
    countByKey[bk] = buckets[bk].count || countByKey[bk] || 0;
    if (!displayByKey[bk]) displayByKey[bk] = list[0];
  }
  return {
    countByKey: countByKey,
    displayByKey: displayByKey,
    allDisplaysByKey: allDisplaysByKey,
  };
}

/**
 * @param {string} raw
 * @param {{displayByKey:Object<string,string>}} maps
 * @param {Array<{tag:string,count:number}>} cloud
 * @return {string} #display o ''
 */
function ContentTagMergeSuggest_resolveDisplay_(raw, maps, cloud) {
  var disp = ContentExtraction_toCamelTag_(raw);
  if (!disp) {
    var s = String(raw || '').trim();
    if (s.charAt(0) !== '#') s = '#' + s;
    disp = ContentExtraction_toCamelTag_(s) || s;
  }
  var dk = ContentExtraction_tagKey_(disp);
  if (!dk) return '';
  if (maps.displayByKey[dk]) return maps.displayByKey[dk];
  var ci;
  for (ci = 0; ci < cloud.length; ci++) {
    var cd = ContentExtraction_toCamelTag_(cloud[ci].tag);
    if (!cd) continue;
    if (ContentExtraction_tagKey_(cd) === dk) return maps.displayByKey[dk] || cd;
  }
  return '';
}

/**
 * @param {string} locale
 * @return {string}
 */
function ContentTagMergeSuggest_systemPrompt_(locale) {
  var loc = String(locale || '').toLowerCase();
  var reasonLang = loc.indexOf('es') === 0 ? 'Spanish' : 'English';
  return PromptCatalog_render('tags.merge.system', { reasonLanguage: reasonLang });
}

/**
 * @param {Array<{tag:string,count:number}>} slice
 * @param {Object<string,string>} aliasIndex
 * @return {string}
 */
function ContentTagMergeSuggest_buildUserPrompt_(slice, aliasIndex) {
  var tagsBodyLines = [];
  var i;
  for (i = 0; i < slice.length; i++) {
    tagsBodyLines.push(String(slice[i].tag || '') + ' (' + String(slice[i].count || 0) + ')');
  }
  var aliasesBody = '';
  var aliasKeys = [];
  var ak;
  for (ak in aliasIndex) {
    if (aliasIndex.hasOwnProperty(ak)) aliasKeys.push(ak);
  }
  if (aliasKeys.length) {
    var aliasLines = ['Already merged aliases (do not suggest these sources again):'];
    for (i = 0; i < aliasKeys.length && i < 40; i++) {
      var key = aliasKeys[i];
      aliasLines.push('#' + key + ' -> ' + String(aliasIndex[key] || ''));
    }
    aliasesBody = '\n' + aliasLines.join('\n');
  }
  return PromptCatalog_render('tags.merge.user', {
    tagsBody: tagsBodyLines.join('\n'),
    aliasesBody: aliasesBody,
  });
}

/**
 * @param {string} text
 * @return {Array<Object>}
 */
function ContentTagMergeSuggest_parseGroups_(text) {
  var raw = String(text || '').trim();
  if (!raw) return [];
  var parsed = ContentExtraction_parseLooseJson_(raw);
  if (!parsed || typeof parsed !== 'object') {
    var fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence && fence[1]) {
      parsed = ContentExtraction_parseLooseJson_(fence[1]);
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  var groups = parsed.groups || parsed.merges || parsed.suggestions || [];
  return Array.isArray(groups) ? groups : [];
}

/**
 * @param {Array<string>} displays
 * @param {{countByKey:Object<string,number>,displayByKey:Object<string,string>}} maps
 * @param {Object<string,string>} aliasIndex
 * @param {Array<{tag:string,count:number}>} cloud
 * @param {string} reason
 * @return {Object|null}
 */
function ContentTagMergeSuggest_buildSuggestion_(displays, maps, aliasIndex, cloud, reason) {
  if (!displays || displays.length < 2) return null;
  return ContentTagMergeSuggest_normalizeGroup_(
    { tags: displays, reason: reason },
    maps,
    aliasIndex,
    cloud,
  );
}

/**
 * @param {Object} group
 * @param {{countByKey:Object<string,number>,displayByKey:Object<string,string>}} maps
 * @param {Object<string,string>} aliasIndex
 * @param {Array<{tag:string,count:number}>} cloud
 * @return {Object|null}
 */
function ContentTagMergeSuggest_normalizeGroup_(group, maps, aliasIndex, cloud) {
  var rawTags = group && group.tags ? group.tags : [];
  if (!Array.isArray(rawTags) || rawTags.length < 2) return null;

  var displays = [];
  var seen = {};
  var ti;
  for (ti = 0; ti < rawTags.length; ti++) {
    var disp = ContentTagMergeSuggest_resolveDisplay_(rawTags[ti], maps, cloud);
    if (!disp) continue;
    var dk = ContentExtraction_tagKey_(disp);
    if (!dk) continue;
    disp = maps.displayByKey[dk] || disp;
    if (seen[dk]) continue;
    seen[dk] = true;
    displays.push(disp);
  }
  if (displays.length < 2) return null;

  var resolved = [];
  for (ti = 0; ti < displays.length; ti++) {
    var rk = ContentExtraction_tagKey_(displays[ti]);
    var canon = aliasIndex[rk] || displays[ti];
    var ck = ContentExtraction_tagKey_(canon);
    if (!maps.displayByKey[ck]) continue;
    canon = maps.displayByKey[ck];
    var ckey = ContentExtraction_tagKey_(canon);
    if (!seen[ckey]) {
      seen[ckey] = true;
      resolved.push(canon);
    }
  }
  if (resolved.length < 2) return null;

  var target = ContentCatalog_pickCanonicalTag_(cloud, resolved);
  if (!target) return null;
  var targetKey = ContentExtraction_tagKey_(target);
  var sources = [];
  for (ti = 0; ti < resolved.length; ti++) {
    if (ContentExtraction_tagKey_(resolved[ti]) !== targetKey) {
      sources.push(resolved[ti]);
    }
  }
  if (!sources.length) return null;

  var docCount = maps.countByKey[targetKey] || 0;
  var si;
  for (si = 0; si < sources.length; si++) {
    docCount += maps.countByKey[ContentExtraction_tagKey_(sources[si])] || 0;
  }

  return {
    tags: resolved,
    target: target,
    sources: sources,
    reason: String((group && group.reason) || '').trim().slice(0, 280),
    docCount: docCount,
  };
}

/**
 * @param {Object<string,{count:number,displays:Object<string,number>}>} buckets
 * @param {{countByKey:Object<string,number>,displayByKey:Object<string,string>}} maps
 * @param {Object<string,string>} aliasIndex
 * @param {Array<{tag:string,count:number}>} cloud
 * @param {string} locale
 * @return {Array<Object>}
 */
function ContentTagMergeSuggest_heuristicSpelling_(buckets, maps, aliasIndex, cloud, locale) {
  var reason = UiStrings_t(locale, 'tags_suggest_reason_spelling');
  var out = [];
  var k;
  for (k in buckets) {
    if (!buckets.hasOwnProperty(k)) continue;
    var displays = buckets[k].displays || {};
    var keys = [];
    var d;
    for (d in displays) {
      if (displays.hasOwnProperty(d)) keys.push(d);
    }
    if (keys.length < 2) continue;
    keys.sort(function (a, b) {
      var ca = displays[a] || 0;
      var cb = displays[b] || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b));
    });
    var built = ContentTagMergeSuggest_buildSuggestion_(
      keys,
      maps,
      aliasIndex,
      cloud,
      reason,
    );
    if (built) out.push(built);
  }
  return out;
}

/**
 * @param {Array<Object>} suggestions
 * @return {Array<Object>}
 */
function ContentTagMergeSuggest_dedupeSuggestions_(suggestions) {
  var out = [];
  var usedKeys = {};
  var i;
  var j;
  for (i = 0; i < suggestions.length; i++) {
    var s = suggestions[i];
    if (!s || !s.target) continue;
    var overlap = false;
    var tags = s.tags || [];
    for (j = 0; j < tags.length; j++) {
      var k = ContentExtraction_tagKey_(tags[j]);
      if (usedKeys[k]) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;
    for (j = 0; j < tags.length; j++) {
      usedKeys[ContentExtraction_tagKey_(tags[j])] = true;
    }
    out.push(s);
  }
  out.sort(function (a, b) {
    return (b.docCount || 0) - (a.docCount || 0);
  });
  return out;
}

/**
 * Sugerencias de fusión (heurística + Globant Chat). El canónico final es el más usado del grupo.
 * @return {{ok:boolean,suggestions:Array<Object>,total:number,model:string,heuristicCount:number,llmCount:number}}
 */
function ContentTagMergeSuggest_list() {
  ContentCatalog_requireContributor_();
  AdminAuth_requireTagsView();

  var buckets = ContentCatalog_aggregateTagBuckets_();
  var cloud = ContentCatalog_tagsCloudFromBuckets_(buckets);
  if (cloud.length < 2) {
    return {
      ok: true,
      suggestions: [],
      total: 0,
      model: '',
      heuristicCount: 0,
      llmCount: 0,
    };
  }

  var aliasIndex = ContentCatalog_getTagAliasIndex_();
  var locale = UiStrings_activeLocale_();
  var maps = ContentTagMergeSuggest_buildCloudMaps_(cloud, buckets);
  var suggestions = ContentTagMergeSuggest_heuristicSpelling_(
    buckets,
    maps,
    aliasIndex,
    cloud,
    locale,
  );
  var heuristicCount = suggestions.length;

  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(UiStrings_t(locale, 'err_falta_globant_key'));
  }
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var client = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  var slice = cloud.slice(0, CONTENT_TAG_MERGE_SUGGEST_MAX);
  var chat = client.chatSimple(
    ContentTagMergeSuggest_systemPrompt_(locale),
    ContentTagMergeSuggest_buildUserPrompt_(slice, aliasIndex),
    GlobantAssistant_resolveChatModel_(),
  );

  var rawGroups = ContentTagMergeSuggest_parseGroups_(chat.text || '');
  var llmCount = 0;
  var gi;
  for (gi = 0; gi < rawGroups.length; gi++) {
    var norm = ContentTagMergeSuggest_normalizeGroup_(
      rawGroups[gi],
      maps,
      aliasIndex,
      cloud,
    );
    if (norm) {
      suggestions.push(norm);
      llmCount++;
    }
  }
  suggestions = ContentTagMergeSuggest_dedupeSuggestions_(suggestions);

  return {
    ok: true,
    suggestions: suggestions,
    total: suggestions.length,
    model: GlobantAssistant_resolveChatModel_(),
    heuristicCount: heuristicCount,
    llmCount: llmCount,
  };
}

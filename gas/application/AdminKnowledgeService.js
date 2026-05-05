/**
 * @fileoverview Corpus admin — fuentes Drive (carpetas + archivos) para un perfil Globant RAG.
 * Persistencia: **ADMIN_KNOWLEDGE_SOURCES** JSON; migración desde ADMIN_KNOWLEDGE_FOLDER_IDS.
 */

var _AK_PROP_FOLDERS_LEGACY = 'ADMIN_KNOWLEDGE_FOLDER_IDS';
var _AK_PROP_SOURCES = 'ADMIN_KNOWLEDGE_SOURCES';
var _AK_PROP_PROFILE = 'ADMIN_KNOWLEDGE_PROFILE_NAME';
var _AK_PROP_LAST_SYNC = 'ADMIN_KNOWLEDGE_LAST_SYNC';
var _AK_PROP_MAX_FILES = 'ADMIN_SYNC_MAX_FILES';
var _GLOBANT_PROFILE = 'GLOBANT_RAG_PROFILE_NAME';
var _GLOBANT_KEY = 'GLOBANT_AGENTS_API_KEY';
var _GLOBANT_BASE = 'GLOBANT_RAG_BASE_URL';

/** @type {string} */
var ADMIN_KNOWLEDGE_DEFAULT_PROFILE = 'aviators-drive-corpus';

/**
 * @param {Object} props
 * @return {{ folders: Array<{id:string,name:string}>, files: Array<{id:string,name:string}> }}
 */
function AdminKnowledge_loadSources(props) {
  var raw = (props.getProperty(_AK_PROP_SOURCES) || '').trim();
  if (raw) {
    try {
      var obj = JSON.parse(raw);
      var folders = [];
      var files = [];
      if (Array.isArray(obj.folders)) {
        for (var i = 0; i < obj.folders.length; i++) {
          var fe = obj.folders[i];
          if (!fe || typeof fe.id !== 'string') continue;
          var fn = ('' + (fe.name || fe.id)).trim() || fe.id;
          folders.push({ id: fe.id.trim(), name: fn });
        }
      }
      if (Array.isArray(obj.files)) {
        for (var j = 0; j < obj.files.length; j++) {
          var ge = obj.files[j];
          if (!ge || typeof ge.id !== 'string') continue;
          var gn = ('' + (ge.name || ge.id)).trim() || ge.id;
          files.push({ id: ge.id.trim(), name: gn });
        }
      }
      return { folders: folders, files: files };
    } catch (ignore) {
      /* legacy */
    }
  }

  var leg = (props.getProperty(_AK_PROP_FOLDERS_LEGACY) || '').trim();
  if (!leg) {
    return { folders: [], files: [] };
  }
  var ids = [];
  try {
    if (leg.charAt(0) === '[') {
      var arr = JSON.parse(leg);
      for (var k = 0; k < arr.length; k++) {
        var sid = ('' + arr[k]).trim();
        if (sid) ids.push(sid);
      }
    } else {
      var parts = leg.split(/[\s,;\n\r]+/);
      for (var p = 0; p < parts.length; p++) {
        var t = ('' + parts[p]).trim();
        if (t) ids.push(t);
      }
    }
  } catch (e2) {
    return { folders: [], files: [] };
  }

  var outF = [];
  for (var x = 0; x < ids.length; x++) {
    outF.push({
      id: ids[x],
      name: UiStrings_t(UiStrings_activeLocale_(), 'generic_folder_name'),
    });
  }
  return { folders: outF, files: [] };
}

/**
 * @return {{ isAdmin: boolean, sources: Object, folderIds: string[], fileIds: string[], profileName: string, lastSync: string, maxFiles: number }}
 */
function AdminKnowledge_getBootstrapSlice() {
  var p = PropertiesService.getScriptProperties();
  var src = AdminKnowledge_loadSources(p);

  var prof = (p.getProperty(_AK_PROP_PROFILE) || '').trim();
  if (!prof) prof = ADMIN_KNOWLEDGE_DEFAULT_PROFILE;

  var maxR = (p.getProperty(_AK_PROP_MAX_FILES) || '').trim();
  var maxFiles = 25;
  if (maxR) {
    var n = parseInt(maxR, 10);
    if (!isNaN(n) && n > 0) maxFiles = Math.min(n, 80);
  }

  return {
    isAdmin: AdminAuth_sessionIsAdmin(),
    sources: src,
    folderIds: src.folders.map(function (f) {
      return f.id;
    }),
    fileIds: src.files.map(function (f) {
      return f.id;
    }),
    profileName: prof,
    lastSync: (p.getProperty(_AK_PROP_LAST_SYNC) || '').trim(),
    maxFiles: maxFiles,
  };
}

/**
 * @param {string} sourcesJson
 * @param {string} profileName
 */
function AdminKnowledge_saveConfiguration(sourcesJson, profileName) {
  AdminAuth_requireAdmin();
  var text = ('' + (sourcesJson || '')).trim();
  var folders = [];
  var files = [];

  if (!text) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'admin_sources_empty_input'),
    );
  }

  if (text.charAt(0) === '{') {
    try {
      var parsed = JSON.parse(text);
      if (Array.isArray(parsed.folders)) {
        for (var i = 0; i < parsed.folders.length; i++) {
          var fe = parsed.folders[i];
          if (fe && typeof fe.id === 'string' && fe.id.trim()) {
            folders.push({
              id: fe.id.trim(),
              name:
                ('' + (fe.name || UiStrings_t(UiStrings_activeLocale_(), 'generic_folder_name'))).trim() ||
                fe.id,
            });
          }
        }
      }
      if (Array.isArray(parsed.files)) {
        for (var j = 0; j < parsed.files.length; j++) {
          var ge = parsed.files[j];
          if (ge && typeof ge.id === 'string' && ge.id.trim()) {
            files.push({
              id: ge.id.trim(),
              name:
                ('' + (ge.name || UiStrings_t(UiStrings_activeLocale_(), 'generic_file_name'))).trim() ||
                ge.id,
            });
          }
        }
      }
    } catch (ep) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', { message: ep.message }),
      );
    }
  } else if (text.charAt(0) === '[') {
    var arr = JSON.parse(text);
    if (!Array.isArray(arr))
      throw new Error(
        UiStrings_t(
          UiStrings_activeLocale_(),
          'admin_sources_folder_ids_not_array',
        ),
      );
    for (var k = 0; k < arr.length; k++) {
      var cid = ('' + arr[k]).trim();
      if (cid)
        folders.push({
          id: cid,
          name: UiStrings_t(UiStrings_activeLocale_(), 'generic_folder_name'),
        });
    }
  } else {
    var bits = text.split(/[\s,;\n\r]+/);
    for (var b = 0; b < bits.length; b++) {
      var lid = ('' + bits[b]).trim();
      if (lid)
        folders.push({
          id: lid,
          name: UiStrings_t(UiStrings_activeLocale_(), 'generic_folder_name'),
        });
    }
  }

  if (folders.length === 0 && files.length === 0) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_sources_need_one'),
    );
  }

  for (var vf = 0; vf < folders.length; vf++) {
    try {
      var fev = DriveApp.getFileById(folders[vf].id);
      if (fev.getMimeType() !== MimeType.FOLDER) {
        throw new Error(
          UiStrings_fmt_('admin_folder_not_a_folder_type', {
            name: folders[vf].name,
            mime: fev.getMimeType(),
          }),
        );
      }
    } catch (verr) {
      throw new Error(
        UiStrings_fmt_('admin_folder_access_denied', {
          name: folders[vf].name,
          reason: verr.message || String(verr),
        }),
      );
    }
  }

  var payload = { folders: folders, files: files };
  var pwr = PropertiesService.getScriptProperties();
  pwr.setProperty(_AK_PROP_SOURCES, JSON.stringify(payload));
  pwr.deleteProperty(_AK_PROP_FOLDERS_LEGACY);

  var pn = ('' + (profileName || '')).trim();
  if (!pn) pn = ADMIN_KNOWLEDGE_DEFAULT_PROFILE;
  pwr.setProperty(_AK_PROP_PROFILE, pn);

  return {
    ok: true,
    folderCount: folders.length,
    fileCount: files.length,
    profileName: pn,
  };
}

function AdminKnowledge_buildSyncFileIds(props, maxFiles) {
  return AdminKnowledge_buildSyncFileIdsFromSources(
    AdminKnowledge_loadSources(props),
    maxFiles,
  );
}

/**
 * @param {{ folders: Array<{id:string,name:string}>, files: Array<{id:string,name:string}> }} sources
 * @param {number} maxFiles
 * @return {string[]}
 */
function AdminKnowledge_buildSyncFileIdsFromSources(sources, maxFiles) {
  var src = sources || { folders: [], files: [] };
  var seen = {};
  var out = [];

  function add(id) {
    if (!id || seen[id] || out.length >= maxFiles) return;
    seen[id] = true;
    out.push(id);
  }

  var fi = 0;
  for (; fi < src.files.length && out.length < maxFiles; fi++) {
    try {
      var fobj = DriveApp.getFileById(src.files[fi].id);
      if (DriveDocuments_mimeEligibleForGlobantRag(fobj.getMimeType())) {
        add(src.files[fi].id);
      }
    } catch (ignore) {}
  }

  var rem = maxFiles - out.length;
  if (rem > 0 && src.folders.length) {
    var fids = [];
    var fj = 0;
    for (; fj < src.folders.length; fj++) {
      fids.push(src.folders[fj].id);
    }
    var fromTree = DriveDocuments_collectGlobantRagSourceIdsFromFolders(
      fids,
      rem,
      12,
    );
    var t = 0;
    for (; t < fromTree.length && out.length < maxFiles; t++) {
      add(fromTree[t]);
    }
  }

  return out;
}

/**
 * Persiste únicamente la carpeta raíz y ejecuta sincronización recursiva hacia Globant (un solo flujo).
 *
 * @param {string} rootFolderInput · URL Drive o ID
 * @param {string} [profileName]
 * @return {Object}
 */
function AdminKnowledge_saveRootFolderOnlyAndSync(rootFolderInput, profileName) {
  AdminAuth_requireAdmin();

  var fid = DriveDocuments_parseDriveFolderIdFromInput(rootFolderInput);

  /** @type {GoogleAppsScript.Drive.Folder} */
  var rootFo;
  try {
    rootFo = DriveApp.getFolderById(fid);
  } catch (e) {
    throw new Error(
      UiStrings_fmt_('admin_root_folder_access_denied', {
        tail: fid.slice(-8),
        reason: e && e.message ? e.message : String(e),
      }),
    );
  }

  AdminKnowledge_saveConfiguration(
    JSON.stringify({
      folders: [{ id: fid, name: rootFo.getName() || UiStrings_t(UiStrings_activeLocale_(), 'label_root_short') }],
      files: [],
    }),
    profileName,
  );

  var sr = AdminKnowledge_syncCorpusFromDrive();
  return {
    folderId: fid,
    folderName: rootFo.getName() || fid,
    profileName: sr.profileName,
    docCount: sr.docCount,
    uploaded: sr.uploaded,
    note: sr.note,
  };
}

/**
 * Sincroniza corpus Drive → Globant RAG para un perfil y fuentes concretas.
 *
 * @param {Object} opts
 * @param {string} opts.profileName
 * @param {{ folders: Array<{id:string,name:string}>, files: Array<{id:string,name:string}> }} opts.sources
 * @param {string} [opts.searchPrompt] · si viene vacío, usa plantilla por defecto
 * @param {string} [opts.description] · descripción del perfil en Globant
 * @param {number} [opts.maxFiles]
 * @return {{ profileName: string, docCount: number, uploaded: number, note: string }}
 */
function AdminKnowledge_syncCorpusWithOptions(opts) {
  AdminAuth_requireAdmin();

  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_corpus_globant_only'),
    );
  }

  var props = PropertiesService.getScriptProperties();
  if (LlmProviderGlobant_isAssistantMode(props)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'admin_corpus_assistant_no_search'),
    );
  }

  var apiKey = (props.getProperty(_GLOBANT_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));

  var bootstrap = AdminKnowledge_getBootstrapSlice();
  var maxF =
    opts.maxFiles != null && opts.maxFiles > 0
      ? Math.min(80, opts.maxFiles)
      : bootstrap.maxFiles;

  var profileName = ('' + (opts.profileName || '')).trim();
  if (!profileName) profileName = ADMIN_KNOWLEDGE_DEFAULT_PROFILE;

  var docIds = AdminKnowledge_buildSyncFileIdsFromSources(opts.sources, maxF);
  if (docIds.length === 0) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'admin_corpus_nothing_to_index'),
    );
  }

  var baseUrl = (props.getProperty(_GLOBANT_BASE) || '').trim();
  var client = GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  try {
    client.deleteProfile(profileName);
  } catch (delE) {}

  var defaultDesc = UiStrings_t(
    UiStrings_activeLocale_(),
    'admin_rag_default_profile_description',
  );
  var desc =
    opts.description != null && String(opts.description).trim()
      ? String(opts.description).trim()
      : defaultDesc;

  var prompt = (opts.searchPrompt || '').trim();
  if (prompt) {
    client.createProfile(
      GlobantRagDefaults_buildCreateProfileWithSearchPrompt(
        profileName,
        desc,
        prompt,
      ),
    );
  } else {
    client.createProfile(GlobantRagDefaults_buildCreateProfileBody(profileName, desc));
  }

  var uploaded = 0;
  var idx = 0;
  for (; idx < docIds.length; idx++) {
    var blob = DriveDocuments_getPdfBlobForGlobant(docIds[idx]);
    var up = client.uploadPdfDocument(profileName, blob);
    var ok = GlobantRagApiClient_waitIndexed(client, profileName, up.id, 14, 4000);
    if (!ok) {
      throw new Error(
        UiStrings_fmt_('admin_corpus_index_failed', {
          current: String(idx + 1),
          total: String(docIds.length),
        }),
      );
    }
    uploaded++;
  }

  props.setProperty(_GLOBANT_PROFILE, profileName);
  props.setProperty(_AK_PROP_LAST_SYNC, new Date().toISOString());
  props.setProperty(_AK_PROP_SOURCES, JSON.stringify(opts.sources));
  props.setProperty(_AK_PROP_PROFILE, profileName);
  props.deleteProperty('GLOBANT_RAG_DOCUMENT_ID');

  return {
    profileName: profileName,
    docCount: docIds.length,
    uploaded: uploaded,
    note: UiStrings_t(
      UiStrings_activeLocale_(),
      'admin_corpus_sync_return_note',
    ),
  };
}

function AdminKnowledge_syncCorpusFromDrive() {
  var props = PropertiesService.getScriptProperties();
  var bootstrap = AdminKnowledge_getBootstrapSlice();
  var profileName =
    (props.getProperty(_AK_PROP_PROFILE) || '').trim() ||
    ADMIN_KNOWLEDGE_DEFAULT_PROFILE;
  var sources = AdminKnowledge_loadSources(props);
  return AdminKnowledge_syncCorpusWithOptions({
    profileName: profileName,
    sources: sources,
    searchPrompt: '',
    maxFiles: bootstrap.maxFiles,
  });
}

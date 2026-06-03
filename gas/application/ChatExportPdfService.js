/**
 * @fileoverview Exportacion de conversaciones / respuestas del chat a PDF (HtmlService).
 * Maquetacion formal: logo Aviators, tipografia clara, colores slate/sky discretos.
 */

/** @const {number} */
var CHAT_EXPORT_PDF_MAX_MESSAGES_ = 40;

/**
 * @param {Object} payload
 * @return {{ok:boolean, filename:string, mimeType:string, pdfBase64:string}}
 */
function ChatExportPdf_export_(payload) {
  var p = payload && typeof payload === 'object' ? payload : {};
  var locale = p.locale === 'en' ? 'en' : 'es';
  var mode = p.mode === 'turn' ? 'turn' : 'conversation';
  var messages = ChatExportPdf_normalizeMessages_(p.messages);
  if (!messages.length) {
    AviatorsError_throw_('ERR_CHAT_EXPORT_EMPTY', 'ChatExportPdf_export_');
  }

  if (mode === 'turn') {
    messages = ChatExportPdf_sliceTurnMessages_(messages, p.turnIndex);
    if (!messages.length) {
      AviatorsError_throw_('ERR_CHAT_EXPORT_EMPTY', 'ChatExportPdf_export_', 'turn');
    }
  } else if (messages.length > CHAT_EXPORT_PDF_MAX_MESSAGES_) {
    messages = messages.slice(messages.length - CHAT_EXPORT_PDF_MAX_MESSAGES_);
  }

  var logoSrc = ChatExportPdf_resolveLogoSrc_(p.logoSrc);
  var docTitle =
    mode === 'turn'
      ? UiStrings_t(locale, 'chat_export_turn_title')
      : UiStrings_t(locale, 'chat_export_title');
  var html = ChatExportPdf_buildDocumentHtml_(messages, locale, logoSrc, docTitle);
  var blob;
  try {
    blob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
  } catch (ePdf) {
    AviatorsError_log_('ChatExportPdf_export_', ePdf);
    AviatorsError_throw_('ERR_CHAT_EXPORT_PDF', 'ChatExportPdf_export_');
  }

  return {
    ok: true,
    filename: ChatExportPdf_filename_(mode, locale),
    mimeType: 'application/pdf',
    pdfBase64: Utilities.base64Encode(blob.getBytes()),
  };
}

/**
 * @param {*} raw
 * @return {Array<Object>}
 */
function ChatExportPdf_normalizeMessages_(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (eJ) {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var m = raw[i];
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    out.push({
      role: m.role,
      content: String(m.content || ''),
      metaLine: m.metaLine != null ? String(m.metaLine) : '',
      attachmentName: m.attachmentName != null ? String(m.attachmentName) : '',
      references: Array.isArray(m.references) ? m.references : [],
    });
  }
  return out;
}

/**
 * @param {Array<Object>} messages
 * @param {number} turnIndex
 * @return {Array<Object>}
 */
function ChatExportPdf_sliceTurnMessages_(messages, turnIndex) {
  var idx = parseInt(String(turnIndex), 10);
  if (isNaN(idx) || idx < 0 || idx >= messages.length) return [];
  if (messages[idx].role !== 'assistant') return [];
  var slice = [];
  for (var u = idx - 1; u >= 0; u--) {
    if (messages[u].role === 'user') {
      slice.push(messages[u]);
      break;
    }
  }
  slice.push(messages[idx]);
  return slice;
}

/**
 * Logo: payload del cliente o fragmento chat-export-logo.html (embed-logo.cjs).
 * @param {string} clientSrc
 * @return {string}
 */
function ChatExportPdf_resolveLogoSrc_(clientSrc) {
  var fromClient = ChatExportPdf_sanitizeLogoSrc_(clientSrc);
  if (fromClient) return fromClient;
  try {
    var fragment = HtmlService.createHtmlOutputFromFile('chat-export-logo').getContent();
    var m = /src=["']([^"']+)["']/i.exec(fragment);
    if (m && m[1]) return ChatExportPdf_sanitizeLogoSrc_(m[1]);
  } catch (eLogo) {}
  return '';
}

/**
 * @param {string} src
 * @return {string}
 */
function ChatExportPdf_sanitizeLogoSrc_(src) {
  var s = String(src || '').trim();
  if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(s)) {
    return '';
  }
  return s.replace(/\s+/g, '');
}

/**
 * @param {'conversation'|'turn'} mode
 * @param {'es'|'en'} locale
 * @return {string}
 */
function ChatExportPdf_filename_(mode, locale) {
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');
  var base = mode === 'turn' ? 'aviators-response' : 'aviators-conversation';
  return base + '-' + stamp + '.pdf';
}

/**
 * @param {string} s
 * @return {string}
 */
function ChatExportPdf_escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} href
 * @return {string}
 */
function ChatExportPdf_sanitizeUrl_(href) {
  var h = String(href || '').trim();
  if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h)) return h;
  if (/^aviators:\/\//i.test(h)) return h;
  return '';
}

/**
 * @param {string} escaped
 * @return {string}
 */
function ChatExportPdf_inlineMarkdown_(escaped) {
  var s = String(escaped || '');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_m, label, url) {
    var safe = ChatExportPdf_sanitizeUrl_(url);
    if (!safe) return label;
    return (
      '<a href="' +
      ChatExportPdf_escapeHtml_(safe) +
      '">' +
      label +
      '</a>'
    );
  });
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  return s;
}

/**
 * @param {string} raw
 * @return {string}
 */
function ChatExportPdf_renderMarkdown_(raw) {
  var text = String(raw || '');
  if (!text.trim()) return '';

  var lines = text.split(/\r?\n/);
  var html = [];
  var inCode = false;
  var codeBuf = [];
  var listType = null;
  var para = [];

  function flushPara() {
    if (!para.length) return;
    html.push(
      '<p>' + ChatExportPdf_inlineMarkdown_(ChatExportPdf_escapeHtml_(para.join(' '))) + '</p>',
    );
    para = [];
  }

  function closeList() {
    if (listType) {
      html.push('</' + listType + '>');
      listType = null;
    }
  }

  var i;
  for (i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^```/.test(line)) {
      flushPara();
      closeList();
      if (inCode) {
        html.push(
          '<pre><code>' + ChatExportPdf_escapeHtml_(codeBuf.join('\n')) + '</code></pre>',
        );
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    var ul = /^(\s*)[-*•]\s+(.+)$/.exec(line);
    var ol = /^(\s*)\d+\.\s+(.+)$/.exec(line);
    if (ul) {
      flushPara();
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(
        '<li>' + ChatExportPdf_inlineMarkdown_(ChatExportPdf_escapeHtml_(ul[2])) + '</li>',
      );
      continue;
    }
    if (ol) {
      flushPara();
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(
        '<li>' + ChatExportPdf_inlineMarkdown_(ChatExportPdf_escapeHtml_(ol[2])) + '</li>',
      );
      continue;
    }

    closeList();
    if (!String(line || '').trim()) {
      flushPara();
      continue;
    }

    var hd = /^(#{1,3})\s+(.+)$/.exec(line);
    if (hd) {
      flushPara();
      var level = hd[1].length;
      var tag = 'h' + Math.min(level + 2, 4);
      html.push(
        '<' +
          tag +
          ' class="md-h">' +
          ChatExportPdf_inlineMarkdown_(ChatExportPdf_escapeHtml_(hd[2])) +
          '</' +
          tag +
          '>',
      );
      continue;
    }

    para.push(String(line).trim());
  }

  flushPara();
  closeList();
  if (inCode && codeBuf.length) {
    html.push('<pre><code>' + ChatExportPdf_escapeHtml_(codeBuf.join('\n')) + '</code></pre>');
  }

  return '<div class="md">' + html.join('') + '</div>';
}

/**
 * @param {'es'|'en'} locale
 * @param {string} contentType
 * @return {string}
 */
function ChatExportPdf_refTypeLabel_(locale, contentType) {
  var t = String(contentType || '').trim();
  if (t === 'proposal') return UiStrings_t(locale, 'contents_type_proposal');
  if (t === 'success_case') return UiStrings_t(locale, 'contents_type_success_case');
  if (t === 'client') return UiStrings_t(locale, 'contents_type_client');
  if (t === 'onboarding') return UiStrings_t(locale, 'contents_type_onboarding');
  if (t === 'selected_file') return UiStrings_t(locale, 'chat_ref_type_selected_file');
  return t || '-';
}

/**
 * @param {Object} ref
 * @return {string}
 */
function ChatExportPdf_refExportUrl_(ref) {
  var r = ref || {};
  var driveUrl = String(r.url || '').trim();
  if (!driveUrl && r.driveFileId) {
    driveUrl = 'https://drive.google.com/open?id=' + encodeURIComponent(String(r.driveFileId));
  }
  if (driveUrl) return driveUrl;
  var contentId = String(r.contentId || '').trim();
  if (contentId) return 'aviators://contents/' + contentId;
  var profile = String(r.globantProfileName || r.profileName || '').trim();
  if (profile) return 'aviators://agents/' + encodeURIComponent(profile);
  return '';
}

/**
 * @param {Array<Object>} references
 * @param {'es'|'en'} locale
 * @return {string}
 */
function ChatExportPdf_refsHtml_(references, locale) {
  var refs = Array.isArray(references) ? references : [];
  if (!refs.length) return '';
  var items = [];
  var ri;
  for (ri = 0; ri < refs.length; ri++) {
    var ref = refs[ri] || {};
    var line =
      ChatExportPdf_escapeHtml_(ChatExportPdf_refTypeLabel_(locale, ref.contentType)) +
      ' - ' +
      ChatExportPdf_escapeHtml_(ref.title || UiStrings_t(locale, 'chat_history_untitled'));
    if (ref.clientName) {
      line += ' (' + ChatExportPdf_escapeHtml_(String(ref.clientName)) + ')';
    }
    var url = ChatExportPdf_refExportUrl_(ref);
    if (url) {
      line +=
        ' <span class="ref-url">(' +
        ChatExportPdf_escapeHtml_(url) +
        ')</span>';
    }
    items.push('<li>' + line + '</li>');
  }
  return (
    '<div class="refs">' +
    '<p class="refs-title">' +
    ChatExportPdf_escapeHtml_(UiStrings_t(locale, 'chat_refs_title')) +
    '</p>' +
    '<ul>' +
    items.join('') +
    '</ul></div>'
  );
}

/**
 * @param {Object} m
 * @param {'es'|'en'} locale
 * @return {string}
 */
function ChatExportPdf_turnHtml_(m, locale) {
  var isUser = m.role === 'user';
  var heading = isUser
    ? UiStrings_t(locale, 'chat_sr_you')
    : UiStrings_t(locale, 'chat_sr_agent');
  var body = isUser
    ? '<p class="plain">' +
      ChatExportPdf_escapeHtml_(m.content || '').replace(/\n/g, '<br>') +
      '</p>'
    : ChatExportPdf_renderMarkdown_(m.content || '');
  var extra = '';
  if (m.attachmentName) {
    extra +=
      '<p class="meta">' +
      ChatExportPdf_escapeHtml_(
        ChatExportPdf_fmt_(locale, 'chat_attach_selected', { name: m.attachmentName }),
      ) +
      '</p>';
  }
  if (m.metaLine) {
    extra += '<p class="meta">' + ChatExportPdf_escapeHtml_(m.metaLine) + '</p>';
  }
  if (!isUser) {
    extra += ChatExportPdf_refsHtml_(m.references, locale);
  }
  return (
    '<section class="turn ' +
    (isUser ? 'turn-user' : 'turn-agent') +
    '">' +
    '<h2 class="turn-label">' +
    ChatExportPdf_escapeHtml_(heading) +
    '</h2>' +
    '<div class="turn-body">' +
    body +
    extra +
    '</div></section>'
  );
}

/**
 * @param {'es'|'en'} locale
 * @param {string} key
 * @param {Object<string, string|number>} vars
 * @return {string}
 */
function ChatExportPdf_fmt_(locale, key, vars) {
  var s = UiStrings_t(locale, key);
  if (!vars) return s;
  for (var k in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, k)) {
      s = s.split('{' + k + '}').join(String(vars[k]));
    }
  }
  return s;
}

/**
 * @param {Array<Object>} messages
 * @param {'es'|'en'} locale
 * @param {string} logoSrc
 * @param {string} docTitle
 * @return {string}
 */
function ChatExportPdf_buildDocumentHtml_(messages, locale, logoSrc, docTitle) {
  var tz = Session.getScriptTimeZone() || 'UTC';
  var stamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  var subtitle = ChatExportPdf_fmt_(locale, 'chat_export_doc_subtitle', { date: stamp });

  var turns = [];
  var i;
  for (i = 0; i < messages.length; i++) {
    turns.push(ChatExportPdf_turnHtml_(messages[i], locale));
  }

  var logoBlock = logoSrc
    ? '<img class="logo" src="' + logoSrc + '" alt="Aviators" width="120" height="40" />'
    : '<span class="logo-text">Aviators</span>';

  var styles = [
    '@page { margin: 18mm 16mm 20mm 16mm; }',
    'body {',
    '  font-family: "Segoe UI", Helvetica, Arial, sans-serif;',
    '  font-size: 11pt;',
    '  line-height: 1.55;',
    '  color: #1e293b;',
    '  margin: 0;',
    '  background: #ffffff;',
    '}',
    '.doc { max-width: 42rem; margin: 0 auto; }',
    '.pdf-header {',
    '  border-bottom: 2px solid #0ea5e9;',
    '  padding-bottom: 14px;',
    '  margin-bottom: 22px;',
    '}',
    '.pdf-header-top { width: 100%; border-collapse: collapse; }',
    '.pdf-header-top td { vertical-align: middle; padding: 0; }',
    '.logo { display: block; max-height: 44px; width: auto; height: auto; }',
    '.logo-text { font-size: 18pt; font-weight: 700; color: #0369a1; letter-spacing: 0.02em; }',
    '.doc-title {',
    '  margin: 12px 0 0 0;',
    '  font-size: 15pt;',
    '  font-weight: 600;',
    '  color: #0f172a;',
    '}',
    '.doc-subtitle {',
    '  margin: 4px 0 0 0;',
    '  font-size: 9.5pt;',
    '  color: #64748b;',
    '}',
    '.turn { margin-bottom: 18px; page-break-inside: avoid; }',
    '.turn-user {',
    '  background: #f0f9ff;',
    '  border-left: 4px solid #0284c7;',
    '  padding: 12px 14px;',
    '}',
    '.turn-agent {',
    '  border: 1px solid #e2e8f0;',
    '  padding: 14px 16px;',
    '  background: #fafbfc;',
    '}',
    '.turn-label {',
    '  margin: 0 0 8px 0;',
    '  font-size: 8.5pt;',
    '  font-weight: 600;',
    '  letter-spacing: 0.06em;',
    '  text-transform: uppercase;',
    '  color: #64748b;',
    '}',
    '.turn-body { font-size: 10.5pt; }',
    '.plain { margin: 0; white-space: pre-wrap; }',
    '.meta { margin: 10px 0 0 0; font-size: 9pt; color: #64748b; font-style: italic; }',
    '.refs { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; }',
    '.refs-title { margin: 0 0 6px 0; font-size: 9pt; font-weight: 600; color: #475569; }',
    '.refs ul { margin: 0; padding-left: 1.2rem; font-size: 9pt; color: #334155; }',
    '.refs li { margin-bottom: 4px; }',
    '.ref-url { color: #0369a1; word-break: break-all; }',
    '.md p { margin: 0 0 0.65em 0; }',
    '.md p:last-child { margin-bottom: 0; }',
    '.md ul, .md ol { margin: 0.4em 0 0.65em 1.2rem; padding: 0; }',
    '.md-h { margin: 0.85em 0 0.35em 0; font-size: 11pt; color: #0f172a; }',
    '.md pre {',
    '  background: #f1f5f9;',
    '  border: 1px solid #e2e8f0;',
    '  padding: 8px 10px;',
    '  font-size: 9pt;',
    '  overflow-x: auto;',
    '  white-space: pre-wrap;',
    '}',
    '.md code { font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f1f5f9; padding: 1px 4px; }',
    '.md a { color: #0369a1; text-decoration: none; }',
    '.pdf-footer {',
    '  margin-top: 28px;',
    '  padding-top: 10px;',
    '  border-top: 1px solid #e2e8f0;',
    '  font-size: 8.5pt;',
    '  color: #94a3b8;',
    '  text-align: center;',
    '}',
  ].join('\n');

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>' +
    ChatExportPdf_escapeHtml_(docTitle) +
    '</title>' +
    '<style>' +
    styles +
    '</style></head><body><div class="doc">' +
    '<header class="pdf-header">' +
    '<table class="pdf-header-top"><tr><td>' +
    logoBlock +
    '</td></tr></table>' +
    '<h1 class="doc-title">' +
    ChatExportPdf_escapeHtml_(docTitle) +
    '</h1>' +
    '<p class="doc-subtitle">' +
    ChatExportPdf_escapeHtml_(subtitle) +
    '</p></header>' +
    '<main>' +
    turns.join('') +
    '</main>' +
    '<footer class="pdf-footer">' +
    ChatExportPdf_escapeHtml_(UiStrings_t(locale, 'chat_export_footer')) +
    '</footer></div></body></html>'
  );
}

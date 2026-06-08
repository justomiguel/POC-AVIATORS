/**
 * @fileoverview Personalización de decks Google Slides para Armado de propuestas.
 *
 * Placeholders: {CLIENTE}, {Titulo}, {OUR_UNDERSTANDING}, {ITEMS_AGENDA}, {SEC_NUM}; casos de éxito:
 * {Casos_de_Exito}, {CASO_EXITO_CONTENTS} (slide plantilla o búsqueda por texto).
 * docs/PROPOSAL_BUILDING.md
 *
 * Índices 1-based en plantilla aerolíneas (antes de eliminar secciones opcionales):
 * Globant 4–8, Studio aerolíneas 9–11, entendimiento 12, solución 14, casos de éxito 16.
 */

/** Slide plantilla de casos de éxito (1-based) si no se encuentra por placeholder. */
var PROPOSAL_BUILDING_SUCCESS_CASE_SLIDE_INDEX = 16;

var PROPOSAL_BUILDING_SLIDE_GLOBANT_FIRST_ = 4;
var PROPOSAL_BUILDING_SLIDE_GLOBANT_LAST_ = 8;
var PROPOSAL_BUILDING_SLIDE_STUDIO_FIRST_ = 9;
var PROPOSAL_BUILDING_SLIDE_STUDIO_LAST_ = 11;
var PROPOSAL_BUILDING_SLIDE_UNDERSTANDING_ = 12;
var PROPOSAL_BUILDING_SLIDE_SOLUTION_ = 14;

var PROPOSAL_BUILDING_PLACEHOLDER_CLIENT_ = '{CLIENTE}';
var PROPOSAL_BUILDING_PLACEHOLDER_TITLE_ = '{Titulo}';
var PROPOSAL_BUILDING_PLACEHOLDER_UNDERSTANDING_ = '{OUR_UNDERSTANDING}';
var PROPOSAL_BUILDING_PLACEHOLDER_AGENDA_ = '{ITEMS_AGENDA}';
/** Número de sección en la slide ancla de cada bloque (reemplazo acotado por slide). */
var PROPOSAL_BUILDING_PLACEHOLDER_SECTION_NUM_ = '{SEC_NUM}';
var PROPOSAL_BUILDING_PLACEHOLDER_CASE_TITLE_ = '{Casos_de_Exito}';
var PROPOSAL_BUILDING_PLACEHOLDER_CASE_BODY_ = '{CASO_EXITO_CONTENTS}';

/**
 * @return {boolean}
 */
function ProposalBuildingSlides_apiAvailable_() {
  try {
    return typeof Slides !== 'undefined' && Slides && Slides.Presentations;
  } catch (e) {
    return false;
  }
}

/**
 * @param {string} presentationId
 * @return {Object}
 */
function ProposalBuildingSlides_getPresentation_(presentationId) {
  if (!ProposalBuildingSlides_apiAvailable_()) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_slides_api_unavailable'));
  }
  var id = String(presentationId || '').trim();
  if (!id) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_deck_template_missing'));
  return Slides.Presentations.get(id);
}

/**
 * @param {Object} presentation
 * @return {Array<string>}
 */
function ProposalBuildingSlides_listSlideIds_(presentation) {
  var slides = presentation && presentation.slides ? presentation.slides : [];
  var out = [];
  for (var i = 0; i < slides.length; i++) {
    var sid = String(slides[i].objectId || '').trim();
    if (sid) out.push(sid);
  }
  return out;
}

/**
 * @param {Object} presentation
 * @param {string} slideObjectId
 * @return {Object|null}
 */
function ProposalBuildingSlides_findSlide_(presentation, slideObjectId) {
  var slides = presentation && presentation.slides ? presentation.slides : [];
  var want = String(slideObjectId || '').trim();
  if (!want) return null;
  for (var i = 0; i < slides.length; i++) {
    if (String(slides[i].objectId || '') === want) return slides[i];
  }
  return null;
}

/**
 * @param {Object} presentation
 * @param {number} oneBasedIndex
 * @return {string}
 */
function ProposalBuildingSlides_getSlideIdByIndex_(presentation, oneBasedIndex) {
  var slides = presentation && presentation.slides ? presentation.slides : [];
  var idx = Math.max(0, Number(oneBasedIndex || 1) - 1);
  if (idx >= slides.length) return '';
  return String(slides[idx].objectId || '');
}

/**
 * @param {string} presentationId
 * @param {Array<Object>} requests
 * @return {Object}
 */
function ProposalBuildingSlides_batchUpdate_(presentationId, requests) {
  if (!requests || !requests.length) return { replies: [] };
  var batch = [];
  var i;
  for (i = 0; i < requests.length; i++) {
    batch.push(requests[i]);
    if (batch.length >= 40 || i === requests.length - 1) {
      Slides.Presentations.batchUpdate({ requests: batch }, presentationId);
      batch = [];
    }
  }
  return { replies: [] };
}

/**
 * @param {Object} resp
 * @return {string}
 */
function ProposalBuildingSlides_parseDuplicateReply_(resp) {
  var replies = resp && resp.replies ? resp.replies : [];
  for (var i = 0; i < replies.length; i++) {
    var dup = replies[i] && replies[i].duplicateObject;
    if (!dup) continue;
    if (dup.objectId) return String(dup.objectId);
    if (dup.objectIds && typeof dup.objectIds === 'object') {
      var k;
      for (k in dup.objectIds) {
        if (Object.prototype.hasOwnProperty.call(dup.objectIds, k)) {
          var v = String(dup.objectIds[k] || '').trim();
          if (v) return v;
        }
      }
    }
  }
  return '';
}

/**
 * @param {string} presentationId
 * @param {string} findText
 * @param {string} replaceText
 * @param {string=} pageObjectId
 */
function ProposalBuildingSlides_replaceAllText_(
  presentationId,
  findText,
  replaceText,
  pageObjectId,
) {
  var req = {
    replaceAllText: {
      containsText: {
        text: String(findText || ''),
        matchCase: true,
      },
      replaceText: String(replaceText != null ? replaceText : ''),
    },
  };
  if (pageObjectId) {
    req.replaceAllText.pageObjectIds = [String(pageObjectId)];
  }
  Slides.Presentations.batchUpdate({ requests: [req] }, presentationId);
}

/**
 * @param {Object} textElements
 * @return {string}
 */
function ProposalBuildingSlides_flattenText_(textElements) {
  var out = '';
  var list = textElements || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].textRun && list[i].textRun.content != null) {
      out += String(list[i].textRun.content);
    }
  }
  return out;
}

/**
 * @param {Object} pageElement
 * @param {string} slideObjectId
 * @param {Array<Object>} out
 */
function ProposalBuildingSlides_collectTextTargetsFromElement_(pageElement, slideObjectId, out) {
  if (!pageElement || typeof pageElement !== 'object') return;
  var objectId = String(pageElement.objectId || '');
  if (pageElement.shape && pageElement.shape.text && pageElement.shape.text.textElements) {
    out.push({
      slideObjectId: slideObjectId,
      objectId: objectId,
      textElements: pageElement.shape.text.textElements,
      fullText: ProposalBuildingSlides_flattenText_(pageElement.shape.text.textElements),
    });
  }
  if (pageElement.table && pageElement.table.tableRows) {
    var rows = pageElement.table.tableRows;
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].tableCells || [];
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        if (!cell || !cell.text || !cell.text.textElements) continue;
        out.push({
          slideObjectId: slideObjectId,
          objectId: objectId,
          cellLocation: { rowIndex: r, columnIndex: c },
          textElements: cell.text.textElements,
          fullText: ProposalBuildingSlides_flattenText_(cell.text.textElements),
        });
      }
    }
  }
}

/**
 * @param {Object} presentation
 * @param {string=} slideObjectId
 * @return {Array<Object>}
 */
function ProposalBuildingSlides_collectTextTargets_(presentation, slideObjectId) {
  var out = [];
  var slides = presentation && presentation.slides ? presentation.slides : [];
  var only = String(slideObjectId || '').trim();
  for (var s = 0; s < slides.length; s++) {
    var slide = slides[s];
    var sid = String(slide.objectId || '');
    if (only && sid !== only) continue;
    var pes = slide.pageElements || [];
    for (var i = 0; i < pes.length; i++) {
      ProposalBuildingSlides_collectTextTargetsFromElement_(pes[i], sid, out);
    }
  }
  return out;
}

/**
 * @param {Object} presentation
 * @param {string} needle
 * @return {string}
 */
function ProposalBuildingSlides_findSlideIdByPlaceholder_(presentation, needle) {
  var find = String(needle || '').trim();
  if (!find) return '';
  var targets = ProposalBuildingSlides_collectTextTargets_(presentation, '');
  for (var i = 0; i < targets.length; i++) {
    if (String(targets[i].fullText || '').indexOf(find) >= 0) {
      return String(targets[i].slideObjectId || '');
    }
  }
  return '';
}

/**
 * @param {string} prefix
 * @return {string}
 */
function ProposalBuildingSlides_newObjectId_(prefix) {
  var raw = String(prefix || 'pb') + '_' + Utilities.getUuid().replace(/-/g, '');
  if (raw.length > 48) raw = raw.slice(0, 48);
  return raw;
}

/**
 * @param {string} presentationId
 * @param {Array<string>} beforeIds
 * @return {Array<string>}
 */
function ProposalBuildingSlides_diffNewSlideIds_(presentationId, beforeIds) {
  var before = {};
  var i;
  for (i = 0; i < (beforeIds || []).length; i++) {
    before[beforeIds[i]] = true;
  }
  var after = ProposalBuildingSlides_listSlideIds_(
    ProposalBuildingSlides_getPresentation_(presentationId),
  );
  var out = [];
  for (i = 0; i < after.length; i++) {
    if (!before[after[i]]) out.push(after[i]);
  }
  return out;
}

/**
 * @param {string} presentationId
 * @param {string} sourceSlideId
 * @return {string}
 */
function ProposalBuildingSlides_duplicateSlideAfter_(presentationId, sourceSlideId) {
  var source = String(sourceSlideId || '').trim();
  if (!source) return '';

  var beforeIds = ProposalBuildingSlides_listSlideIds_(
    ProposalBuildingSlides_getPresentation_(presentationId),
  );
  var newSlideId = ProposalBuildingSlides_newObjectId_('pb_sc_slide');
  var objectIds = {};
  objectIds[source] = newSlideId;

  var resp = Slides.Presentations.batchUpdate(
    {
      requests: [
        {
          duplicateObject: {
            objectId: source,
            objectIds: objectIds,
          },
        },
      ],
    },
    presentationId,
  );

  var dupId = ProposalBuildingSlides_parseDuplicateReply_(resp) || newSlideId;
  if (dupId) return dupId;

  var created = ProposalBuildingSlides_diffNewSlideIds_(presentationId, beforeIds);
  if (created.length) return created[created.length - 1];
  return '';
}

/**
 * @param {string} presentationId
 * @param {string} slideObjectId
 */
function ProposalBuildingSlides_deleteSlide_(presentationId, slideObjectId) {
  var id = String(slideObjectId || '').trim();
  if (!id) return;
  Slides.Presentations.batchUpdate({ requests: [{ deleteObject: { objectId: id } }] }, presentationId);
}

/**
 * @param {{includeGlobant:boolean, includeAirlinesStudio:boolean}} deckOptions
 * @return {Array<number>}
 */
function ProposalBuildingSlides_collectDeletedSlideIndices_(deckOptions) {
  deckOptions = deckOptions || {};
  var deleted = [];
  var i;
  if (deckOptions.includeGlobant === false) {
    for (i = PROPOSAL_BUILDING_SLIDE_GLOBANT_FIRST_; i <= PROPOSAL_BUILDING_SLIDE_GLOBANT_LAST_; i++) {
      deleted.push(i);
    }
  }
  if (deckOptions.includeAirlinesStudio === false) {
    for (i = PROPOSAL_BUILDING_SLIDE_STUDIO_FIRST_; i <= PROPOSAL_BUILDING_SLIDE_STUDIO_LAST_; i++) {
      deleted.push(i);
    }
  }
  return deleted;
}

/**
 * @param {number} originalOneBased
 * @param {Array<number>} deletedIndices
 * @return {number}
 */
function ProposalBuildingSlides_mapOriginalSlideIndex_(originalOneBased, deletedIndices) {
  var removed = 0;
  var i;
  for (i = 0; i < deletedIndices.length; i++) {
    if (deletedIndices[i] < originalOneBased) removed++;
  }
  return originalOneBased - removed;
}

/**
 * @param {Object} presentation
 * @param {Array<number>} oneBasedIndices
 * @return {Array<string>}
 */
function ProposalBuildingSlides_resolveSlideIdsByOriginalIndices_(presentation, oneBasedIndices) {
  var ids = [];
  var seen = {};
  var i;
  for (i = 0; i < oneBasedIndices.length; i++) {
    var idx = Number(oneBasedIndices[i] || 0);
    if (idx <= 0 || seen[idx]) continue;
    seen[idx] = true;
    var oid = ProposalBuildingSlides_getSlideIdByIndex_(presentation, idx);
    if (oid) ids.push(oid);
  }
  return ids;
}

/**
 * @param {string} presentationId
 * @param {Object} presentation
 * @param {Array<number>} oneBasedIndices
 */
function ProposalBuildingSlides_deleteSlidesByOriginalIndices_(
  presentationId,
  presentation,
  oneBasedIndices,
) {
  var objectIds = ProposalBuildingSlides_resolveSlideIdsByOriginalIndices_(
    presentation,
    oneBasedIndices,
  );
  if (!objectIds.length) return;
  var requests = [];
  var i;
  for (i = 0; i < objectIds.length; i++) {
    requests.push({ deleteObject: { objectId: objectIds[i] } });
  }
  ProposalBuildingSlides_batchUpdate_(presentationId, requests);
}

/**
 * @param {{includeGlobant:boolean, includeAirlinesStudio:boolean}} deckOptions
 * @param {Array<number>} deletedIndices
 * @return {Array<{order:number, label:string, slide:number, originalSlideFirst:number, originalSlideLast:number}>}
 */
function ProposalBuildingSlides_buildAgendaItems_(deckOptions, deletedIndices) {
  deckOptions = deckOptions || {};
  deletedIndices = Array.isArray(deletedIndices) ? deletedIndices : [];
  var defs = [];

  if (deckOptions.includeGlobant !== false) {
    defs.push({
      labelKey: 'pb_agenda_item_globant',
      originalSlideFirst: PROPOSAL_BUILDING_SLIDE_GLOBANT_FIRST_,
      originalSlideLast: PROPOSAL_BUILDING_SLIDE_GLOBANT_LAST_,
    });
  }
  if (deckOptions.includeAirlinesStudio !== false) {
    defs.push({
      labelKey: 'pb_agenda_item_airlines_studio',
      originalSlideFirst: PROPOSAL_BUILDING_SLIDE_STUDIO_FIRST_,
      originalSlideLast: PROPOSAL_BUILDING_SLIDE_STUDIO_LAST_,
    });
  }
  defs.push({
    labelKey: 'pb_agenda_item_understanding',
    originalSlideFirst: PROPOSAL_BUILDING_SLIDE_UNDERSTANDING_,
    originalSlideLast: PROPOSAL_BUILDING_SLIDE_UNDERSTANDING_,
  });
  defs.push({
    labelKey: 'pb_agenda_item_solution',
    originalSlideFirst: PROPOSAL_BUILDING_SLIDE_SOLUTION_,
    originalSlideLast: PROPOSAL_BUILDING_SLIDE_SOLUTION_,
  });
  defs.push({
    labelKey: 'pb_agenda_item_success_cases',
    originalSlideFirst: PROPOSAL_BUILDING_SUCCESS_CASE_SLIDE_INDEX,
    originalSlideLast: PROPOSAL_BUILDING_SUCCESS_CASE_SLIDE_INDEX,
  });

  var items = [];
  var di;
  for (di = 0; di < defs.length; di++) {
    var def = defs[di];
    items.push({
      order: items.length + 1,
      label: UiStrings_t(UiStrings_activeLocale_(), def.labelKey),
      slide: ProposalBuildingSlides_mapOriginalSlideIndex_(def.originalSlideFirst, deletedIndices),
      originalSlideFirst: def.originalSlideFirst,
      originalSlideLast: def.originalSlideLast,
    });
  }
  return items;
}

/**
 * @param {Array<Object>} agendaItems
 * @return {string}
 */
function ProposalBuildingSlides_formatAgendaText_(agendaItems) {
  agendaItems = Array.isArray(agendaItems) ? agendaItems : [];
  var lines = [];
  var li;
  for (li = 0; li < agendaItems.length; li++) {
    var label = String((agendaItems[li] && agendaItems[li].label) || '').trim();
    if (label) lines.push(label);
  }
  return lines.join('\n');
}

/**
 * @param {{includeGlobant:boolean, includeAirlinesStudio:boolean}} deckOptions
 * @param {Array<number>} deletedIndices
 * @return {string}
 */
function ProposalBuildingSlides_buildAgendaText_(deckOptions, deletedIndices) {
  return ProposalBuildingSlides_formatAgendaText_(
    ProposalBuildingSlides_buildAgendaItems_(deckOptions, deletedIndices),
  );
}

/**
 * Reemplaza un placeholder en todos los shapes de una slide (más fiable que replaceAllText).
 * @param {string} presentationId
 * @param {Object} presentation
 * @param {string} slideObjectId
 * @param {string} placeholder
 * @param {string} newText
 */
function ProposalBuildingSlides_replacePlaceholderOnSlide_(
  presentationId,
  presentation,
  slideObjectId,
  placeholder,
  newText,
) {
  var slideId = String(slideObjectId || '').trim();
  if (!slideId) return;
  var targets = ProposalBuildingSlides_collectTextTargets_(presentation, slideId);
  var requests = [];
  var ti;
  for (ti = 0; ti < targets.length; ti++) {
    var batch = ProposalBuildingSlides_buildReplacePlaceholderRequests_(
      targets[ti],
      placeholder,
      newText,
      null,
    );
    var bi;
    for (bi = 0; bi < batch.length; bi++) requests.push(batch[bi]);
  }
  if (requests.length) ProposalBuildingSlides_batchUpdate_(presentationId, requests);
}

/**
 * Renumera {SEC_NUM} en todas las slides del bloque (1…N según secciones conservadas).
 * @param {string} presentationId
 * @param {Object} presentation
 * @param {Array<Object>} agendaItems
 * @param {Array<number>} deletedIndices
 */
function ProposalBuildingSlides_applySectionNumbers_(
  presentationId,
  presentation,
  agendaItems,
  deletedIndices,
) {
  agendaItems = Array.isArray(agendaItems) ? agendaItems : [];
  deletedIndices = Array.isArray(deletedIndices) ? deletedIndices : [];
  var deletedMap = {};
  var di;
  for (di = 0; di < deletedIndices.length; di++) {
    deletedMap[deletedIndices[di]] = true;
  }

  var i;
  for (i = 0; i < agendaItems.length; i++) {
    var row = agendaItems[i] || {};
    var orderStr = String(row.order || i + 1);
    var first = Number(row.originalSlideFirst || row.slide || 0);
    var last = Number(row.originalSlideLast || first);
    if (first <= 0) continue;
    if (last < first) last = first;

    var oi;
    for (oi = first; oi <= last; oi++) {
      if (deletedMap[oi]) continue;
      var mapped = ProposalBuildingSlides_mapOriginalSlideIndex_(oi, deletedIndices);
      var slideId = ProposalBuildingSlides_getSlideIdByIndex_(presentation, mapped);
      if (!slideId) continue;
      ProposalBuildingSlides_replacePlaceholderOnSlide_(
        presentationId,
        presentation,
        slideId,
        PROPOSAL_BUILDING_PLACEHOLDER_SECTION_NUM_,
        orderStr,
      );
    }
  }
}

/**
 * @param {Object} target
 * @param {string} placeholder
 * @param {string} newText
 * @param {{styles?:Array<Object>, bulletFrom?:number, bulletTo?:number}} styleBundle
 * @return {Array<Object>}
 */
function ProposalBuildingSlides_buildReplacePlaceholderRequests_(
  target,
  placeholder,
  newText,
  styleBundle,
) {
  var fullText = String(target.fullText || '');
  var ph = String(placeholder || '');
  var pos = fullText.indexOf(ph);
  if (pos < 0) return [];

  var start = pos;
  var end = pos + ph.length;
  var requests = [];

  var deleteReq = {
    deleteText: {
      objectId: target.objectId,
      textRange: { type: 'FIXED_RANGE', startIndex: start, endIndex: end },
    },
  };
  if (target.cellLocation) deleteReq.deleteText.cellLocation = target.cellLocation;
  requests.push(deleteReq);

  var insertReq = {
    insertText: {
      objectId: target.objectId,
      insertionIndex: start,
      text: String(newText || ''),
    },
  };
  if (target.cellLocation) insertReq.insertText.cellLocation = target.cellLocation;
  requests.push(insertReq);

  var styles = (styleBundle && styleBundle.styles) || [];
  for (var i = 0; i < styles.length; i++) {
    var st = styles[i];
    var upd = {
      updateTextStyle: {
        objectId: target.objectId,
        style: st.style || {},
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: start + Number(st.start || 0),
          endIndex: start + Number(st.end || 0),
        },
        fields: st.fields || 'bold',
      },
    };
    if (target.cellLocation) upd.updateTextStyle.cellLocation = target.cellLocation;
    requests.push(upd);
  }

  if (
    styleBundle &&
    styleBundle.bulletFrom != null &&
    styleBundle.bulletTo != null &&
    styleBundle.bulletTo > styleBundle.bulletFrom
  ) {
    var bulletReq = {
      createParagraphBullets: {
        objectId: target.objectId,
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: start + Number(styleBundle.bulletFrom),
          endIndex: start + Number(styleBundle.bulletTo),
        },
        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
      },
    };
    if (target.cellLocation) bulletReq.createParagraphBullets.cellLocation = target.cellLocation;
    requests.push(bulletReq);
  }

  return requests;
}

/**
 * @param {string} clientName
 * @param {Array<Object>} items
 * @param {string=} customIntro texto de apertura (p. ej. redactado por Globant AI)
 * @return {{plain:string, styles:Array<Object>, bulletFrom:number, bulletTo:number}}
 */
function ProposalBuildingSlides_buildUnderstandingContent_(clientName, items, customIntro) {
  var client = String(clientName || '').trim();
  if (!client) {
    client = UiStrings_t(UiStrings_activeLocale_(), 'pb_client_fallback_label');
  }
  var intro = String(customIntro || '').trim();
  if (!intro) {
    intro = UiStrings_fmt_('pb_understanding_intro', { client: client });
  }
  var scopeItems = Array.isArray(items) ? items : [];
  var lines = [];
  var li;
  for (li = 0; li < scopeItems.length; li++) {
    var it = scopeItems[li];
    if (!it || typeof it !== 'object') continue;
    var title = String(it.title || '').trim();
    var desc = String(it.description || '').trim();
    if (!title && !desc) continue;
    lines.push({ title: title, description: desc });
  }
  if (!lines.length) {
    lines.push({
      title: UiStrings_t(UiStrings_activeLocale_(), 'pb_understanding_fallback'),
      description: '',
    });
  }

  var plain = intro + '\n\n';
  var bulletStart = plain.length;
  for (li = 0; li < lines.length; li++) {
    var row = lines[li];
    if (row.title && row.description) {
      plain += row.title + ': ' + row.description;
    } else if (row.title) {
      plain += row.title;
    } else {
      plain += row.description;
    }
    if (li < lines.length - 1) plain += '\n';
  }
  var bulletEnd = plain.length;

  var styles = [];
  styles.push({
    start: 0,
    end: intro.length,
    style: { bold: true },
    fields: 'bold',
  });

  var clientPos = intro.indexOf(client);
  if (clientPos >= 0) {
    styles.push({
      start: clientPos,
      end: clientPos + client.length,
      style: { bold: true, italic: true },
      fields: 'bold,italic',
    });
  }

  var cursor = bulletStart;
  for (li = 0; li < lines.length; li++) {
    var ln = lines[li];
    if (ln.title) {
      styles.push({
        start: cursor,
        end: cursor + ln.title.length,
        style: { bold: true },
        fields: 'bold',
      });
    }
    if (ln.title && ln.description) {
      var sepStart = cursor + ln.title.length;
      var descStart = sepStart + 2;
      styles.push({
        start: descStart,
        end: descStart + ln.description.length,
        style: { italic: true },
        fields: 'italic',
      });
      cursor += ln.title.length + 2 + ln.description.length;
    } else if (ln.title) {
      cursor += ln.title.length;
    } else {
      cursor += ln.description.length;
    }
    if (li < lines.length - 1) cursor += 1;
  }

  return {
    plain: plain,
    styles: styles,
    bulletFrom: bulletStart,
    bulletTo: bulletEnd,
  };
}

/**
 * @param {string} presentationId
 * @param {string} clientName
 * @param {Array<Object>} scopeItems
 * @param {string=} customIntro
 */
function ProposalBuildingSlides_applyUnderstandingStyled_(
  presentationId,
  clientName,
  scopeItems,
  customIntro,
) {
  var presentation = ProposalBuildingSlides_getPresentation_(presentationId);
  var targets = ProposalBuildingSlides_collectTextTargets_(presentation, '');
  var content = ProposalBuildingSlides_buildUnderstandingContent_(
    clientName,
    scopeItems,
    customIntro,
  );
  var requests = [];
  var ti;

  for (ti = 0; ti < targets.length; ti++) {
    if (String(targets[ti].fullText || '').indexOf(PROPOSAL_BUILDING_PLACEHOLDER_UNDERSTANDING_) < 0) {
      continue;
    }
    var styleBundle = {
      styles: content.styles,
      bulletFrom: content.bulletFrom,
      bulletTo: content.bulletTo,
    };
    var chunk = ProposalBuildingSlides_buildReplacePlaceholderRequests_(
      targets[ti],
      PROPOSAL_BUILDING_PLACEHOLDER_UNDERSTANDING_,
      content.plain,
      styleBundle,
    );
    for (var c = 0; c < chunk.length; c++) requests.push(chunk[c]);
  }

  if (requests.length) {
    ProposalBuildingSlides_batchUpdate_(presentationId, requests);
    return;
  }

  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_UNDERSTANDING_,
    content.plain,
  );
}

/**
 * @param {string} presentationId
 * @param {string} slideObjectId
 * @param {string} needle
 * @param {string} url
 */
function ProposalBuildingSlides_applyHyperlinkOnSlide_(
  presentationId,
  slideObjectId,
  needle,
  url,
) {
  var linkUrl = String(url || '').trim();
  var find = String(needle || '').trim();
  if (!linkUrl || !find) return;

  var presentation = ProposalBuildingSlides_getPresentation_(presentationId);
  var targets = ProposalBuildingSlides_collectTextTargets_(presentation, slideObjectId);
  var requests = [];

  for (var t = 0; t < targets.length; t++) {
    var target = targets[t];
    var fullText = String(target.fullText || '');
    var pos = fullText.indexOf(find);
    if (pos < 0) continue;

    var req = {
      updateTextStyle: {
        style: { link: { url: linkUrl }, underline: true },
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: pos,
          endIndex: pos + find.length,
        },
        fields: 'link,underline',
      },
    };
    req.updateTextStyle.objectId = target.objectId;
    if (target.cellLocation) {
      req.updateTextStyle.cellLocation = target.cellLocation;
    }
    requests.push(req);
  }

  if (requests.length) ProposalBuildingSlides_batchUpdate_(presentationId, requests);
}

/**
 * @param {Object} successCase
 * @return {string}
 */
function ProposalBuildingSlides_formatCaseBody_(successCase) {
  successCase = successCase || {};
  var parts = [];
  var rationale = String(successCase.rationale || '').trim();
  if (rationale) {
    parts.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_success_case_why_label'));
    parts.push(rationale);
  }
  var summary = String(successCase.summary || '').trim();
  if (!summary && successCase.challenge) {
    summary = String(successCase.challenge || '').trim();
  }
  if (!summary) {
    summary = UiStrings_t(UiStrings_activeLocale_(), 'pb_success_case_summary_fallback');
  }
  if (summary) parts.push(summary);
  var body = parts.join('\n\n');
  var url = String(successCase.url || '').trim();
  if (!url) return body;
  var linkLabel = UiStrings_t(UiStrings_activeLocale_(), 'pb_success_case_link_label');
  return body + '\n\n' + linkLabel + ': ' + url;
}

/**
 * @param {string} presentationId
 * @param {string} slideObjectId
 * @param {Object} successCase
 */
function ProposalBuildingSlides_applySuccessCaseToSlide_(
  presentationId,
  slideObjectId,
  successCase,
) {
  var slideId = String(slideObjectId || '').trim();
  if (!slideId) return;
  successCase = successCase || {};
  var title = String(successCase.title || '').trim();
  if (!title) {
    title = UiStrings_t(UiStrings_activeLocale_(), 'pb_success_case_title_fallback');
  }
  var body = ProposalBuildingSlides_formatCaseBody_(successCase);
  var url = String(successCase.url || '').trim();

  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_CASE_TITLE_,
    title,
    slideId,
  );
  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_CASE_BODY_,
    body,
    slideId,
  );

  if (url && body.indexOf(url) >= 0) {
    ProposalBuildingSlides_applyHyperlinkOnSlide_(presentationId, slideId, url, url);
  }
}

/**
 * Clona la slide plantilla N veces (incluye la original).
 * Duplica siempre desde la plantilla original; orden: plantilla, dup1, dup2…
 *
 * @param {string} presentationId
 * @param {string} templateSlideId
 * @param {number} count
 * @return {Array<string>}
 */
function ProposalBuildingSlides_buildSuccessCaseSlideIds_(presentationId, templateSlideId, count) {
  var templateId = String(templateSlideId || '').trim();
  var n = Math.max(0, Number(count || 0));
  if (!templateId || n <= 0) return [];

  var slideIds = [templateId];
  var dupIds = [];
  var i;
  for (i = 1; i < n; i++) {
    var dupId = ProposalBuildingSlides_duplicateSlideAfter_(presentationId, templateId);
    if (!dupId) {
      console.log('[PB-SLIDES] duplicate failed at i=' + i);
      break;
    }
    dupIds.push(dupId);
  }
  dupIds.reverse();
  for (i = 0; i < dupIds.length; i++) slideIds.push(dupIds[i]);
  return slideIds;
}

/**
 * @param {string} presentationId
 * @param {Object} options
 * @return {{ok:boolean, successCasesApplied:number, warnings:Array<string>}}
 */
function ProposalBuildingSlides_customizeDeck_(presentationId, options) {
  options = options || {};
  var warnings = [];
  var clientName = String(options.clientName || '').trim();
  if (!clientName) {
    clientName = UiStrings_t(UiStrings_activeLocale_(), 'pb_client_fallback_label');
  }
  var deckTitle = String(options.deckTitle || '').trim();
  if (!deckTitle) {
    deckTitle = UiStrings_t(UiStrings_activeLocale_(), 'pb_deck_title_fallback');
  }
  var understanding = options.understanding && typeof options.understanding === 'object'
    ? options.understanding
    : null;
  var scopeItems = understanding && Array.isArray(understanding.items)
    ? understanding.items
    : Array.isArray(options.scopeItems)
      ? options.scopeItems
      : [];
  var understandingIntro = understanding ? String(understanding.intro || '').trim() : '';
  var deckOptions =
    options.deckOptions && typeof options.deckOptions === 'object' ? options.deckOptions : {};
  var deletedIndices = ProposalBuildingSlides_collectDeletedSlideIndices_(deckOptions);

  var presentation = ProposalBuildingSlides_getPresentation_(presentationId);
  if (deletedIndices.length) {
    ProposalBuildingSlides_deleteSlidesByOriginalIndices_(
      presentationId,
      presentation,
      deletedIndices,
    );
    presentation = ProposalBuildingSlides_getPresentation_(presentationId);
  }

  var mappedSuccessSlideIndex = ProposalBuildingSlides_mapOriginalSlideIndex_(
    PROPOSAL_BUILDING_SUCCESS_CASE_SLIDE_INDEX,
    deletedIndices,
  );
  var templateSlideId =
    ProposalBuildingSlides_findSlideIdByPlaceholder_(
      presentation,
      PROPOSAL_BUILDING_PLACEHOLDER_CASE_TITLE_,
    ) ||
    ProposalBuildingSlides_findSlideIdByPlaceholder_(
      presentation,
      PROPOSAL_BUILDING_PLACEHOLDER_CASE_BODY_,
    ) ||
    ProposalBuildingSlides_getSlideIdByIndex_(presentation, mappedSuccessSlideIndex);

  if (!templateSlideId) {
    warnings.push(
      UiStrings_fmt_('pb_warn_template_slide_missing', {
        slide: String(mappedSuccessSlideIndex),
      }),
    );
  }

  var agendaItems = ProposalBuildingSlides_buildAgendaItems_(deckOptions, deletedIndices);
  var agendaText = ProposalBuildingSlides_formatAgendaText_(agendaItems);
  ProposalBuildingSlides_applySectionNumbers_(
    presentationId,
    presentation,
    agendaItems,
    deletedIndices,
  );
  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_AGENDA_,
    agendaText,
  );
  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_CLIENT_,
    clientName,
  );
  ProposalBuildingSlides_replaceAllText_(
    presentationId,
    PROPOSAL_BUILDING_PLACEHOLDER_TITLE_,
    deckTitle,
  );
  ProposalBuildingSlides_applyUnderstandingStyled_(
    presentationId,
    clientName,
    scopeItems,
    understandingIntro,
  );

  var cases = Array.isArray(options.successCases) ? options.successCases : [];
  if (!templateSlideId) {
    return { ok: true, successCasesApplied: 0, warnings: warnings };
  }

  if (!cases.length) {
    ProposalBuildingSlides_deleteSlide_(presentationId, templateSlideId);
    warnings.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_warn_no_success_cases'));
    return { ok: true, successCasesApplied: 0, warnings: warnings };
  }

  var slideIds = ProposalBuildingSlides_buildSuccessCaseSlideIds_(
    presentationId,
    templateSlideId,
    cases.length,
  );
  if (slideIds.length < cases.length) {
    warnings.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_warn_success_slide_clone_failed'));
  }
  if (!slideIds.length) {
    return { ok: true, successCasesApplied: 0, warnings: warnings };
  }

  var applied = 0;
  var ci;
  for (ci = 0; ci < slideIds.length && ci < cases.length; ci++) {
    ProposalBuildingSlides_applySuccessCaseToSlide_(presentationId, slideIds[ci], cases[ci]);
    applied++;
  }

  return { ok: true, successCasesApplied: applied, warnings: warnings };
}

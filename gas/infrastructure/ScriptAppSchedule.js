/**
 * @fileoverview Triggers temporales Apps Script (ClockTriggerBuilder).
 * Usar .after(ms): no existe .afterMinutes() en la API de ScriptApp.
 */

/**
 * Programa un trigger one-shot que ejecuta handlerFunctionName tras N minutos.
 * Mínimo 1 minuto según documentación de ClockTriggerBuilder.after.
 *
 * @param {string} handlerFunctionName
 * @param {number} minutes
 */
function ScriptAppSchedule_afterMinutes_(handlerFunctionName, minutes) {
  var name = String(handlerFunctionName || '').trim();
  if (!name) {
    throw new Error('ScriptAppSchedule_afterMinutes_: handler required');
  }
  var ms = Math.max(60000, Math.round(Number(minutes) || 1) * 60000);
  ScriptApp.newTrigger(name).timeBased().after(ms).create();
}

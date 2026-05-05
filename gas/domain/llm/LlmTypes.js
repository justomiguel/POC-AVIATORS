/**
 * @fileoverview Contratos del dominio para consultas LLM / RAG (JSDoc).
 * Apps Script usa un solo ámbito global; estos tipos orientan implementaciones y callers.
 */

/**
 * @typedef {'globant'|'gemini_api'} LlmProviderKind
 */

/**
 * @typedef {Object} LlmConsultationCommand
 * @property {string} question
 * @property {string[]} driveFileIds — ids de archivos en Drive (máx. impuesto por aplicación).
 * @property {Array<{role:string,content:string}>} [history] — turnos previos para contexto multi-turn.
 */

/**
 * @typedef {Object} LlmConsultationAnswer
 * @property {string} answer
 * @property {string} model
 * @property {string} providerLabel — texto corto para meta UI.
 * @property {number} filesUsed
 */

/**
 * Puerto de aplicación: cualquier proveedor LLM implementa este contrato.
 * @typedef {Object} LlmConsultationPort
 * @property {function(LlmConsultationCommand): LlmConsultationAnswer} consultWithDriveDocuments
 */

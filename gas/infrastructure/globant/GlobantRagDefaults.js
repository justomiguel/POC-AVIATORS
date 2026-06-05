/**
 * @fileoverview Valores por defecto del payload de creación/actualización de perfil RAG Globant.
 * Centralizado para ajustar modelo, prompt y chunking sin tocar el cliente HTTP.
 * Contrato: RAG Assistants API — `searchOptions.search.prompt` (marcadores `{context}`, `{question}`).
 */

/**
 * Escapa llaves literales para plantillas LangChain f-string (Globant RAG).
 * Preserva marcadores RAG conocidos ({context}, {question}) si aparecen en el texto.
 *
 * @param {string} text
 * @param {string[]} [preserveKeys] — nombres sin llaves; vacío = escapar todas
 * @return {string}
 */
function GlobantRag_escapeLangChainFStringLiterals_(text, preserveKeys) {
  var t = '' + (text || '');
  if (!t) return t;
  var keys = preserveKeys == null ? ['context', 'question'] : preserveKeys;
  var holders = [];
  var i;
  for (i = 0; i < keys.length; i++) {
    var token = '{' + keys[i] + '}';
    var ph = '\uE000GRAG' + i + '\uE001';
    holders.push({ ph: ph, token: token });
    t = t.split(token).join(ph);
  }
  t = t.replace(/\{/g, '{{').replace(/\}/g, '}}');
  for (i = 0; i < holders.length; i++) {
    t = t.split(holders[i].ph).join(holders[i].token);
  }
  return t;
}

/** Tope de tokens LLM en perfiles RAG Globant (creación y actualización de prompt). */
var GLOBANT_RAG_DEFAULT_MAX_TOKENS = 8000;

/**
 * Bloque `searchOptions.llm` completo para POST/PUT de perfil (Globant rechaza llm parcial).
 * @return {{temperature:number,maxTokens:number,modelName:string,provider:string,type:string}}
 */
function GlobantRagDefaults_defaultSearchLlm_() {
  return {
    temperature: 0.2,
    maxTokens: GLOBANT_RAG_DEFAULT_MAX_TOKENS,
    modelName: 'chatgpt-4o-latest',
    provider: 'openai',
    type: '',
  };
}

/**
 * Fusiona LLM remoto con defaults; rellena modelName/provider si el PUT anterior dejó el perfil incompleto.
 * @param {Object} [remoteLlm]
 * @return {Object}
 */
function GlobantRagDefaults_mergeSearchLlm_(remoteLlm) {
  var base = GlobantRagDefaults_defaultSearchLlm_();
  var r = remoteLlm && typeof remoteLlm === 'object' ? remoteLlm : {};
  var modelName = String(r.modelName || r.model || '').trim();
  var provider = String(r.provider || '').trim();
  return {
    temperature:
      typeof r.temperature === 'number' && !isNaN(r.temperature)
        ? r.temperature
        : base.temperature,
    maxTokens: GLOBANT_RAG_DEFAULT_MAX_TOKENS,
    modelName: modelName || base.modelName,
    provider: provider || base.provider,
    type: r.type != null ? String(r.type) : base.type,
  };
}

/** @return {string} plantilla por defecto con marcadores RAG */
function GlobantRagDefaults_defaultSearchPrompt_() {
  return (
    'Sos un asistente en español. Si abajo hay contexto documental útil, desarrollá la respuesta con detalle, ' +
    'explicando y citando lo relevante del contexto (no te limites a un resumen de una línea). ' +
    'Priorizá respuestas completas y estructuradas cuando haya material útil. ' +
    'Si el contexto está vacío o la pregunta es solo un saludo o algo trivial (fecha, etc.), respondé de forma clara y breve; en cualquier otro caso priorizá extensión y detalle sobre brevedad.\n\n' +
    'Contexto:\n{context}\n\nPregunta: {question}\n'
  );
}

/**
 * Asegura plantilla válida para POST/PUT `/v1/search/profile` (Configuration — Prompt).
 * Si el texto no incluye `{context}` y `{question}`, los añade al final.
 *
 * @param {string} instructions
 * @return {string}
 */
function GlobantRagDefaults_coerceSearchPromptTemplate(instructions) {
  var t = ('' + (instructions || '')).trim();
  if (!t) return GlobantRagDefaults_defaultSearchPrompt_();
  t = GlobantRag_escapeLangChainFStringLiterals_(t, ['context', 'question']);
  var hasContext = t.indexOf('{context}') >= 0;
  var hasQuestion = t.indexOf('{question}') >= 0;
  if (hasContext && hasQuestion) return t;
  return (
    t +
    '\n\nContexto recuperado:\n{context}\n\nPregunta del usuario: {question}\n'
  );
}

/**
 * @param {string} name
 * @param {string} description
 * @return {Object} cuerpo POST /v1/search/profile
 */
function GlobantRagDefaults_buildCreateProfileBody(name, description) {
  return {
    name: name,
    description: description,
    searchOptions: {
      historyCount: 1,
      llm: GlobantRagDefaults_defaultSearchLlm_(),
      search: {
        k: 5,
        returnSourceDocuments: true,
        scoreThreshold: 0,
        prompt: GlobantRagDefaults_defaultSearchPrompt_(),
      },
    },
    indexOptions: {
      chunks: {
        chunkSize: 1000,
        chunkOverlap: 200,
      },
    },
    welcomeData: {
      title: 'Asistente',
      description: 'Podés hacer preguntas generales o sobre documentos indexados.',
      features: [
        {
          title: 'Chat',
          description: 'Preguntas libres en español',
        },
      ],
      examplesPrompt: [
        {
          title: 'Ejemplo',
          description: 'Pregunta del día',
          promptText: '¿Qué día es hoy y qué hora es en Buenos Aires?',
        },
      ],
    },
  };
}

/**
 * Igual que `GlobantRagDefaults_buildCreateProfileBody` pero con plantilla RAG personalizada
 * (`searchOptions.search.prompt`). Debe incluir los marcadores que use el backend (p. ej. `{context}` y `{question}`).
 *
 * @param {string} name
 * @param {string} description
 * @param {string} searchPromptTemplate
 * @return {Object}
 */
function GlobantRagDefaults_buildCreateProfileWithSearchPrompt(
  name,
  description,
  searchPromptTemplate,
) {
  var base = GlobantRagDefaults_buildCreateProfileBody(name, description);
  base.searchOptions.search.prompt = GlobantRagDefaults_coerceSearchPromptTemplate(
    searchPromptTemplate,
  );
  return base;
}

/**
 * Cuerpo PUT `/v1/search/profile/{name}` (sin `name` ni `indexOptions`).
 * Incluye `searchOptions.llm` completo (merge con remoto) para no dejar el perfil inválido.
 * No incluye `welcomeData` para no borrar la sección existente en Globant.
 *
 * @param {string} description
 * @param {string} searchPromptTemplate
 * @param {Object} [remoteLlm] — si se omite, se usan defaults completos
 * @return {Object}
 */
function GlobantRagDefaults_buildUpdateSearchPromptBody(
  description,
  searchPromptTemplate,
  remoteLlm,
) {
  var llm =
    remoteLlm != null
      ? GlobantRagDefaults_mergeSearchLlm_(remoteLlm)
      : GlobantRagDefaults_defaultSearchLlm_();
  return {
    description: description,
    status: 1,
    searchOptions: {
      llm: llm,
      search: {
        prompt: GlobantRagDefaults_coerceSearchPromptTemplate(searchPromptTemplate),
      },
    },
  };
}

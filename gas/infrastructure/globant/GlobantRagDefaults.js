/**
 * @fileoverview Valores por defecto del payload de creación de perfil Globant (SAIA / Agents API).
 * Centralizado para ajustar modelo, prompt y chunking sin tocar el cliente HTTP.
 */

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
      llm: {
        temperature: 0.2,
        maxTokens: 3000,
        modelName: 'chatgpt-4o-latest',
        provider: 'openai',
        type: '',
      },
      search: {
        k: 5,
        returnSourceDocuments: true,
        scoreThreshold: 0,
        prompt:
          'Sos un asistente en español. Si abajo hay contexto documental útil, basá la respuesta en él. ' +
          'Si el contexto está vacío o la pregunta es general (fecha, saludo, etc.), respondé de forma clara y breve.\n\n' +
          'Contexto:\n{context}\n\nPregunta: {question}\n',
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

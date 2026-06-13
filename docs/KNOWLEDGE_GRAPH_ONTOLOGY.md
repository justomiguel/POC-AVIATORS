# Grafo de Conocimiento v2.0 — Ontología

> Fase 1 · Definición formal de entidades y relaciones para el grafo de conocimiento de Aviators.

---

## Tarea 1.1 — Mapa de Contenidos por Tipo de Presentación

### Propuesta (`proposal`)

| # | Sección (Slide) | Descripción |
|---|---|---|
| 1 | Portada | Título, cliente, fecha |
| 2 | Contexto / Problema | Descripción del dolor o necesidad del cliente |
| 3 | Solución | Cómo Globant resuelve el problema |
| 4 | Cómo Funciona | Metodología, arquitectura o enfoque técnico |
| 5 | Caso de Éxito Relevante | Referencia a proyecto similar ya ejecutado |
| 6 | Equipo | Perfiles y capacidades del equipo propuesto |
| 7 | Pricing | Modelo de precio y estimación |
| 8 | Siguientes Pasos | Call to action y roadmap de decisión |

### Caso de Éxito (`success_case`)

| # | Sección (Slide) | Descripción |
|---|---|---|
| 1 | Portada | Cliente, industria, año |
| 2 | Desafío | Problema que enfrentaba el cliente |
| 3 | Solución Implementada | Qué construyó/entregó Globant |
| 4 | Tecnologías y Productos | Stack y studios de Globant involucrados |
| 5 | Resultados y Métricas | KPIs, impacto medible |
| 6 | Testimonio | Cita del cliente |
| 7 | Siguientes Pasos | Expansión o estado actual |

### Onboarding (`onboarding`)

| # | Sección (Slide) | Descripción |
|---|---|---|
| 1 | Bienvenida | Mensaje inicial al nuevo cliente/equipo |
| 2 | Globant Overview | Quiénes somos, escala, geografías |
| 3 | Modelo de Trabajo | Squads, delivery, rituales ágiles |
| 4 | Herramientas y Accesos | Stack tecnológico y onboarding técnico |
| 5 | Contactos Clave | Puntos de contacto del proyecto |
| 6 | Roadmap Inicial | Hitos de los primeros 30/60/90 días |

### Preventa (`presale`)

| # | Sección (Slide) | Descripción |
|---|---|---|
| 1 | Portada | Tema, fecha, audiencia |
| 2 | Agenda | Estructura de la reunión |
| 3 | Capacidades | Qué puede hacer Globant en el área |
| 4 | Casos Relevantes | Proyectos similares |
| 5 | Diferenciadores | Por qué Globant vs. competencia |
| 6 | Call to Action | Próximos pasos |

---

## Tarea 1.2 — Esquema del Grafo de Conocimiento v2.0

### Nodos (Entidades)

| Tipo (`node_type`) | Nombre lógico | Fuente de datos | Atributos en `payload` |
|---|---|---|---|
| `client` | Cliente | Tabla `clients` | `client_id`, `normalized_name` |
| `industry` | Industria | Campo `industry` de `clients`/`contents` | `slug` |
| `presentation_type` | TipoDePresentacion | Seeded estático | `slug`, `label_es`, `label_en` |
| `slide` | Slide / Sección | Seeded estático por tipo | `presentation_type`, `position`, `label_es` |
| `success_case` | CasoDeExito | `contents` donde `content_type = 'success_case'` | `content_id`, `title`, `client_name`, `industry` |
| `proposal` | Propuesta | `contents` donde `content_type = 'proposal'` | `content_id`, `title`, `client_name`, `stage`, `pricing_model` |
| `onboarding` | Onboarding | `contents` donde `content_type = 'onboarding'` | `content_id`, `title` |
| `presale` | Preventa | `contents` donde `content_type = 'presale'` | `content_id`, `title` |
| `globant_product` | Producto Globant | Tags / extracción IA | `slug`, `category` |
| `client_product` | Producto Cliente | Campo de contenido / extracción IA | `slug`, `client_id` |
| `feature` | Feature | Tags / extracción IA | `slug`, `globant_product_id` |
| `metric` | Metrica | Extracción IA de contenido | `content_id`, `value`, `unit` |
| `testimonial` | Testimonio | Extracción IA de contenido | `content_id`, `author`, `role` |

### Relaciones (Aristas)

| Relación (`relation_type`) | Origen | Destino | Descripción |
|---|---|---|---|
| `pertenece_a` | `client` | `industry` | El cliente pertenece a una industria |
| `es_sobre` | `success_case`, `proposal` | `client` | El contenido es sobre ese cliente |
| `demuestra_valor_de` | `success_case` | `globant_product` | El caso demuestra el valor de un producto Globant |
| `es_parte_de` | `success_case`, `proposal`, `onboarding`, `presale` | `presentation_type` | El contenido pertenece a un tipo de presentación |
| `puede_contener` | `slide` | `success_case` | Una sección puede referenciar un caso de éxito |
| `es_de` | `feature` | `globant_product` | La feature es parte de un producto Globant |
| `pertenece_a` | `metric` | `success_case` | La métrica es de ese caso de éxito |
| `pertenece_a` | `testimonial` | `success_case` | El testimonio es de ese caso de éxito |
| `pertenece_a` | `client_product` | `client` | El producto pertenece al cliente |
| `usa` | `success_case` | `feature` | El caso de éxito usó esa feature |
| `es_de` | `slide` | `presentation_type` | La sección pertenece a un tipo de presentación |

### Diagrama (texto)

```
[industry] <--[pertenece_a]-- [client]
                                  ^
                            [es_sobre]
                                  |
              [presentation_type] <--[es_parte_de]-- [success_case] --[demuestra_valor_de]--> [globant_product]
                      ^                                    |                                         ^
                 [es_de]                            [pertenece_a]                              [es_de]
                      |                           /           \                                      |
                  [slide] --[puede_contener]-->  [metric]  [testimonial]                        [feature]
```

---

## Nodos Estáticos (Seed)

### Tipos de Presentación

| `node_id` | `label` |
|---|---|
| `presentation_type:proposal` | Propuesta |
| `presentation_type:success_case` | Caso de Éxito |
| `presentation_type:onboarding` | Onboarding |
| `presentation_type:presale` | Preventa |

### Slides por Tipo

#### Propuesta
`slide:proposal_portada`, `slide:proposal_problema`, `slide:proposal_solucion`, `slide:proposal_como_funciona`, `slide:proposal_caso_exito`, `slide:proposal_equipo`, `slide:proposal_pricing`, `slide:proposal_siguientes_pasos`

#### Caso de Éxito
`slide:success_case_portada`, `slide:success_case_desafio`, `slide:success_case_solucion`, `slide:success_case_tecnologias`, `slide:success_case_resultados`, `slide:success_case_testimonio`, `slide:success_case_siguientes_pasos`

#### Onboarding
`slide:onboarding_bienvenida`, `slide:onboarding_overview`, `slide:onboarding_modelo_trabajo`, `slide:onboarding_herramientas`, `slide:onboarding_contactos`, `slide:onboarding_roadmap`

#### Preventa
`slide:presale_portada`, `slide:presale_agenda`, `slide:presale_capacidades`, `slide:presale_casos`, `slide:presale_diferenciadores`, `slide:presale_call_to_action`

---

## Notas de Implementación

- **`metric` y `testimonial`**: en Fase 1 se crean los nodos y relaciones base. El llenado desde extracción IA queda para Fase 2.
- **`globant_product` y `feature`**: en Fase 1 se derivan de los tags de contenido. En Fase 2 se reemplaza por un catálogo formal.
- **`client_product`**: stub en Fase 1, requiere campo nuevo en `contents` o extracción IA.
- **Migración**: el rebuild del grafo borra y recrea todos los nodos/aristas desde cero con la nueva ontología.

---

## Fase 2 — Extracción LLM ampliada (IMPLEMENTADA)

### Nuevos tipos de entidad (`node_type`) vía LLM

| Tipo | Descripción | Relación | Atributos extra en `payload` |
|---|---|---|---|
| `challenge` | Problema/desafío del cliente antes del engagement | `had_challenge` | — |
| `metric` | KPI o resultado cuantificado | `measured_by` | `value`, `unit` |
| `globant_product` | Producto, studio o capacidad de Globant (ej. AI Pods, Nearshore) | `leveraged_product` | `category` (opcional) |

### Nuevas relaciones LLM

| Relación | Origen | Destino |
|---|---|---|
| `had_challenge` | `content:*` | `challenge:*` |
| `measured_by` | `content:*` | `metric:*` |
| `leveraged_product` | `content:*` | `globant_product:*` |

### JSON schema del LLM (Fase 2)

```json
{
  "entities": [
    { "type": "challenge", "label": "Legacy PSS with high maintenance cost" },
    { "type": "metric", "label": "deployment frequency", "value": "3x", "unit": "x" },
    { "type": "globant_product", "label": "AI Pods", "category": "AI & Data" }
  ],
  "relations": [
    { "relation": "had_challenge", "entity_index": 0, "confidence": 0.9 },
    { "relation": "measured_by",   "entity_index": 1, "confidence": 0.85 },
    { "relation": "leveraged_product", "entity_index": 2, "confidence": 0.95 }
  ]
}
```

### Notas de Fase 2

- El prompt `kg.extract.system` se actualizó a `revision: 2` (ahora `revision: 3` con Fase 3). Un re-seed del catálogo de prompts aplicará el nuevo template.
- `globant_product` requiere slug de al menos 3 caracteres para evitar valores genéricos.
- Los nodos `metric` almacenan `value` y `unit` en el payload para futura exposición en UI.
- Rebuilding el grafo (Admin > Knowledge Graph > Rebuild) re-extrae todas las entidades con el prompt actualizado.

---

## Fase 3 — Mapeo de contenidos a tipos de slide (IMPLEMENTADA)

### Slide types válidos

| Slide type | Descripción | Inferido desde content_type |
|---|---|---|
| `executive_summary` | Overviews, introducción, perfiles de empresa | `proposal`, `presale` |
| `challenge_diagnosis` | Problemas del cliente, diagnóstico, pain-points | `proposal` |
| `proposed_solution` | Metodología, arquitectura, cómo Globant resuelve | `proposal`, `presale` |
| `success_case` | Casos de éxito, proyectos pasados, resultados | `success_case` |
| `team_credentials` | Perfiles de equipo, certificaciones, estructura | `presale`, `onboarding` |
| `commercial_proposal` | Pricing, cronograma, modelo de engagement | `proposal` |

### Cómo se asignan los slide_types

1. **Inferencia estructural** (`KnowledgeGraph_inferSlideTypes_`): en `syncContent_`, se asignan automáticamente según `content_type` sin llamadas HTTP.
2. **Refinamiento LLM** (`KnowledgeGraphExtraction_materialize_` + `KnowledgeGraph_updateSlideTypesForContent_`): el LLM puede agregar tipos adicionales (validados contra el enum) durante la fase `entities` del rebuild.
3. **Merge**: `KnowledgeGraph_mergeSlideTypes_` combina ambas fuentes sin duplicados.

### Campo en payload del nodo content:*

```json
{
  "content_id": "...",
  "content_type": "success_case",
  "slide_types": ["success_case"]
}
```

### Nueva función pública

**`KnowledgeGraph_findContentForSlideType_(slideType, brief)`**
- Retorna `Array<{contentId, slideTypes, label, contentType}>`
- Falla silenciosamente si el KG está vacío
- Útil para armado slide a slide de propuestas (habilita Fase 4)

### Cambios de prompt

- `kg.extract.system` actualizado a `revision: 3` con sección de slide_types
- JSON schema ahora incluye campo `slide_types: string[]` en la respuesta del LLM

### Notas de Fase 3

- Contenidos ingresados antes de Fase 3 necesitan rebuild para tener `slide_types` en el payload.
- El LLM solo puede **ampliar** los tipos estructurales, no reemplazarlos (merge preserva los inferidos desde `content_type`).
- `KG_SLIDE_TYPE_CONTENT_PAGE_MAX_ = 200` limita la query; aumentarlo si el catálogo crece.

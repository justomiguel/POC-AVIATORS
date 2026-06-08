# Aviators — Product context

## Register

**product** — internal operational tool (admin, dashboards, chat). Design serves workflows; clarity and efficiency over marketing polish.

## Users & purpose

- **Primary users:** Preventa, delivery y operaciones en Globant que consultan propuestas, success cases, clientes y onboarding.
- **Administrators:** Gestionan agentes RAG, catálogo de contenidos, clientes, métricas y resets operativos.
- **Context:** Uso diario en navegador (Google Workspace), sesión larga, multitarea entre chat y catálogos.
- **Job to be done:** Encontrar conocimiento relevante rápido (chat o catálogo), cargar/actualizar contenidos y medir adopción.

## Brand personality

Confiable · claro · operativo (no “startup hype”). Tono profesional B2B, cercano en español/inglés según usuario.

## Anti-references

- Landing pages genéricas con gradientes decorativos y copy vacío.
- Dashboards con cards anidadas sin jerarquía.
- Modales nativos del navegador (`window.confirm`) y acciones destructivas sin confirmación explícita.
- Literales de UI fuera del catálogo i18n.

## Strategic design principles

1. **Una acción primaria por pantalla** — el resto secundario u oculto hasta que haga falta.
2. **Confirmación proporcional al riesgo** — borrados y resets con diálogo unificado; resets globales con frase tipada.
3. **Feedback en toda operación async** — spinner/modal bloqueante, controles deshabilitados, cierre en éxito y error.
4. **Secciones con heading + lead** — cada bloque operativo explica qué es y qué puede hacer el usuario.
5. **Accesibilidad base** — contraste legible, `focus-visible`, `prefers-reduced-motion`, icono en botones de acción.

## Accessibility

- WCAG AA como objetivo (contraste, foco, labels).
- Soporte es/en con catálogo único (`gas/i18n/UiStrings.js`).
- Reduced motion respetado en animaciones decorativas.

## Platform constraints

- Google Apps Script + HtmlService (sin bundler en runtime).
- Tailwind compilado en local; CSS inyectado vía `tailwind-include.html`.
- Sin `npm install` en servidor; despliegue con clasp.

## Armado de propuestas

Pantalla **Armado de propuestas** (`view_proposal_building`): brief validado → industria (Aerolíneas / Logística) → copia automática de una plantilla Google Slides en `DRIVE_ROOT_FOLDER_ID/Propuestas/` con nombre `Cliente - Alcance`.

La plantilla debe incluir placeholders `{CLIENTE}`, `{OUR_UNDERSTANDING}` y, en la **slide 17**, `{Casos_de_Exito}` / `{CASO_EXITO_CONTENTS}` para clonar una slide por cada success case relevante del catálogo.

Configuración operativa (Script Properties, permisos Slides API, checklist): **[docs/PROPOSAL_BUILDING.md](docs/PROPOSAL_BUILDING.md)**.

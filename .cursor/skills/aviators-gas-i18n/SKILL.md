---
name: aviators-gas-i18n
description: >-
  Enforces i18n for Aviators HtmlService UI (gas/index.html and related): message
  catalogs, es/en keys, Intl formatting. Use when adding or changing user-visible
  strings, errors shown in the client, placeholders, or when the user mentions
  translation, locale, or i18n.
disable-model-invocation: false
---

# Aviators · GAS i18n

## Rules

1. **No one-off user-facing strings** in HTML/JS without a **stable key** in a message catalog (e.g. `messages.es`, `messages.en` or equivalent project structure).
2. **Minimum locales**: Spanish and English unless the product owner narrows scope.
3. **Detection**: Prefer `navigator.language` / `navigator.languages` on the client; optional server-passed `locale` from `doGet`/`getBootstrap` if the project already does that.
4. **Errors**: Prefer **stable error codes** from the server (`ERR_*`) mapped to translated strings on the client, unless the message is server-only and internal.
5. **Dates and numbers**: Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with the active locale.

## Agent workflow

When changing UI copy:

- Add or update the **same key** in **all** supported locale objects.
- Keep keys **stable** (snake_case or dotted namespaces, e.g. `admin.saveButton`, `errors.network`).
- If introducing a new pattern (first catalog file), place it where the team can import it from both HTML inline script and any shared JS — follow existing `gas/index.html` patterns.

## Related project rules

See `.cursor/rules/gas-i18n.mdc` for the always-on policy.

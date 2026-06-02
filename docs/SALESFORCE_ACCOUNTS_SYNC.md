# Salesforce Airlines Accounts → Aviators

Sincronización automática (diaria) desde la planilla de Google Sheets conectada a Salesforce hacia Supabase, el **maestro de clientes** y el **catálogo** (`contents` tipo `client` con embeddings).

## Requisitos previos

1. **Supabase**: ejecutar la migración `supabase/migrations/008_salesforce_accounts.sql` en el SQL Editor del proyecto.
2. **Script Properties** del proyecto Apps Script (⚙️ → *Propiedades del script*):

   | Propiedad | Valor | Obligatorio |
   |-----------|--------|-------------|
   | `SALESFORCE_ACCOUNTS_SPREADSHEET_ID` | ID de la planilla (`1Ond1zRUlXmscTlpFPuqbXMPfb1LibGSIzh1mz_Ea9xA`) o URL completa | Sí |
   | `SUPABASE_URL` | URL del proyecto | Sí |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role | Sí |
   | `GLOBANT_AGENTS_API_KEY` | Para embeddings | Sí (búsqueda semántica) |
3. **Acceso de la cuenta que ejecuta el script** a la planilla (la Web App suele desplegarse como *Ejecutar como: usuario que accede*; el **trigger diario** corre como el usuario que lo instaló — recomendado: cuenta de servicio o admin con acceso a la sheet).

4. **Scopes**: el manifiesto ya incluye `spreadsheets`.

## Despliegue del código

Desde la raíz del repo (con consentimiento explícito para prod):

```bash
npm run build:css   # si hubo cambios de UI
clasp push
# Publicar nueva versión de la Web App si aplica (./deploy)
```

## Puesta en marcha (una vez)

### 1. Migración SQL

En Supabase → SQL Editor, ejecutar el contenido de `008_salesforce_accounts.sql` y `009_clients_sub_industry.sql`.

### 2. Configurar propiedades

Ejemplo:

- `SALESFORCE_ACCOUNTS_SPREADSHEET_ID` = `1Ond1zRUlXmscTlpFPuqbXMPfb1LibGSIzh1mz_Ea9xA`

### 3. Primera sincronización

Opción A — **Configuración → pestaña Salesforce → «Sincronizar ahora»** (solo admin).

Opción B — Editor Apps Script: ejecutar `adminSalesforceAccountsRunSync` o `SalesforceAccounts_runFullSync(true)`.

Opción C — Consola del navegador (sesión admin):

```javascript
google.script.run
  .withSuccessHandler(console.log)
  .withFailureHandler(console.error)
  .adminSalesforceAccountsRunSync();
```

Verificar en Supabase:

- Tabla `salesforce_accounts` con filas activas.
- Tabla `clients` con cuentas nuevas o **enriquecidas** (`industry` / `sub_industry` solo si estaban vacías; `created_by` = `salesforce-sync` en altas nuevas).
- Tabla `contents` con `content_type = client`, `file_name` tipo `salesforce:…`, embeddings no nulos si Globant respondió.

### 4. Trigger diario

En la app: **Configuración → pestaña Salesforce** verás:

- **Programación automática:** cada día a las 06:00 (zona horaria del proyecto Apps Script).
- **Trigger instalado:** sí/no.
- **Última sincronización:** fecha y resultado de la última corrida (manual o automática).

Si el trigger no está instalado, usá **«Activar sync automático»** en el panel de estado de esa pestaña (solo admin).

Alternativa — ejecutar **una vez** (admin) desde consola o editor:

```javascript
google.script.run.adminSalesforceAccountsInstallDailyTrigger();
```

O en el editor: `adminSalesforceAccountsInstallDailyTrigger` / `SalesforceAccounts_installDailyTrigger`.

- Programación: **cada día a las 06:00** (huso horario del proyecto Apps Script → *Configuración del proyecto* → zona horaria).
- El job solo sincroniza si detecta un nuevo `Completed Successfully` en la pestaña **Automatic Operations Events Log** o si cambió el hash de **Sheet1**.

### 5. Prompt del agente Clients

Si el registry de agentes ya estaba guardado en Drive/Properties, actualizar el prompt:

```javascript
google.script.run.adminSalesforceAccountsRefreshClientsPrompt();
```

O editar manualmente el agente **clients** en Admin → Agentes (texto alineado al roster Salesforce + PDFs futuros).

## Comportamiento

| Tema | Detalle |
|------|---------|
| Fuente | Pestaña `Sheet1` (todas las filas) |
| Señal de cambio | Log `Automatic Operations Events Log` + hash de datos |
| Cuentas dadas de baja en SF | `is_active = false` en `salesforce_accounts`; filas de catálogo con nota histórica; **no se borran** |
| Clave | `Account Name` normalizado (único) |
| Account Owner | Solo nombre en catálogo/chat (no se crean usuarios ni roles automáticamente) |
| Chat | Agente **clients** usa catálogo semántico + RAG PDF cuando existan documentos subidos |

## Usuarios y roles

El sync **no** crea filas en `roles`. El Account Owner queda como texto en el roster y en `main_contact_name` del cliente cuando aplica. Los accesos se gestionan en **Configuración → Usuarios**.

## Operación y fallos

- Estado del último sync: `app_settings` clave `salesforce_accounts_sync`.
- Logs: Apps Script → *Ejecuciones* → `SalesforceAccounts_dailySyncJob_`.
- Si falla Supabase o falta `SALESFORCE_ACCOUNTS_SPREADSHEET_ID`, el job registra error en `last_sync_status`.

## Prueba del agente

En el chat, elegir agente **Clientes** y preguntar por ejemplo:

- «¿Quién es el account owner de Vueling Airlines?»
- «¿Qué cuentas están en prospect en Airlines 100Sq?»
- «Última oportunidad ganada de C.H. Robinson»

## Referencia de código

- `gas/application/SalesforceAccountsSyncService.js` — lógica de sync
- `gas/infrastructure/persistence/SalesforceAccountsStore.js` — tabla `salesforce_accounts`
- `gas/application/AdminAgentsService.js` — prompt por defecto del agente clients

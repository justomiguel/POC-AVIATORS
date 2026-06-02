-- Aviators · cuentas Salesforce (roster Airlines Accounts → Sheet1)
-- Ejecutar en SQL Editor de Supabase (después de 007_clients_logo_url.sql).

create table if not exists salesforce_accounts (
  account_key text primary key,
  account_name text not null,
  account_owner text not null default '',
  account_owner_email text not null default '',
  portfolio text not null default '',
  account_status text not null default '',
  account_type text not null default '',
  account_labels text not null default '',
  date_last_opty_created timestamptz,
  last_opportunity_won timestamptz,
  first_opportunity_won timestamptz,
  last_worked_opportunity_date timestamptz,
  industry text not null default '',
  sub_industry text not null default '',
  client_id uuid,
  content_id uuid,
  row_hash text not null default '',
  is_active boolean not null default true,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salesforce_accounts_name_idx on salesforce_accounts (account_name);
create index if not exists salesforce_accounts_active_idx on salesforce_accounts (is_active, updated_at desc);
create index if not exists salesforce_accounts_content_id_idx on salesforce_accounts (content_id);

comment on table salesforce_accounts is
  'Roster operativo sincronizado desde Google Sheets (Salesforce report). Fuente para agente clients.';
comment on column salesforce_accounts.account_key is
  'Clave natural: normalized Account Name (único en el reporte).';
comment on column salesforce_accounts.is_active is
  'false cuando la cuenta ya no aparece en Sheet1 (histórico conservado).';

alter table salesforce_accounts disable row level security;

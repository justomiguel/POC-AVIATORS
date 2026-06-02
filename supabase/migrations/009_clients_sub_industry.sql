-- Aviators · sub-industria en maestro de clientes (enriquecimiento desde Salesforce)
alter table clients
  add column if not exists sub_industry text not null default '';

comment on column clients.sub_industry is
  'Sub-industria (p. ej. desde roster Salesforce Airlines Accounts).';

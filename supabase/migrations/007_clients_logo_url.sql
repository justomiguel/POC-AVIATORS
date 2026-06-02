-- Logo de cliente (URL https o data URI image/* almacenada en BD)
alter table clients
  add column if not exists logo_url text not null default '';

comment on column clients.logo_url is
  'Logo del cliente: URL pública https o data URI (image/png, jpeg, webp, gif).';

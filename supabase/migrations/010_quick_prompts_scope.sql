-- Alcance de prompts rápidos: home (orquestador) u onboarding (agente fijo).
alter table quick_prompts
  add column if not exists scope text not null default 'home';

create index if not exists quick_prompts_scope_order_idx
  on quick_prompts (scope, sort_order);

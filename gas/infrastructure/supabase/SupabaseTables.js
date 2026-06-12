/**
 * @fileoverview Nombres de tablas Supabase (Postgres public).
 */

var SUPABASE_TABLE = Object.freeze({
  ROLES: 'roles',
  VISITORS: 'visitors',
  ACCESS_REQUESTS: 'access_requests',
  CLIENTS: 'clients',
  CONTENTS: 'contents',
  APP_SETTINGS: 'app_settings',
  USAGE_EVENTS: 'usage_events',
  UNANSWERED_QUERIES: 'unanswered_queries',
  FEEDBACK_EVENTS: 'feedback_events',
  CHAT_CONVERSATIONS: 'chat_conversations',
  QUICK_PROMPTS: 'quick_prompts',
  AGENT_API_CATALOG: 'agent_api_catalog',
  SALESFORCE_ACCOUNTS: 'salesforce_accounts',
  KNOWLEDGE_GRAPH_NODES: 'knowledge_graph_nodes',
  KNOWLEDGE_GRAPH_EDGES: 'knowledge_graph_edges',
  /** @deprecated Armado de propuestas usa Drive; no escribir en Supabase. */
  PROPOSAL_BUILDING_SESSIONS: 'proposal_building_sessions',
  MODULE_VISITS: 'module_visits',
  USER_PRESENCE: 'user_presence',
});

var SUPABASE_SETTINGS_KEY = Object.freeze({
  CONTROLLED_TAGS: 'catalog_controlled_tags',
  /** aliasKey (sin #) → display #tag canónico tras fusiones */
  TAG_ALIASES: 'catalog_tag_aliases',
  ROLE_DEFINITIONS: 'role_definitions',
  SALESFORCE_ACCOUNTS_SYNC: 'salesforce_accounts_sync',
  KNOWLEDGE_GRAPH_LIMITS: 'knowledge_graph_limits',
});

// Moved to @distri/state (framework-agnostic). Re-exported here so existing
// `@distri/react` import paths keep working unchanged.
export { IndexedDbStore } from '@distri/state'
export type { StoreRecord, StoreChangeOp, StoreChangeEvent } from '@distri/state'

export {
  createDbTools,
  dbToolsPrompt,
  DB_PUT_TOOL_DEF,
  DB_GET_TOOL_DEF,
  DB_LIST_TOOL_DEF,
  DB_SEARCH_TOOL_DEF,
  DB_DELETE_TOOL_DEF,
  DB_CLEAR_TOOL_DEF,
  DB_COLLECTIONS_TOOL_DEF,
  EXEC_JS_TOOL_DEF,
  createDbPutHandler,
  createDbGetHandler,
  createDbListHandler,
  createDbSearchHandler,
  createDbDeleteHandler,
  createDbClearHandler,
  createDbCollectionsHandler,
  createExecJsHandler,
  createDbPutTool,
  createDbGetTool,
  createDbListTool,
  createDbSearchTool,
  createDbDeleteTool,
  createDbClearTool,
  createDbCollectionsTool,
  createExecJsTool,
} from '@distri/state'
export type {
  CollectionDef,
  CreateDbToolsOptions,
  CreateDbToolsResult,
  ExecJsParams,
  ExecDbApi,
  CreateExecJsHandlerOptions,
} from '@distri/state'

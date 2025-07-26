import { createApprovalTool } from './tools/approvalTool';
import { createToastTool } from './tools/toastTool';

/**
 * Create all builtin tools as proper DistriTool objects
 */
export const createBuiltinTools = () => [
  createApprovalTool(),
  createToastTool(),
];

/**
 * Create individual builtin tools
 */
export { createApprovalTool } from './tools/approvalTool';
export { createToastTool } from './tools/toastTool';

// Legacy exports for backwards compatibility
export const createBuiltinToolHandlers = () => ({});
export const initializeBuiltinHandlers = () => {};
export const initializeSimpleBuiltinHandlers = () => {}; 
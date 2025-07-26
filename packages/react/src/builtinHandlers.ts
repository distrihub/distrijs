import { APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';

/**
 * Create builtin tools as DistriTool objects
 * These tools are handled by React components in the message renderer
 */
export const createBuiltinTools = () => [
  {
    name: APPROVAL_REQUEST_TOOL_NAME,
    description: 'Request user approval for actions',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for the approval request'
        },
        tool_calls: {
          type: 'array',
          description: 'Tool calls that need approval',
          items: { type: 'object' }
        }
      },
      required: ['reason']
    },
    // Handler is managed by React component in message renderer
    handler: async () => ({ pending: true })
  },
  {
    name: 'toast',
    description: 'Show a toast notification to the user',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to display in the toast'
        },
        type: {
          type: 'string',
          enum: ['success', 'error', 'warning', 'info'],
          description: 'Type of toast notification',
          default: 'info'
        }
      },
      required: ['message']
    },
    // Handler is managed by React component in message renderer
    handler: async () => ({ pending: true })
  }
];

/**
 * Create individual builtin tools
 */
export const createApprovalTool = () => createBuiltinTools()[0];
export const createToastTool = () => createBuiltinTools()[1];

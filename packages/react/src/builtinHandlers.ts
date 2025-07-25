import { DistriTool, APPROVAL_REQUEST_TOOL_NAME } from '@distri/core';

/**
 * Create built-in tools that can be added to agents
 * These tools provide common UI interactions
 */
export const createBuiltinTools = (): Record<string, DistriTool> => {
  const tools: Record<string, DistriTool> = {
    // Approval request tool
    [APPROVAL_REQUEST_TOOL_NAME]: {
      name: APPROVAL_REQUEST_TOOL_NAME,
      description: 'Request user approval for actions',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Approval prompt to show user' },
          action: { type: 'string', description: 'Action requiring approval' },
          tool_calls: { 
            type: 'array', 
            description: 'Tool calls requiring approval',
            items: {
              type: 'object',
              properties: {
                tool_call_id: { type: 'string' },
                tool_name: { type: 'string' },
                input: { type: 'object' }
              }
            }
          }
        },
        required: ['prompt']
      },
      handler: async (input: any) => {
        // This is handled by ExternalToolManager for UI interaction
        return { approved: false, message: 'Approval handled by UI' };
      }
    },

    // Toast notification tool
    toast: {
      name: 'toast',
      description: 'Show a toast notification to the user',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to display' },
          type: { 
            type: 'string', 
            enum: ['success', 'error', 'warning', 'info'], 
            default: 'info',
            description: 'Type of toast notification' 
          }
        },
        required: ['message']
      },
      handler: async (input: any) => {
        // This is handled by ExternalToolManager for UI interaction
        return { success: true, message: 'Toast displayed' };
      }
    },

    // Input request tool
    input_request: {
      name: 'input_request',
      description: 'Request text input from the user',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Prompt to show the user' },
          default: { type: 'string', description: 'Default value for the input' }
        },
        required: ['prompt']
      },
      handler: async (input: any) => {
        // This is handled by ExternalToolManager for UI interaction
        const userInput = prompt(input.prompt || 'Please provide input:', input.default || '');
        return { input: userInput };
      }
    },

    // Confirmation tool
    confirm: {
      name: 'confirm',
      description: 'Ask user for confirmation',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Confirmation message' },
          title: { type: 'string', description: 'Title for the confirmation dialog' }
        },
        required: ['message']
      },
      handler: async (input: any) => {
        const confirmed = confirm(input.message || 'Are you sure?');
        return { confirmed };
      }
    },

    // Notification tool
    notify: {
      name: 'notify',
      description: 'Show a notification to the user',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Notification title' },
          message: { type: 'string', description: 'Notification message' },
          type: { 
            type: 'string', 
            enum: ['success', 'error', 'warning', 'info'], 
            default: 'info',
            description: 'Type of notification' 
          }
        },
        required: ['message']
      },
      handler: async (input: any) => {
        // Use the browser's notification API if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(input.title || 'Notification', {
            body: input.message,
            icon: '/favicon.ico'
          });
        } else {
          // Fallback to alert
          alert(`${input.title ? input.title + ': ' : ''}${input.message}`);
        }
        return { success: true };
      }
    }
  };

  return tools;
};

/**
 * Helper function to create a custom tool with proper typing
 */
export const createTool = <T = any>(
  name: string,
  description: string,
  parameters: any,
  handler: (input: T) => Promise<any> | any
): DistriTool => {
  return {
    name,
    description,
    parameters,
    handler
  };
};

// Export individual builtin tools for convenience
export const builtinTools = createBuiltinTools();
export const approvalRequestTool = builtinTools[APPROVAL_REQUEST_TOOL_NAME];
export const toastTool = builtinTools.toast;
export const inputRequestTool = builtinTools.input_request;
export const confirmTool = builtinTools.confirm;
export const notifyTool = builtinTools.notify; 
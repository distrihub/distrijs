import { APPROVAL_REQUEST_TOOL_NAME, ToolCall } from '@distri/core';

/**
 * Standalone approval tool that manages its own UI
 */
export const createApprovalTool = () => {
  return {
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
    handler: async (input: { reason: string; tool_calls?: ToolCall[] }) => {
      return new Promise((resolve) => {
        // Create a simple modal dialog using native DOM
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, sans-serif;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
          background: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;

        const title = document.createElement('h2');
        title.textContent = 'Approval Required';
        title.style.cssText = `
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        `;

        const message = document.createElement('p');
        message.textContent = input.reason;
        message.style.cssText = `
          margin: 0 0 24px 0;
          color: #4b5563;
          line-height: 1.5;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        `;

        const approveButton = document.createElement('button');
        approveButton.textContent = 'Approve';
        approveButton.style.cssText = `
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        `;

        const denyButton = document.createElement('button');
        denyButton.textContent = 'Deny';
        denyButton.style.cssText = `
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        `;

        const cleanup = () => {
          document.body.removeChild(overlay);
        };

        const handleResponse = (approved: boolean) => {
          cleanup();
          resolve({
            approved,
            reason: approved ? 'Approved by user' : 'Denied by user',
            tool_calls: input.tool_calls || []
          });
        };

        approveButton.addEventListener('click', () => handleResponse(true));
        denyButton.addEventListener('click', () => handleResponse(false));
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) handleResponse(false);
        });

        buttonContainer.appendChild(denyButton);
        buttonContainer.appendChild(approveButton);
        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      });
    }
  };
};
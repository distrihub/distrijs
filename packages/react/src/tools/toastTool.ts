/**
 * Standalone toast tool that manages its own UI
 */
export const createToastTool = () => {
  return {
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
    handler: async (input: { message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => {
      return new Promise((resolve) => {
        // Create a simple toast using native DOM
        const toast = document.createElement('div');
        const type = input.type || 'info';
        
        const colors = {
          success: { bg: '#10b981', icon: '✓' },
          error: { bg: '#ef4444', icon: '✕' },
          warning: { bg: '#f59e0b', icon: '⚠' },
          info: { bg: '#3b82f6', icon: 'ℹ' }
        };

        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${colors[type].bg};
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          max-width: 300px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideIn 0.3s ease-out;
        `;

        // Add keyframe animation
        if (!document.querySelector('#toast-animations')) {
          const style = document.createElement('style');
          style.id = 'toast-animations';
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        const icon = document.createElement('span');
        icon.textContent = colors[type].icon;
        icon.style.fontWeight = 'bold';

        const message = document.createElement('span');
        message.textContent = input.message;

        const cleanup = () => {
          toast.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => {
            if (toast.parentNode) {
              document.body.removeChild(toast);
            }
          }, 300);
          resolve({
            success: true,
            message: 'Toast displayed successfully'
          });
        };

        toast.appendChild(icon);
        toast.appendChild(message);
        document.body.appendChild(toast);

        // Auto close after 3 seconds
        setTimeout(cleanup, 3000);

        // Allow click to close
        toast.addEventListener('click', cleanup);
      });
    }
  };
};
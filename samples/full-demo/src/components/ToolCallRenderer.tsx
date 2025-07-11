import React, { useState, useEffect } from 'react';

import { Wrench, Loader2, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';


export interface ToolCallState {
  tool_call_id: string;
  tool_name?: string;
  args: string;
  result?: string;
  running: boolean;
}

export const ToolCallRenderer: React.FC<{ toolCall: ToolCallState }> = ({ toolCall }) => {
  // Collapsible state: open while running, closed after completion unless user toggles
  const [open, setOpen] = useState(true);

  const { running, result } = toolCall;
  useEffect(() => {
    if (!!result) {
      setOpen(false);
    }
  }, [result]);

  return (
    <div>
      <div className="my-2 p-4 rounded-xl border border-blue-200 bg-blue-50/60 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="focus:outline-none"
            aria-label={open ? 'Collapse tool call details' : 'Expand tool call details'}
          >
            {open ? (
              <ChevronDown className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-blue-400" />
            )}
          </button>
          <Wrench className="text-blue-500 w-5 h-5" />
          <span className="font-semibold text-blue-700">
            {toolCall.tool_name ? toolCall.tool_name : <span className="italic text-gray-400">Tool (unknown)</span>}
          </span>
          {running && (
            <Loader2 className="ml-2 animate-spin text-blue-400 w-4 h-4" aria-label="Running..." />
          )}
          {!!result && (
            <CheckCircle className="ml-2 text-green-500 w-4 h-4" aria-label="Completed" />
          )}

        </div>
        <div>
          <span className="font-mono text-xs text-gray-700">Arguments:</span>
          <div className="bg-blue-100 border border-blue-200 rounded px-3 py-2 text-xs text-gray-800 whitespace-pre-wrap break-words break-all">
            {toolCall.args || <span className="italic text-gray-400">Waiting for arguments...</span>}
          </div>
        </div>
      </div>
      {open && (
        <div className="space-y-2">
          {toolCall.result && (
            <div>
              <span className="font-mono text-xs text-gray-700">Result:</span>
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-gray-800 whitespace-pre-wrap break-words break-all">
                {toolCall.result}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};


export default ToolCallRenderer;
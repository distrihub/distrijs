import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createSuccessfulToolResult } from '@distri/core';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent, SheetHeader, SheetTitle, Textarea, } from '@distri/react';
import { Maximize2, Play, X } from 'lucide-react';
const SUPPORTED_LANGUAGES = ['javascript', 'python', 'typescript', 'bash'];
const ScriptRunnerComponent = ({ toolCall, completeTool }) => {
    const initialInput = (toolCall.input ?? {});
    const [language, setLanguage] = useState(initialInput.language ?? 'javascript');
    const [code, setCode] = useState(initialInput.code ?? '');
    const [showFullScreen, setShowFullScreen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const runScript = async () => {
        setIsRunning(true);
        try {
            const payload = {
                tool: 'distri_execute_code',
                arguments: {
                    language,
                    code,
                    metadata: initialInput.metadata ?? {},
                },
            };
            const result = createSuccessfulToolResult(toolCall.tool_call_id, toolCall.tool_name, payload);
            completeTool(result);
        }
        finally {
            setIsRunning(false);
        }
    };
    const Editor = (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs(Select, { value: language, onValueChange: setLanguage, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, { placeholder: "Language" }) }), _jsx(SelectContent, { children: SUPPORTED_LANGUAGES.map((lang) => (_jsx(SelectItem, { value: lang, children: lang }, lang))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowFullScreen(true), "aria-label": "Expand editor", children: _jsx(Maximize2, { className: "h-4 w-4" }) }), _jsxs(Button, { size: "sm", className: "gap-2", onClick: runScript, disabled: !code.trim() || isRunning, children: [_jsx(Play, { className: "h-4 w-4" }), isRunning ? 'Running…' : 'Run'] })] })] }), _jsx(Textarea, { value: code, onChange: (event) => setCode(event.target.value), rows: 12, spellCheck: false, className: "font-mono text-sm", placeholder: `// Write ${language} code to execute` })] }));
    return (_jsxs("div", { className: "grid gap-4", children: [Editor, _jsx(Sheet, { open: showFullScreen, onOpenChange: setShowFullScreen, children: _jsxs(SheetContent, { side: "bottom", className: "h-[90vh] overflow-hidden", children: [_jsx(SheetHeader, { children: _jsxs(SheetTitle, { className: "flex items-center justify-between gap-2", children: [_jsx("span", { children: "Script runner" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowFullScreen(false), children: _jsx(X, { className: "h-4 w-4" }) })] }) }), _jsxs("div", { className: "mt-4 flex h-full flex-col gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Select, { value: language, onValueChange: (value) => setLanguage(value), children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Language" }) }), _jsx(SelectContent, { children: SUPPORTED_LANGUAGES.map((lang) => (_jsx(SelectItem, { value: lang, children: lang }, lang))) })] }), _jsxs(Button, { className: "gap-2", onClick: runScript, disabled: !code.trim() || isRunning, children: [_jsx(Play, { className: "h-4 w-4" }), isRunning ? 'Running…' : 'Run script'] })] }), _jsx(Textarea, { value: code, onChange: (event) => setCode(event.target.value), spellCheck: false, className: "flex-1 font-mono text-sm" })] })] }) })] }));
};
export const ScriptRunnerTool = {
    name: 'script_runner',
    type: 'ui',
    autoExecute: false,
    description: 'Run ad-hoc scripts via the distri_execute_code backend tool',
    parameters: {
        type: 'object',
        properties: {
            language: {
                type: 'string',
                enum: SUPPORTED_LANGUAGES,
                description: 'Programming language for the script',
            },
            code: {
                type: 'string',
                description: 'Source code to execute',
            },
            metadata: {
                type: 'object',
                description: 'Optional metadata forwarded to the execution tool',
            },
        },
    },
    component: (props) => _jsx(ScriptRunnerComponent, { ...props }),
};
export default ScriptRunnerTool;

import React, { useState } from 'react';
import { createSuccessfulToolResult } from '@distri/core';
import { DistriUiTool, UiToolProps } from '@distri/react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@distri/react';
import { Maximize2, Play, X } from 'lucide-react';

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'typescript', 'bash'];

type ScriptRunnerInput = {
  language?: string;
  code?: string;
  metadata?: Record<string, unknown>;
};

const ScriptRunnerComponent: React.FC<UiToolProps> = ({ toolCall, completeTool }) => {
  const initialInput = (toolCall.input ?? {}) as ScriptRunnerInput;
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
      const result = createSuccessfulToolResult(
        toolCall.tool_call_id,
        toolCall.tool_name,
        payload,
      );
      completeTool(result);
    } finally {
      setIsRunning(false);
    }
  };

  const Editor = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFullScreen(true)}
            aria-label="Expand editor"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={runScript}
            disabled={!code.trim() || isRunning}
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running…' : 'Run'}
          </Button>
        </div>
      </div>
      <Textarea
        value={code}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCode(event.target.value)}
        rows={12}
        spellCheck={false}
        className="font-mono text-sm"
        placeholder={`// Write ${language} code to execute`}
      />
    </div>
  );

  return (
    <div className="grid gap-4">
      {Editor}

      <Sheet open={showFullScreen} onOpenChange={setShowFullScreen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-hidden">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              <span>Script runner</span>
              <Button variant="ghost" size="icon" onClick={() => setShowFullScreen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex h-full flex-col gap-3">
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={(value: string) => setLanguage(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                onClick={runScript}
                disabled={!code.trim() || isRunning}
              >
                <Play className="h-4 w-4" />
                {isRunning ? 'Running…' : 'Run script'}
              </Button>
            </div>
            <Textarea
              value={code}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCode(event.target.value)}
              spellCheck={false}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const ScriptRunnerTool: DistriUiTool = {
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
  component: (props) => <ScriptRunnerComponent {...props} />,
};

export default ScriptRunnerTool;

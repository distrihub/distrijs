import { useContext, useMemo, useState } from 'react';
import { DistriClient } from '@distri/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DistriAnyTool } from '@/types';
import { DistriContext } from '@/DistriProvider';

interface SimulateModalProps {
  tool: DistriAnyTool;
  open: boolean;
  onClose: () => void;
  onSimulate: (input: Record<string, unknown>) => Promise<void>;
}

function buildDefaultInput(schema: Record<string, unknown> | undefined): string {
  if (!schema || !schema.properties) return '{}';
  const props = schema.properties as Record<string, { type?: string; description?: string; example?: unknown }>;
  const defaults: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(props)) {
    if (def.example !== undefined) {
      defaults[key] = def.example;
    } else if (def.type === 'string') {
      defaults[key] = '';
    } else if (def.type === 'number' || def.type === 'integer') {
      defaults[key] = 0;
    } else if (def.type === 'boolean') {
      defaults[key] = false;
    } else if (def.type === 'array') {
      defaults[key] = [];
    } else {
      defaults[key] = null;
    }
  }
  return JSON.stringify(defaults, null, 2);
}

function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace
    ? candidate.slice(firstBrace, lastBrace + 1)
    : candidate;

  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Generated payload is not a JSON object');
  }

  return parsed as Record<string, unknown>;
}

async function generatePayloadWithLlm(
  client: DistriClient,
  tool: DistriAnyTool,
  schema: Record<string, unknown> | undefined,
  comment: string
): Promise<Record<string, unknown>> {
  const instruction = [
    'You generate realistic JSON payloads for external tool simulation.',
    'Return only a JSON object.',
    'Do not include markdown fences.',
    'The payload must satisfy the provided JSON schema exactly.',
    'Prefer realistic, non-placeholder values.',
    'If examples are provided, imitate their style and shape.',
  ].join(' ');

  const toolContext = [
    `Tool name: ${tool.name}`,
    tool.description ? `Tool description: ${tool.description}` : null,
    `Tool schema: ${JSON.stringify(schema ?? {}, null, 2)}`,
    tool.examples ? `Tool examples: ${tool.examples}` : null,
    comment.trim() ? `User comment: ${comment.trim()}` : 'User comment: none',
  ].filter(Boolean).join('\n\n');

  const response = await client.llm([
    {
      id: `simulate-system-${Date.now()}`,
      role: 'system',
      created_at: Date.now(),
      parts: [{ part_type: 'text', data: instruction }],
    },
    {
      id: `simulate-user-${Date.now()}`,
      role: 'user',
      created_at: Date.now(),
      parts: [{ part_type: 'text', data: toolContext }],
    },
  ]);

  return extractJsonObject(response.content);
}

export function SimulateModal({ tool, open, onClose, onSimulate }: SimulateModalProps) {
  const schema = tool.parameters as Record<string, unknown> | undefined;
  const { client } = useContext(DistriContext);
  const [inputJson, setInputJson] = useState(() => buildDefaultInput(schema));
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canGenerate = Boolean(client);

  const schemaPreview = useMemo(() => {
    return schema ? JSON.stringify(schema, null, 2) : '{}';
  }, [schema]);

  const generatePayload = async (): Promise<Record<string, unknown>> => {
    if (!client) {
      throw new Error('Distri client not available for payload generation');
    }

    setError(null);
    setGenerating(true);
    try {
      const payload = await generatePayloadWithLlm(client, tool, schema, comment);
      setInputJson(JSON.stringify(payload, null, 2));
      return payload;
    } finally {
      setGenerating(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setError(null);
      setLoading(true);
      const parsed = await generatePayload();
      await onSimulate(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-mono">{tool.name}</DialogTitle>
          {tool.description && (
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Comment</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm min-h-[72px] resize-y"
              placeholder="Describe what kind of payload you want generated."
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Schema</p>
            <pre className="max-h-40 overflow-auto rounded border border-border bg-muted/20 p-2 text-[10px] text-muted-foreground">
              {schemaPreview}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Generated payload</p>
            <Textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="font-mono text-xs min-h-[160px] resize-y"
              placeholder="{}"
            />
          </div>

          <Textarea
            value={tool.examples ?? ''}
            readOnly
            className="hidden"
          />
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading || generating}>Cancel</Button>
          <Button variant="outline" onClick={() => void generatePayload()} disabled={!canGenerate || loading || generating}>
            {generating ? 'Generating…' : 'Generate payload'}
          </Button>
          <Button onClick={handleSimulate} disabled={!canGenerate || loading || generating}>
            {loading ? 'Simulating…' : 'Simulate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

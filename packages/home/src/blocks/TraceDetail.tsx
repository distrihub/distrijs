import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, X } from 'lucide-react';
import { Button } from '@distri/components';
import type { TraceSpan, TraceSpanAttribute } from './TraceTimeline';

// ---------------------------------------------------------------------------
// Category styling — mirrors cloud SpanDetailPanel
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<string, string> = {
  llm_call: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  tool_execution: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  agent_invocation: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  chain_operation: 'bg-green-500/20 text-green-300 border border-green-500/30',
  retrieval: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  plan: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  step: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  agent_handover: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  unknown: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  llm_call: 'LLM',
  tool_execution: 'Tool',
  agent_invocation: 'Agent',
  chain_operation: 'Chain',
  retrieval: 'Retrieval',
  plan: 'Plan',
  step: 'Step',
  agent_handover: 'Handover',
  unknown: 'Unknown',
};

type OtlpValue = {
  stringValue?: string;
  intValue?: string;
  doubleValue?: number;
  boolValue?: boolean;
};

function formatAttrValue(value: OtlpValue): string {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.intValue !== undefined) return String(value.intValue);
  if (value.doubleValue !== undefined) return String(value.doubleValue);
  if (value.boolValue !== undefined) return String(value.boolValue);
  return JSON.stringify(value);
}

function effectiveCategory(span: TraceSpan): string {
  if (span.type !== 'unknown') return span.type;
  const op = (span.attributes as Array<TraceSpanAttribute> | undefined)
    ?.find((a) => a.key === 'gen_ai.operation.name')?.value?.stringValue;
  if (op === 'plan') return 'plan';
  if (op === 'step') return 'step';
  if (op === 'agent_handover') return 'agent_handover';
  return 'unknown';
}

function tryParseJson(content: string): string | null {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return null;
  }
}

function prettyPrint(content: string): string {
  const parsed = tryParseJson(content);
  if (parsed !== null) return parsed;
  return content;
}

type Format = 'json' | 'plain';
type Tab = 'inout' | 'attributes' | 'raw';

function CollapsibleSection({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(true);
  const [format, setFormat] = useState<Format>('json');
  const [copied, setCopied] = useState(false);

  const displayed = format === 'json' ? prettyPrint(content) : content;

  function handleCopy() {
    navigator.clipboard.writeText(displayed).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {label}
        </button>
        <div className="flex items-center gap-0.5">
          {(['json', 'plain'] as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={[
                'px-1.5 py-0.5 text-[10px] rounded-sm transition-colors',
                format === f
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {f === 'json' ? 'JSON' : 'Plain'}
            </button>
          ))}
        </div>
      </div>
      {open && (
        <div className="relative group/block bg-muted/20 border border-border/40 rounded-md overflow-hidden">
          <pre className="p-3 text-xs font-mono overflow-auto max-h-72 whitespace-pre-wrap break-words text-foreground">
            {displayed}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 transition-opacity p-1 rounded bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
          {copied && (
            <span className="absolute top-2 right-8 text-[10px] text-green-400 bg-background/80 px-1 rounded">
              Copied!
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getAttr(span: TraceSpan, key: string): string | undefined {
  const attr = (span.attributes as Array<TraceSpanAttribute> | undefined)?.find(
    (a) => a.key === key,
  );
  if (!attr) return undefined;
  return formatAttrValue(attr.value) || undefined;
}

function InOutTab({ span }: { span: TraceSpan }) {
  const isToolSpan = effectiveCategory(span) === 'tool_execution';
  const input = isToolSpan ? getAttr(span, 'gen_ai.tool.call.arguments') : span.input;
  const output = isToolSpan ? getAttr(span, 'output.value') : span.output;

  if (!input && !output) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic p-4">
        No input/output recorded
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {input && <CollapsibleSection label="Input" content={input} />}
      {output && <CollapsibleSection label="Output" content={output} />}
    </div>
  );
}

const NOISY_ATTR_PREFIXES = ['code.', 'thread.'];
const NOISY_ATTR_EXACT = ['idle_ns', 'busy_ns', 'input.value', 'output.value'];
const TOOL_IO_ATTRS = ['gen_ai.tool.call.arguments', 'output.value'];

function isRichValue(s: string): boolean {
  if (s.length > 120) return true;
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function AttributesTab({ span }: { span: TraceSpan }) {
  const isToolSpan = effectiveCategory(span) === 'tool_execution';
  const attributes = ((span.attributes ?? []) as Array<TraceSpanAttribute>).filter(
    (attr) =>
      !NOISY_ATTR_PREFIXES.some((p) => attr.key.startsWith(p)) &&
      !NOISY_ATTR_EXACT.includes(attr.key) &&
      !(isToolSpan && TOOL_IO_ATTRS.includes(attr.key)),
  );

  const inputTokAttr = span.attributes?.find((a) => a.key === 'gen_ai.usage.input_tokens');
  const inputTokVal = inputTokAttr?.value;
  const inputTok =
    inputTokVal?.intValue != null
      ? parseInt(inputTokVal.intValue, 10)
      : inputTokVal?.stringValue != null
      ? parseInt(inputTokVal.stringValue, 10) || undefined
      : undefined;
  const hasCost = span.cost != null && span.cost > 0;

  return (
    <div className="flex flex-col gap-2 p-3">
      {(inputTok || hasCost) && (
        <div className="flex items-center gap-2 mb-1">
          {inputTok != null && (
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                Input tokens
              </p>
              <p className="text-xs font-mono font-medium text-foreground">
                {inputTok >= 1000 ? `${(inputTok / 1000).toFixed(1)}k` : String(inputTok)}
              </p>
            </div>
          )}
          {hasCost && (
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                Cost
              </p>
              <p className="text-xs font-mono font-medium text-foreground">
                ${span.cost!.toFixed(span.cost! < 0.001 ? 6 : 4)}
              </p>
            </div>
          )}
        </div>
      )}

      {attributes.length > 0 ? (
        attributes.map((attr, i) => {
          const raw = formatAttrValue(attr.value);
          if (attr.value.stringValue !== undefined && isRichValue(raw)) {
            return (
              <div key={i} className="rounded-md border border-border/60 bg-muted/10 px-3 py-2">
                <CollapsibleSection label={attr.key} content={raw} />
              </div>
            );
          }
          return (
            <div key={i} className="rounded-md border border-border/60 bg-muted/10 px-3 py-2">
              <p className="text-[10px] font-mono text-muted-foreground mb-0.5 break-all">
                {attr.key}
              </p>
              <p className="text-xs font-mono text-foreground break-words">{raw}</p>
            </div>
          );
        })
      ) : (
        <p className="text-xs text-muted-foreground italic">No attributes</p>
      )}
    </div>
  );
}

function RawTab({ span }: { span: TraceSpan }) {
  const displayed = prettyPrint(span.raw ?? JSON.stringify(span, null, 2));
  return (
    <div className="p-3 h-full">
      <div className="bg-muted/20 border border-border/40 rounded-md overflow-auto h-full">
        <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground">
          {displayed}
        </pre>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'inout', label: 'In/Out' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'raw', label: 'RAW' },
];

export interface TraceDetailProps {
  span: TraceSpan;
  onClose?: () => void;
  className?: string;
}

/**
 * TraceDetail — displays span attributes, In/Out, and raw data for a selected span.
 * Pure rendering block; receives a span object (e.g. from TraceTimeline.onSelectSpan).
 */
export function TraceDetail({ span, onClose, className }: TraceDetailProps) {
  const defaultTab: Tab = span.input || span.output ? 'inout' : 'attributes';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const cat = effectiveCategory(span);
  const categoryStyle = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.unknown;
  const categoryLabel = CATEGORY_LABELS[cat] ?? 'Unknown';

  return (
    <div className={`flex flex-col h-full bg-background ${className ?? ''}`}>
      {/* Panel header */}
      <div className="flex items-start justify-between px-3 py-2 border-b border-border shrink-0 gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground truncate">{span.title}</span>
            <span
              className={[
                'text-[10px] font-medium px-1.5 py-0.5 rounded-sm leading-none shrink-0',
                categoryStyle,
              ].join(' ')}
            >
              {categoryLabel}
            </span>
          </div>
          {((span.cost != null && span.cost > 0) || span.duration > 0) && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              {span.cost != null && span.cost > 0 && (
                <span>${span.cost.toFixed(span.cost < 0.001 ? 6 : 4)}</span>
              )}
              {span.duration > 0 && (
                <span className="uppercase tracking-wide">
                  LATENCY:{' '}
                  {span.duration < 1000
                    ? `${span.duration.toFixed(0)}ms`
                    : `${(span.duration / 1000).toFixed(2)}s`}
                </span>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border shrink-0 px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'inout' && <InOutTab span={span} />}
        {activeTab === 'attributes' && <AttributesTab span={span} />}
        {activeTab === 'raw' && <RawTab span={span} />}
      </div>
    </div>
  );
}

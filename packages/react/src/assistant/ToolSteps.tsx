import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ToolStepsSlotProps, UserMessageSlotProps } from '../types'
import { useAssistantRuntime } from './context'
import { describeArguments, stepText, summarizeResult, humanizeToolName, type StepStatus } from './humanize'

type CallState = ToolStepsSlotProps['toolCallStates'] extends Map<string, infer S> ? S : never

function statusOf(state: CallState | undefined): StepStatus {
  if (state?.status === 'error') return 'error'
  if (state?.status === 'completed') return 'done'
  return 'running'
}

function resultPreview(result: unknown): string | undefined {
  const parts = (result as { parts?: Array<{ part_type?: string; data?: unknown }> } | undefined)?.parts
  const data = parts?.find((p) => p?.part_type === 'data')?.data
  if (data == null) return undefined
  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return json.length > 700 ? `${json.slice(0, 700)}…` : json
}

const StepRow: React.FC<{
  name: string
  input: unknown
  state: CallState | undefined
  detailed: boolean
  overrides?: { running?: string; done?: string }
}> = ({ name, input, state, detailed, overrides }) => {
  const [open, setOpen] = useState(false)
  const status = statusOf(state)
  const label = status === 'error' ? `${humanizeToolName(name)} didn't finish` : stepText(name, status, overrides)
  const meta = status === 'done' ? summarizeResult(state?.result) : undefined
  const args = detailed ? describeArguments(input) : []
  const preview = detailed && status !== 'running' ? resultPreview(state?.result) : undefined
  const expandable = detailed && (args.length > 0 || Boolean(preview))

  const content = (
    <>
      <span className="dui-dot" aria-hidden="true" />
      <span className="dui-step-text">{label}</span>
      {meta ? <span className="dui-step-meta">{meta}</span> : null}
      {expandable ? <ChevronRight className="dui-step-chevron" aria-hidden="true" /> : null}
    </>
  )

  return (
    <li className="dui-step" data-status={status} data-open={open || undefined}>
      {expandable ? (
        <button type="button" className="dui-step-row" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {content}
        </button>
      ) : (
        <div className="dui-step-row">{content}</div>
      )}
      {expandable && open ? (
        <div className="dui-step-detail">
          {args.length > 0 ? (
            <dl>
              {args.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {preview ? <pre>{preview}</pre> : null}
        </div>
      ) : null}
    </li>
  )
}

/** Quiet, single-line, plain-language tool activity. Replaces Distri's default tool rows. */
export const ToolSteps: React.FC<ToolStepsSlotProps> = ({ toolCalls, toolCallStates, children }) => {
  const { toolActivity, toolLabels } = useAssistantRuntime()
  if (toolActivity === 'hidden') return null
  const needsUser = toolCalls.some((c) => toolCallStates.get(c.tool_call_id)?.status === 'user_action_required')
  return (
    <div className="dui-steps-wrap">
      <ul className="dui-steps">
        {toolCalls.map((call) => (
          <StepRow
            key={call.tool_call_id}
            name={call.tool_name}
            input={call.input}
            state={toolCallStates.get(call.tool_call_id)}
            detailed={toolActivity === 'detailed'}
            overrides={toolLabels[call.tool_name]}
          />
        ))}
      </ul>
      {needsUser ? <div className="dui-step-action">{children}</div> : null}
    </div>
  )
}

/** The user's turn: an accent-tinted pill, plain text. */
export const UserTurn: React.FC<UserMessageSlotProps> = ({ message }) => {
  const text = message.parts
    .filter((p) => p.part_type === 'text')
    .map((p) => (p as { data: string }).data)
    .join('\n')
    .trim()
  if (!text) return null
  return (
    <div className="dui-user">
      <div className="dui-user-pill">{text}</div>
    </div>
  )
}

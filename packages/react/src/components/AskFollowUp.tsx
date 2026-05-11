/**
 * AskFollowUp - Interactive stepper component for agent follow-up questions
 *
 * This tool allows agents to ask a series of questions to the user.
 * Questions are rendered as a stepper, one at a time.
 * User answers are collected and sent back to the agent.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DistriUiTool, UiToolProps } from '../types';
import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  placeholder?: string;
  required?: boolean;
  default?: string | string[] | boolean;
}

export interface AskFollowUpInput {
  title?: string;
  description?: string;
  questions: FollowUpQuestion[];
}

export interface AskFollowUpOutput {
  answers: Record<string, string | string[] | boolean>;
  completed: boolean;
}

// ============================================================================
// Tool Definition
// ============================================================================

export const ASK_FOLLOW_UP_TOOL_NAME = 'ask_follow_up';

export function createAskFollowUpTool(): DistriUiTool {
  return {
    type: 'ui',
    name: ASK_FOLLOW_UP_TOOL_NAME,
    description: 'Ask the user a series of follow-up questions to gather more information. Questions are shown one at a time in a stepper format.',
    isExternal: false,
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Optional title for the question series',
        },
        description: {
          type: 'string',
          description: 'Optional description explaining why these questions are being asked',
        },
        questions: {
          type: 'array',
          description: 'Array of questions to ask',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique identifier for the question (used as key in answers)',
              },
              question: {
                type: 'string',
                description: 'The question text to display',
              },
              type: {
                type: 'string',
                enum: ['text', 'select', 'multiselect', 'boolean'],
                description: 'Type of input: text for free-form, select for single choice, multiselect for multiple choices, boolean for yes/no',
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: 'Options for select/multiselect types',
              },
              placeholder: {
                type: 'string',
                description: 'Placeholder text for text inputs',
              },
              required: {
                type: 'boolean',
                description: 'Whether this question must be answered',
              },
              default: {
                description: 'Default value for the question',
              },
            },
            required: ['id', 'question', 'type'],
          },
        },
      },
      required: ['questions'],
    },
    component: AskFollowUpComponent,
  };
}

// ============================================================================
// Component
// ============================================================================

function AskFollowUpComponent({
  toolCall,
  toolCallState,
  completeTool,
}: UiToolProps): React.ReactNode {
  const input = toolCall.input as AskFollowUpInput;
  const questions = useMemo(() => input?.questions || [], [input?.questions]);
  const hasQuestions = questions.length > 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>(() => {
    // Initialize with defaults
    const defaults: Record<string, string | string[] | boolean> = {};
    questions.forEach((q) => {
      if (q.default !== undefined) {
        defaults[q.id] = q.default;
      } else if (q.type === 'multiselect') {
        defaults[q.id] = [];
      } else if (q.type === 'boolean') {
        defaults[q.id] = false;
      } else {
        defaults[q.id] = '';
      }
    });
    return defaults;
  });
  // Per-question "user has interacted" flag, separate from value.
  // Needed because boolean `false` is a real answer (Yes/No) and
  // an empty string can be a real answer for `text`. The previous
  // `!answers[id]` check conflated value-falsy with not-yet-answered
  // and made it impossible to submit "No".
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  // "Other / type your own" escape hatch for select / multiselect:
  // `otherOpen[id]` controls visibility of the free-form input;
  // `otherText[id]` is what the user has typed there.
  const [otherOpen, setOtherOpen] = useState<Record<string, boolean>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  const currentQuestion = hasQuestions ? questions[currentStep] : null;
  const isLastStep = currentStep === questions.length - 1;
  const isCompleted = toolCallState?.status === 'completed';

  const isAnswered = useCallback(
    (q: FollowUpQuestion): boolean => {
      // A pre-populated `default` counts as answered — the user can
      // accept the LLM's suggestion by pressing Next without
      // interacting.
      if (q.default !== undefined && !touched.has(q.id)) return true;
      switch (q.type) {
        case 'boolean':
          // Touch is the signal — value of `false` is a real answer.
          return touched.has(q.id);
        case 'select':
          // Need a touch AND a non-empty value: opening the "Other"
          // input touches the question but leaves the string empty
          // until the user types, and we don't want Next to enable
          // while the typed answer is blank.
          return (
            touched.has(q.id) &&
            ((answers[q.id] as string) ?? '').trim().length > 0
          );
        case 'multiselect':
          return ((answers[q.id] as string[]) ?? []).length > 0;
        case 'text':
        default:
          return ((answers[q.id] as string) ?? '').trim().length > 0;
      }
    },
    [answers, touched],
  );

  // Handle empty questions case - complete immediately
  useEffect(() => {
    if (!hasQuestions && !isCompleted) {
      const output: AskFollowUpOutput = { answers: {}, completed: true };
      completeTool({
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        parts: [{
          part_type: 'data',
          data: output,
        }],
      });
    }
  }, [hasQuestions, isCompleted, completeTool, toolCall.tool_call_id, toolCall.tool_name]);

  const handleAnswer = useCallback((value: string | string[] | boolean) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
    setTouched((prev) => {
      if (prev.has(currentQuestion.id)) return prev;
      const next = new Set(prev);
      next.add(currentQuestion.id);
      return next;
    });
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    if (currentQuestion.required && !isAnswered(currentQuestion)) {
      return; // Don't proceed if required and empty
    }

    if (isLastStep) {
      // Submit all answers
      const output: AskFollowUpOutput = {
        answers,
        completed: true,
      };
      completeTool({
        tool_call_id: toolCall.tool_call_id,
        tool_name: toolCall.tool_name,
        parts: [{
          part_type: 'data',
          data: output,
        }],
      });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentQuestion, answers, isAnswered, isLastStep, completeTool, toolCall]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  }, [handleNext]);

  // No questions - show nothing while effect completes
  if (!hasQuestions) {
    return null;
  }

  // Show completed state
  if (isCompleted) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckIcon className="w-4 h-4 text-green-500" />
          <span>Follow-up questions answered</span>
        </div>
        <div className="mt-2 space-y-1">
          {questions.map((q) => (
            <div key={q.id} className="text-xs">
              <span className="text-muted-foreground">{q.question}</span>
              <span className="ml-2 font-medium">
                {Array.isArray(answers[q.id])
                  ? (answers[q.id] as string[]).join(', ')
                  : String(answers[q.id])}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Safety check - should not happen if hasQuestions is true
  if (!currentQuestion) {
    return null;
  }

  return (
    // `onKeyDown` lives on the card root so Enter submits regardless
    // of which question type has focus (boolean / select chips don't
    // capture the global keystroke otherwise).
    <div
      className="border rounded-lg overflow-hidden bg-background shadow-sm"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      {(input.title || input.description) && (
        <div className="px-4 py-3 border-b bg-muted/30">
          {input.title && (
            <h3 className="font-medium text-sm">{input.title}</h3>
          )}
          {input.description && (
            <p className="text-xs text-muted-foreground mt-1">{input.description}</p>
          )}
        </div>
      )}

      {/* Progress indicator */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                idx < currentStep
                  ? 'bg-primary'
                  : idx === currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Question {currentStep + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="p-4">
        <label className="block text-sm font-medium mb-3">
          {currentQuestion.question}
          {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
        </label>

        {/* Input based on type. The text input no longer attaches its
           own onKeyDown — the card-root handler at line 287 picks up
           Enter and bubbling means a child handler would fire it twice. */}
        {currentQuestion.type === 'text' && (
          <input
            type="text"
            value={answers[currentQuestion.id] as string || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder || 'Type your answer...'}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        )}

        {currentQuestion.type === 'select' && currentQuestion.options && (() => {
          const qid = currentQuestion.id;
          const isOtherOpen = !!otherOpen[qid];
          // For `select`, the typed text *replaces* any chip pick — we
          // can detect "Other is the active answer" by the chip-match
          // failing while the typed text matches the current answer.
          const currentAnswer = answers[qid];
          return (
            <div className="space-y-2">
              {currentQuestion.options!.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    // Picking a real chip retires the Other escape
                    // hatch — mutually exclusive for `select`.
                    if (isOtherOpen) {
                      setOtherOpen((p) => ({ ...p, [qid]: false }));
                      setOtherText((p) => ({ ...p, [qid]: '' }));
                    }
                    handleAnswer(option);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left border rounded-md transition-colors',
                    !isOtherOpen && currentAnswer === option
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  )}
                >
                  {option}
                </button>
              ))}
              {isOtherOpen ? (
                <input
                  type="text"
                  value={otherText[qid] ?? ''}
                  autoFocus
                  onChange={(e) => {
                    setOtherText((p) => ({ ...p, [qid]: e.target.value }));
                    handleAnswer(e.target.value);
                  }}
                  placeholder="Type your answer…"
                  className="w-full px-3 py-2 text-sm border border-primary rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <button
                  onClick={() => {
                    setOtherOpen((p) => ({ ...p, [qid]: true }));
                    // Open with an empty draft and clear any
                    // previously-clicked chip so the user starts fresh.
                    setOtherText((p) => ({ ...p, [qid]: '' }));
                    handleAnswer('');
                    // `handleAnswer('')` marks the question touched
                    // but the empty value won't satisfy `isAnswered`
                    // — exactly what we want until the user types.
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-1"
                >
                  Or type your own answer
                </button>
              )}
            </div>
          );
        })()}

        {currentQuestion.type === 'multiselect' && currentQuestion.options && (() => {
          const qid = currentQuestion.id;
          const selectedArr = (answers[qid] as string[]) || [];
          const isOtherOpen = !!otherOpen[qid];
          const draft = otherText[qid] ?? '';
          const addOther = () => {
            const trimmed = draft.trim();
            if (!trimmed || selectedArr.includes(trimmed)) {
              setOtherText((p) => ({ ...p, [qid]: '' }));
              return;
            }
            handleAnswer([...selectedArr, trimmed]);
            setOtherText((p) => ({ ...p, [qid]: '' }));
          };
          return (
            <div className="space-y-2">
              {currentQuestion.options!.map((option) => {
                const selected = selectedArr.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      const newValue = selected
                        ? selectedArr.filter((v) => v !== option)
                        : [...selectedArr, option];
                      handleAnswer(newValue);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left border rounded-md transition-colors flex items-center gap-2',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 border rounded flex items-center justify-center',
                      selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    )}>
                      {selected && <CheckIcon className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    {option}
                  </button>
                );
              })}
              {/* "Other" — typed values are *appended* to the array;
                 multiselect lets pre-baked picks coexist with custom
                 ones, so we don't close the chip set when this opens. */}
              {isOtherOpen ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft}
                    autoFocus
                    onChange={(e) => setOtherText((p) => ({ ...p, [qid]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Stop the root-card handler from also firing
                        // `handleNext` — Enter inside the Other input
                        // means "append this draft to the array", not
                        // "submit the form".
                        e.stopPropagation();
                        addOther();
                      }
                    }}
                    placeholder="Type your own…"
                    className="flex-1 px-3 py-2 text-sm border border-primary rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={addOther}
                    disabled={!draft.trim()}
                    className={cn(
                      'px-3 py-1 text-sm rounded-md',
                      draft.trim()
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed',
                    )}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOtherOpen((p) => ({ ...p, [qid]: true }))}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-1"
                >
                  Or type your own…
                </button>
              )}
            </div>
          );
        })()}

        {currentQuestion.type === 'boolean' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className={cn(
                'flex-1 px-4 py-2 text-sm border rounded-md transition-colors',
                answers[currentQuestion.id] === true
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-muted'
              )}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className={cn(
                'flex-1 px-4 py-2 text-sm border rounded-md transition-colors',
                answers[currentQuestion.id] === false
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-muted'
              )}
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            currentStep === 0
              ? 'text-muted-foreground cursor-not-allowed'
              : 'hover:bg-muted'
          )}
        >
          Back
        </button>
        {(() => {
          const blocked = currentQuestion.required && !isAnswered(currentQuestion);
          return (
            <button
              onClick={handleNext}
              disabled={blocked}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md transition-colors',
                blocked
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isLastStep ? 'Submit' : 'Next'}
            </button>
          );
        })()}
      </div>
    </div>
  );
}

// Simple check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

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

  const currentQuestion = hasQuestions ? questions[currentStep] : null;
  const isLastStep = currentStep === questions.length - 1;
  const isCompleted = toolCallState?.status === 'completed';

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
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    if (currentQuestion.required && !answers[currentQuestion.id]) {
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
  }, [currentQuestion, answers, isLastStep, completeTool, toolCall]);

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
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
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

        {/* Input based on type */}
        {currentQuestion.type === 'text' && (
          <input
            type="text"
            value={answers[currentQuestion.id] as string || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentQuestion.placeholder || 'Type your answer...'}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        )}

        {currentQuestion.type === 'select' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left border rounded-md transition-colors',
                  answers[currentQuestion.id] === option
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-muted'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'multiselect' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => {
              const selected = (answers[currentQuestion.id] as string[] || []).includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const current = answers[currentQuestion.id] as string[] || [];
                    const newValue = selected
                      ? current.filter((v) => v !== option)
                      : [...current, option];
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
          </div>
        )}

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
        <button
          onClick={handleNext}
          disabled={currentQuestion.required && !answers[currentQuestion.id]}
          className={cn(
            'px-4 py-1.5 text-sm rounded-md transition-colors',
            currentQuestion.required && !answers[currentQuestion.id]
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {isLastStep ? 'Submit' : 'Next'}
        </button>
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

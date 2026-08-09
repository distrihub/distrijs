/**
 * The client-side toolbelt.
 *
 * Everything the agent can *do* in this app is one of these six functions.
 * There is no backend: a tool handler is an ordinary async TypeScript function
 * running in the browser tab, so it can touch React state, block on a click,
 * or call any API the user is already logged into.
 *
 * Four rules that make agent tools behave:
 *
 * 1. **The description is the prompt.** The model picks tools by reading
 *    `description` and `parameters`. Vague description, wrong tool call.
 * 2. **Validate, and return the error as a string.** A returned error is fed
 *    back to the model as the tool result, so it retries with a fix. Throwing
 *    just kills the turn.
 * 3. **Return what the model needs next** (ids, remaining count), not `"ok"`.
 * 4. **Keep handlers boring.** A handler that moves state is testable; a
 *    handler that also renders is not.
 */

import type { DistriFnTool } from '@distri/core';
import { planStore, type QuestionKind } from './planStore';
import { addToScheme, findUnit, listScheme, unitIds } from './scheme';

const QUESTION_KINDS: QuestionKind[] = ['multiple_choice', 'short_answer', 'open_response'];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export const lessonPlannerTools: DistriFnTool[] = [
  {
    name: 'list_scheme',
    description:
      'List the department’s units and the lessons already planned in each one. Call this FIRST so the new plan fits the sequence and does not repeat a lesson that already exists.',
    type: 'function',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const scheme = listScheme();
      planStore.log('list_scheme', `${scheme.length} units`);
      return JSON.stringify(scheme, null, 2);
    },
  },

  {
    name: 'propose_outline',
    description:
      'Propose the shape of the lesson — objective, timings, and the beats it runs through — and WAIT for the teacher to approve it. Always call this before writing any segment. Returns approved:true, or approved:false with the change the teacher asked for, in which case call propose_outline again with a revised outline.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Lesson title, as it would appear in the scheme of work' },
        objective: {
          type: 'string',
          description: 'One sentence: what a student can do at the end that they could not do at the start',
        },
        unit_id: { type: 'string', description: 'Unit this lesson belongs to (from list_scheme)' },
        year: { type: 'string', description: 'Year/grade group, e.g. "Year 7"' },
        minutes: { type: 'number', description: 'Total lesson length in minutes' },
        beats: {
          type: 'array',
          description: 'The lesson in order — typically starter, teach, practice, plenary. 3-6 beats.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Beat name, e.g. "Starter — equivalent fractions"' },
              minutes: { type: 'number', description: 'Minutes allocated to this beat' },
              intent: { type: 'string', description: 'What this beat does for the student' },
            },
            required: ['name', 'minutes', 'intent'],
          },
        },
        question_count: { type: 'number', description: 'How many practice questions the plan will carry' },
      },
      required: ['title', 'objective', 'unit_id', 'year', 'minutes', 'beats', 'question_count'],
    },
    handler: async (input: {
      title: string;
      objective: string;
      unit_id: string;
      year: string;
      minutes: number;
      beats?: { name: string; minutes: number; intent: string }[];
      question_count: number;
    }) => {
      if (!findUnit(input.unit_id)) {
        planStore.log('propose_outline', `unknown unit "${input.unit_id}"`, false);
        return `Error: unknown unit_id "${input.unit_id}". Valid unit ids: ${unitIds().join(', ')}. Call list_scheme first.`;
      }
      const beats = input.beats ?? [];
      if (beats.length < 3) {
        planStore.log('propose_outline', 'outline too thin', false);
        return 'Error: an outline needs at least 3 beats. Return a fuller shape for the lesson.';
      }

      // Timings that do not add up are the single most common thing a teacher
      // sends back, so the tool catches it before a human has to.
      const allocated = beats.reduce((sum, beat) => sum + (beat.minutes || 0), 0);
      if (allocated !== input.minutes) {
        planStore.log('propose_outline', `timings ${allocated}≠${input.minutes} min`, false);
        return `Error: the beats add up to ${allocated} minutes but the lesson is ${input.minutes} minutes. Adjust the beats so they total exactly ${input.minutes}.`;
      }

      planStore.log('propose_outline', `${beats.length} beats · awaiting approval`);
      const decision = await planStore.proposeOutline({
        title: input.title,
        objective: input.objective,
        unitId: input.unit_id,
        year: input.year,
        minutes: input.minutes,
        beats,
        questionCount: input.question_count,
      });

      if (!decision.approved) {
        planStore.log('propose_outline', 'changes requested', false);
        return `The teacher did not approve the outline. They said: "${decision.note}". Revise it against that note and call propose_outline again.`;
      }

      planStore.log('propose_outline', 'approved');
      return `Outline approved. Write the ${beats.length} segments in order with write_segment, then add ${input.question_count} questions with add_question.`;
    },
  },

  {
    name: 'write_segment',
    description:
      'Write one segment of the approved plan onto the canvas. Call once per beat, in order. Body is markdown written FOR THE TEACHER — what to do, what to say, what to watch for. Use ## headings, **bold**, - bullets, and > for a worked example or a board prompt.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Segment name, matching the beat in the outline' },
        minutes: { type: 'number', description: 'Minutes for this segment, matching the outline' },
        markdown: { type: 'string', description: 'Teacher-facing notes, 80-200 words of markdown' },
      },
      required: ['name', 'minutes', 'markdown'],
    },
    handler: async ({ name, minutes, markdown }: { name: string; minutes: number; markdown: string }) => {
      if (planStore.getSnapshot().status === 'empty') {
        return 'Error: no approved outline yet. Call propose_outline and get approval first.';
      }
      await planStore.writeSegment(name, minutes, markdown);
      const n = planStore.getSnapshot().segments.length;
      planStore.log('write_segment', `${name} · ${minutes} min`);
      return `Segment ${n} ("${name}") written.`;
    },
  },

  {
    name: 'add_question',
    description:
      'Add a practice question to the plan. multiple_choice needs options plus an answer that is one of them; short_answer needs an answer; open_response needs a rubric of 2-4 criteria instead of an answer.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: QUESTION_KINDS,
          description: 'multiple_choice | short_answer | open_response',
        },
        prompt: { type: 'string', description: 'The question as the student reads it' },
        options: { type: 'array', items: { type: 'string' }, description: 'multiple_choice only: 3-4 options' },
        answer: { type: 'string', description: 'The answer key. Omit for open_response.' },
        hint: { type: 'string', description: 'A nudge for a student who is stuck' },
        feedback: { type: 'string', description: 'The explanation shown once the question is answered' },
        rubric: {
          type: 'array',
          items: { type: 'string' },
          description: 'open_response only: 2-4 criteria the answer is marked against',
        },
      },
      required: ['kind', 'prompt'],
    },
    handler: async (q: {
      kind: QuestionKind;
      prompt: string;
      options?: string[];
      answer?: string;
      hint?: string;
      feedback?: string;
      rubric?: string[];
    }) => {
      // The same validation a real question editor runs. Returning the failure
      // as a string is what lets the model fix its own malformed question.
      const fail = (msg: string) => {
        planStore.log('add_question', msg, false);
        return `Error: ${msg}`;
      };

      if (!QUESTION_KINDS.includes(q.kind)) {
        return fail(`unknown kind "${q.kind}". Use one of ${QUESTION_KINDS.join(', ')}.`);
      }
      if (!q.prompt?.trim()) return fail('prompt is required.');

      if (q.kind === 'multiple_choice') {
        if (!q.options || q.options.length < 3) return fail('multiple_choice needs at least 3 options.');
        if (!q.answer) return fail('multiple_choice needs an answer.');
        if (!q.options.includes(q.answer)) {
          return fail(`answer "${q.answer}" is not one of the options [${q.options.join(' | ')}].`);
        }
      }
      if (q.kind === 'short_answer' && !q.answer) return fail('short_answer needs an answer.');
      if (q.kind === 'open_response') {
        if (!q.rubric || q.rubric.length < 2) return fail('open_response needs a rubric of 2-4 criteria.');
      }

      planStore.addQuestion(q);
      const { questions, outline } = planStore.getSnapshot();
      const target = outline?.questionCount ?? questions.length;
      planStore.log('add_question', `${q.kind} · ${questions.length}/${target}`);
      return `Question ${questions.length} added. ${Math.max(0, target - questions.length)} still to write.`;
    },
  },

  {
    name: 'finish_plan',
    description:
      'Mark the plan complete once every segment and question is written. Tell the teacher what you made and what is worth checking before they teach it.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One or two sentences on what you planned' },
      },
      required: ['summary'],
    },
    handler: async ({ summary }: { summary: string }) => {
      const { segments, questions, outline } = planStore.getSnapshot();
      if (!segments.length) return 'Error: nothing has been written yet.';
      if (outline && questions.length < outline.questionCount) {
        return `Error: the outline promised ${outline.questionCount} questions and only ${questions.length} exist. Add the rest first.`;
      }
      planStore.markReady();
      planStore.log('finish_plan', summary.slice(0, 60));
      return `Plan ready: ${segments.length} segments, ${questions.length} questions. Offer to add it to the scheme of work.`;
    },
  },

  {
    name: 'add_to_scheme',
    description:
      'Add the finished plan to the department’s scheme of work. Only call this after the teacher asks you to.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        unit_id: { type: 'string', description: 'Unit to file it under. Defaults to the unit from the outline.' },
      },
    },
    handler: async ({ unit_id }: { unit_id?: string }) => {
      const { status, outline } = planStore.getSnapshot();
      if (status !== 'ready') return 'Error: call finish_plan before adding it to the scheme.';
      if (!outline) return 'Error: there is no plan to add.';

      const targetId = unit_id ?? outline.unitId;
      const unit = findUnit(targetId);
      if (!unit) return `Error: unknown unit_id "${targetId}". Valid ids: ${unitIds().join(', ')}.`;

      addToScheme({
        id: `p-${slug(outline.title)}`,
        unitId: unit.id,
        title: outline.title,
        objective: outline.objective,
        minutes: outline.minutes,
      });
      planStore.markScheduled(unit.title);
      planStore.log('add_to_scheme', unit.title);
      return `Added "${outline.title}" to ${unit.title}.`;
    },
  },
];

/** Convenience for the mocked run and for tests. */
export function toolByName(name: string): DistriFnTool {
  const tool = lessonPlannerTools.find((t) => t.name === name);
  if (!tool) throw new Error(`no such tool: ${name}`);
  return tool;
}

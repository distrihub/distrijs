import { useState } from 'react';
import { planStore, type PlanState, type Question } from '../planStore';
import { findUnit } from '../scheme';
import { Markdown } from './Markdown';

const KIND_LABEL: Record<Question['kind'], string> = {
  multiple_choice: 'Multiple choice',
  short_answer: 'Short answer',
  open_response: 'Open response',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** The approval gate. Rendered whenever a `propose_outline` tool call is parked. */
function OutlineGate({ plan }: { plan: PlanState }) {
  const [note, setNote] = useState('');
  const outline = plan.outline!;
  const unit = findUnit(outline.unitId);

  return (
    <div className="plan-card">
      <div className="plan-card__flag">Check the shape before it writes</div>
      <h2>{outline.title}</h2>
      <p className="plan-card__gist">{outline.objective}</p>
      <div className="plan-card__meta">
        <span>{outline.year}</span>
        <span>{unit?.title ?? outline.unitId}</span>
        <span>{outline.minutes} minutes</span>
        <span>{outline.questionCount} questions</span>
      </div>

      <ol className="plan-card__beats">
        {outline.beats.map((beat, i) => (
          <li key={i}>
            <strong>
              {beat.name}
              <span className="plan-card__mins">{beat.minutes}′</span>
            </strong>
            <span>{beat.intent}</span>
          </li>
        ))}
      </ol>

      {plan.awaitingApproval ? (
        <div className="plan-card__actions">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Or say what should change…"
            aria-label="Requested change"
          />
          <button
            className="btn btn--ghost"
            disabled={!note.trim()}
            onClick={() => {
              planStore.resolveApproval({ approved: false, note: note.trim() });
              setNote('');
            }}
          >
            Request changes
          </button>
          <button className="btn btn--primary" onClick={() => planStore.resolveApproval({ approved: true })}>
            Approve &amp; write
          </button>
        </div>
      ) : (
        <div className="plan-card__approved">Approved</div>
      )}
    </div>
  );
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  return (
    <div className="question">
      <div className="question__head">
        <span className="question__num">Q{index + 1}</span>
        <span className="question__kind">{KIND_LABEL[question.kind]}</span>
      </div>
      <p className="question__prompt">{question.prompt}</p>

      {question.options && (
        <ul className="question__options">
          {question.options.map((option, i) => (
            <li key={i} className={option === question.answer ? 'is-answer' : undefined}>
              <span className="question__letter">{LETTERS[i]}</span>
              {option}
            </li>
          ))}
        </ul>
      )}

      {question.rubric && (
        <ul className="question__rubric">
          {question.rubric.map((criterion, i) => (
            <li key={i}>{criterion}</li>
          ))}
        </ul>
      )}

      <div className="question__keys">
        {question.answer && !question.options && (
          <div>
            <span>Answer key</span>
            {question.answer}
          </div>
        )}
        {question.hint && (
          <div>
            <span>Hint</span>
            {question.hint}
          </div>
        )}
        {question.feedback && (
          <div>
            <span>Feedback</span>
            {question.feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlanCanvas({
  plan,
  onRunMock,
  mockRunning,
}: {
  plan: PlanState;
  onRunMock: () => void;
  mockRunning: boolean;
}) {
  if (plan.status === 'empty' && !plan.outline) {
    return (
      <div className="paper paper--empty">
        <div className="empty">
          <h1>Lesson Planner</h1>
          <p>
            Ask the assistant on the right for a lesson — it reads your scheme of work, proposes an outline with
            timings for you to approve, then writes the plan onto this page segment by segment.
          </p>
          <p className="empty__try">
            Try: <em>“A 50-minute Year 7 lesson on adding fractions with unlike denominators.”</em>
          </p>
          <button className="btn btn--primary" onClick={onRunMock} disabled={mockRunning}>
            {mockRunning ? 'Running…' : 'Run the mocked planning'}
          </button>
          <p className="empty__hint">
            The mocked run drives the same six tools from a script, so it works with no API key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="paper">
      {plan.outline && <OutlineGate plan={plan} />}

      {plan.segments.length > 0 && (
        <article className="lesson">
          <h1>{plan.outline?.title}</h1>
          {plan.outline && <p className="lesson__objective">{plan.outline.objective}</p>}
          {plan.segments.map((segment) => (
            <section key={segment.id}>
              <h2>
                {segment.name}
                <span className="lesson__mins">{segment.minutes}′</span>
              </h2>
              <Markdown source={segment.markdown} />
            </section>
          ))}
        </article>
      )}

      {plan.questions.length > 0 && (
        <section className="questions">
          <h2 className="questions__title">Practice set</h2>
          {plan.questions.map((question, i) => (
            <QuestionCard key={question.id} question={question} index={i} />
          ))}
        </section>
      )}

      {plan.status === 'scheduled' && (
        <div className="published">Added to <strong>{plan.scheduledIn}</strong></div>
      )}
    </div>
  );
}

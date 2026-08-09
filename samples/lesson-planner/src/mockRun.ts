/**
 * A mocked planning run — the same six tools, driven by a script instead of by
 * a model.
 *
 * Why it exists: you can open this sample with no API key and still watch the
 * whole flow, and it proves the point that the tools ARE the contract. Whatever
 * calls them — a model, a script, a test — the app behaves identically. This is
 * also how you write a deterministic test for an agentic UI.
 */

import { toolByName } from './tools';

const call = (name: string, input: Record<string, unknown> = {}) =>
  toolByName(name).handler(input) as Promise<string>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const OUTLINE = {
  title: 'Adding fractions with unlike denominators',
  objective:
    'Add two fractions with different denominators by rewriting them over a common denominator.',
  unit_id: 'u-fractions',
  year: 'Year 7',
  minutes: 50,
  question_count: 3,
  beats: [
    { name: 'Starter — equivalent fractions', minutes: 5, intent: 'Retrieve the skill the whole method rests on' },
    { name: 'Teach — why the denominators cannot be added', minutes: 12, intent: 'Attack the misconception before teaching the method' },
    { name: 'Worked example — lowest common denominator', minutes: 12, intent: 'Model the three steps out loud, twice' },
    { name: 'Independent practice', minutes: 16, intent: 'Students work alone while you circulate for the two known errors' },
    { name: 'Plenary — exit ticket', minutes: 5, intent: 'Sort the class into "got it" and "reteach" before tomorrow' },
  ],
};

const SEGMENTS = [
  {
    name: 'Starter — equivalent fractions',
    minutes: 5,
    markdown: `Four on the board, thirty seconds each. Students write the missing number in their books.

- 1/2 = ?/8
- 2/3 = 8/?
- 3/4 = ?/12
- 5/6 = ?/24

**Why this one.** Every method for adding unlike denominators is really *rewrite both fractions so the pieces match*. If equivalence is shaky, the rest of the lesson turns into guesswork with a procedure on top.`,
  },
  {
    name: 'Teach — why the denominators cannot be added',
    minutes: 12,
    markdown: `Start with the mistake, not the method. Put this up and ask whether it is true:

> 1/2 + 1/3 = 2/5

Most classes have someone who says yes, and it is worth letting them say it. Then draw it: a half of a bar, a third of the same bar. 2/5 is **smaller than 1/2** — so the answer cannot possibly be right.

**The idea in one sentence.** You can only add fractions when the pieces are the same size, and the denominator is what tells you the size of the piece.

Now rewrite both in sixths on the same bar: 3/6 + 2/6 = 5/6. The addition is just counting pieces once they match.`,
  },
  {
    name: 'Worked example — lowest common denominator',
    minutes: 12,
    markdown: `Three steps, said out loud every single time:

- Find a common denominator — the lowest common multiple of the two denominators.
- Rewrite each fraction over it.
- Add the numerators. **The denominator does not change.**

> 1/4 + 1/6
> LCM of 4 and 6 is 12
> 3/12 + 2/12 = 5/12

Do 2/5 + 1/3 with the class, then 1/6 + 1/10 so they meet an answer that needs simplifying: 5/30 + 3/30 = 8/30 = 4/15.

**Watch for.** Students who reach a common denominator by multiplying the two (24 in the first example). Say clearly that this is *not wrong* — it just leaves more simplifying at the end.`,
  },
  {
    name: 'Independent practice',
    minutes: 16,
    markdown: `Set the three questions below. Circulate rather than answering from the front — the two errors worth catching in the first five minutes are:

- adding the denominators, and
- finding the common denominator but forgetting to scale the numerator with it.

**Fast finishers.** *Is 1/2 + 1/3 + 1/4 bigger or smaller than 1? Convince me without a calculator.* Twelfths gets them there: 6/12 + 4/12 + 3/12 = 13/12.`,
  },
  {
    name: 'Plenary — exit ticket',
    minutes: 5,
    markdown: `One question on a slip of paper, collected at the door:

> Priya says 2/3 + 1/6 = 3/9. Without working out the right answer, explain how you know she is wrong.

The answer you are listening for is *the pieces are different sizes*, or *3/9 is smaller than 2/3, and adding cannot make it smaller*.

Sort the slips into **got it** and **reteach** on the way out. That pile is tomorrow's starter.`,
  },
];

const QUESTIONS = [
  {
    kind: 'multiple_choice',
    prompt: 'What is 1/4 + 1/6?',
    options: ['2/10', '5/12', '5/24', '2/5'],
    answer: '5/12',
    hint: 'Rewrite both fractions in twelfths first.',
    feedback: '1/4 = 3/12 and 1/6 = 2/12, so the total is 5/12. 2/10 comes from adding the denominators.',
  },
  {
    kind: 'short_answer',
    prompt: 'Work out 3/8 + 1/6, giving your answer in its simplest form.',
    answer: '13/24 — the lowest common denominator is 24, giving 9/24 + 4/24.',
    hint: 'What is the lowest common multiple of 8 and 6?',
    feedback: '9/24 + 4/24 = 13/24. 13 is prime, so it is already in its simplest form.',
  },
  {
    kind: 'open_response',
    prompt: 'Ravi writes 1/3 + 1/4 = 2/7. Explain what he has done wrong, then show him a method that works.',
    rubric: [
      'Identifies that the denominators were added instead of the pieces being made the same size',
      'Rewrites both fractions over a common denominator of 12 correctly',
      'Explains the method in words, not only in symbols',
    ],
    hint: 'Think about what the denominator actually tells you.',
  },
];

export async function runMockPlanning(onNarrate: (line: string) => void) {
  onNarrate('Reading the scheme of work…');
  await call('list_scheme');
  await sleep(500);

  onNarrate('Drafting an outline for you to check…');
  // propose_outline parks until the teacher clicks Approve. If they ask for
  // changes we simply propose again — exactly what the model would do.
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await call('propose_outline', OUTLINE);
    if (result.startsWith('Outline approved')) break;
    onNarrate('Reworking the outline against your note…');
    await sleep(600);
  }

  onNarrate('Writing the plan…');
  for (const segment of SEGMENTS) {
    await call('write_segment', segment);
    await sleep(260);
  }

  onNarrate('Adding practice questions…');
  for (const question of QUESTIONS) {
    await call('add_question', question);
    await sleep(300);
  }

  await call('finish_plan', {
    summary:
      'A 50-minute Year 7 lesson that opens on the misconception, models the LCM method twice, and ends on an exit ticket you can sort.',
  });
  onNarrate('Plan ready. Add it to the scheme when you are happy with it.');
}

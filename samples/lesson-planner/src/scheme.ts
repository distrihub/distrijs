/**
 * The mocked "backend" — a department's scheme of work.
 *
 * In a real product this is an HTTP API. Here it is a module-level object with
 * a subscribe() so React can re-render — deliberately, because the point of the
 * sample is that **the agent never talks to a server**. It calls client-side
 * tools (see `tools.ts`) that read and write this store in the browser.
 *
 * Swap the functions at the bottom for `fetch()` calls and the agent side of
 * the app does not change at all.
 */

export interface Unit {
  id: string;
  title: string;
  subject: string;
  year: string;
}

export interface PlannedLesson {
  id: string;
  unitId: string;
  title: string;
  objective: string;
  minutes: number;
}

const UNITS: Unit[] = [
  { id: 'u-fractions', title: 'Fractions', subject: 'Maths', year: 'Year 7' },
  { id: 'u-equations', title: 'Linear equations', subject: 'Maths', year: 'Year 8' },
  { id: 'u-ratio', title: 'Ratio and proportion', subject: 'Maths', year: 'Year 8' },
];

const SEED: PlannedLesson[] = [
  {
    id: 'p-seed-1',
    unitId: 'u-fractions',
    title: 'Equivalent fractions',
    objective: 'Scale a fraction up and down without changing its value.',
    minutes: 50,
  },
  {
    id: 'p-seed-2',
    unitId: 'u-fractions',
    title: 'Comparing fractions',
    objective: 'Decide which of two fractions is larger, and justify it.',
    minutes: 50,
  },
  {
    id: 'p-seed-3',
    unitId: 'u-equations',
    title: 'Solving one-step equations',
    objective: 'Undo a single operation to isolate the unknown.',
    minutes: 60,
  },
];

let lessons: PlannedLesson[] = [...SEED];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((fn) => fn());

export const schemeStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot() {
    return lessons;
  },
};

/** Everything the agent is allowed to know about the scheme of work. */
export function listScheme() {
  return UNITS.map((unit) => ({
    unit_id: unit.id,
    title: unit.title,
    subject: unit.subject,
    year: unit.year,
    lessons: lessons
      .filter((l) => l.unitId === unit.id)
      .map((l) => ({ id: l.id, title: l.title, objective: l.objective, minutes: l.minutes })),
  }));
}

export function findUnit(unitId: string): Unit | undefined {
  return UNITS.find((u) => u.id === unitId);
}

export function unitIds(): string[] {
  return UNITS.map((u) => u.id);
}

export function addToScheme(lesson: PlannedLesson): PlannedLesson {
  lessons = [...lessons.filter((l) => l.id !== lesson.id), lesson];
  emit();
  return lesson;
}

export function resetScheme() {
  lessons = [...SEED];
  emit();
}

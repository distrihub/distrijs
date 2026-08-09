import { useSyncExternalStore } from 'react';
import { listScheme, schemeStore } from '../scheme';

/**
 * The department's scheme of work — the mocked "database" the agent reads with
 * `list_scheme` and writes with `add_to_scheme`. Watch a new lesson appear here
 * the moment the agent files it.
 */
export function SchemeRail() {
  useSyncExternalStore(schemeStore.subscribe, schemeStore.getSnapshot);
  const units = listScheme();

  return (
    <aside className="rail">
      <div className="rail__head">
        <span className="rail__brand">Scheme of work</span>
        <span className="rail__sub">mocked — lives in the browser</span>
      </div>

      {units.map((unit) => (
        <div key={unit.unit_id} className="rail__unit">
          <div className="rail__unit-title">{unit.title}</div>
          <div className="rail__unit-meta">
            {unit.subject} · {unit.year}
          </div>
          <ul>
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <span className="rail__dot" />
                <span className="rail__lesson">{lesson.title}</span>
                <span className="rail__count">{lesson.minutes}′</span>
              </li>
            ))}
            {unit.lessons.length === 0 && <li className="rail__empty">Nothing planned yet</li>}
          </ul>
        </div>
      ))}
    </aside>
  );
}

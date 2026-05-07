import { useNavigate } from 'react-router-dom';
import { ConnectionEditor } from '../blocks/ConnectionEditor';
import { useDistriHome } from '../provider/context';

/**
 * NewConnectionPage — Tier-3 page wrapping ConnectionEditor in create mode.
 * Saving redirects to /connections (prefixed). Back link navigates there too.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function NewConnectionPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-4 py-3 sm:px-6 shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => nav(`${prefix}/connections`)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Connections
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ConnectionEditor
          mode="create"
          onSaved={(conn) => {
            home.onAction?.({ type: 'connection.linked', id: conn?.id ?? '' });
            nav(`${prefix}/connections`);
          }}
          onCancel={() => nav(`${prefix}/connections`)}
          className="max-w-2xl"
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConnectionEditor } from '../blocks/ConnectionEditor';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';
import type { Connection } from '../blocks/ConnectionList';

/**
 * EditConnectionPage — Tier-3 page wrapping ConnectionEditor in edit mode.
 * Uses useParams() to get `connectionId`, loads the connection via
 * homeClient.getConnection(id), and renders ConnectionEditor in edit mode.
 */
export function EditConnectionPage() {
  const nav = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();
  const prefix = home.routes?.prefix ?? '';

  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeClient || !connectionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    homeClient
      .getConnection(connectionId)
      .then((record) => {
        // Map ConnectionRecord to Connection shape used by ConnectionEditor
        setConnection({
          id: record.id,
          name: record.name,
          auth_scope: record.auth_scope as Connection['auth_scope'],
          auth_type: record.auth_type as Connection['auth_type'],
          created_at: record.created_at,
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load connection');
      })
      .finally(() => setLoading(false));
  }, [homeClient, connectionId]);

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
        {!loading && connection && (
          <span className="text-xs text-muted-foreground">/ {connection.name}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading connection…</div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && connection && (
          <ConnectionEditor
            mode="edit"
            connection={connection}
            onSaved={(saved) => {
              home.onAction?.({ type: 'connection.linked', id: saved?.id ?? '' });
              nav(`${prefix}/connections`);
            }}
            onCancel={() => nav(`${prefix}/connections`)}
            className="max-w-2xl"
          />
        )}

        {!loading && !error && !connection && (
          <div className="text-sm text-muted-foreground">Connection not found.</div>
        )}
      </div>
    </div>
  );
}

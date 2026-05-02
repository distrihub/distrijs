import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Plus, Trash2, Lock, Users, Plug } from 'lucide-react';
import { Button, Skeleton } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthScope = 'workspace' | 'user' | 'public';

export type AuthType =
  | { type: 'custom'; fields: Array<{ key: string; label: string | null; is_secret: boolean; required: boolean }> }
  | { type: 'oauth'; provider: string; scopes: string[] };

export interface Connection {
  id: string;
  name: string;
  auth_scope: AuthScope;
  auth_type: AuthType;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Slots + props
// ---------------------------------------------------------------------------

export interface ConnectionListSlots {
  /** Per-row extra actions (e.g. cloud adds "Disconnect" for OAuth rows) */
  rowActions?: (connectionId: string) => ReactNode;
}

export interface ConnectionListProps {
  slots?: ConnectionListSlots;
  onAdd?: () => void;
  onEdit?: (connection: Connection) => void;
  onDelete?: (connectionId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConnectionRow({
  connection,
  onEdit,
  onDelete,
  extraActions,
}: {
  connection: Connection;
  onEdit?: (c: Connection) => void;
  onDelete?: (id: string) => void;
  extraActions?: ReactNode;
}) {
  const isOAuth = connection.auth_type.type === 'oauth';
  const isWorkspace = connection.auth_scope === 'workspace';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0">
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {isOAuth ? <Plug className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{connection.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium text-muted-foreground capitalize">
            {isOAuth ? 'OAuth' : 'Custom'}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {isWorkspace ? (
              <Users className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {connection.auth_scope}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {extraActions}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(connection)}
            className="h-7 px-2 text-xs"
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(connection.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

/**
 * ConnectionList — lists workspace connections with edit/delete actions.
 * Slot `rowActions(connectionId)` lets cloud inject extra per-row buttons
 * (e.g. OAuth "Disconnect" / "Reconnect").
 */
export function ConnectionList({ slots, onAdd, onEdit, onDelete, className }: ConnectionListProps) {
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // TODO: add DistriHomeClient.listConnections() — for now call raw endpoint
      const data = await (homeClient as any).client
        ?.fetch('/connections')
        .then((r: Response) => r.json());
      setConnections(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this connection?')) return;
    try {
      await (homeClient as any)?.client?.fetch(`/connections/${id}`, { method: 'DELETE' });
      setConnections((prev) => prev.filter((c) => c.id !== id));
      onDelete?.(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    }
  };

  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Connections</h3>
        {onAdd && (
          <Button size="sm" onClick={onAdd} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="px-4 py-3 text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && connections.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
          <Plug className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No connections yet</p>
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd} className="mt-1 text-xs">
              Add connection
            </Button>
          )}
        </div>
      )}

      {!loading && !error && connections.length > 0 && (
        <div>
          {connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              connection={conn}
              onEdit={onEdit}
              onDelete={handleDelete}
              extraActions={slots?.rowActions?.(conn.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

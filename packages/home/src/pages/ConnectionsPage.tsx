import { useNavigate } from 'react-router-dom';
import { ConnectionList } from '../blocks/ConnectionList';
import { useDistriHome } from '../provider/context';
import type { Connection } from '../blocks/ConnectionList';

/**
 * ConnectionsPage — Tier-3 page listing workspace connections.
 * "+ New" navigates to NewConnectionPage; "Edit" navigates to a
 * detail/edit URL. Consumer app is responsible for wrapping this
 * in a layout shell and wiring the edit route.
 */
export function ConnectionsPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const prefix = home.routes?.prefix ?? '';

  const handleEdit = (conn: Connection) => {
    nav(`${prefix}/connections/${encodeURIComponent(conn.id)}/edit`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ConnectionList
          onAdd={() => nav(`${prefix}/connections/new`)}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}

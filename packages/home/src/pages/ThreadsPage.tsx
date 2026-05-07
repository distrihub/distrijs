import { useNavigate } from 'react-router-dom';
import { ThreadList } from '../blocks/ThreadList';
import { useDistriHome } from '../provider/context';

/**
 * ThreadsPage — Tier-3 page that lists workspace threads.
 * Consumer app is responsible for wrapping this in a layout shell.
 */
export function ThreadsPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Threads</h1>
      <ThreadList
        onAction={(a) => {
          if (a.type === 'thread.opened') {
            const prefix = home.routes?.prefix ?? '';
            nav(`${prefix}/threads/${a.id}`);
          }
        }}
      />
    </div>
  );
}

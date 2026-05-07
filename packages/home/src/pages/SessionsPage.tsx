import { Database } from 'lucide-react';
import { SessionsView } from '../components/SessionsView';

/**
 * SessionsPage — list of execution sessions.
 * Mounted at /sessions.
 */
export function SessionsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <Database className="h-4 w-4" />
        <h1 className="text-base font-semibold sm:text-lg">Sessions</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <SessionsView />
      </div>
    </div>
  );
}

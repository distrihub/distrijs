import { Home } from '../components/Home';

/**
 * HomePage — Tier-3 page wrapping the Home dashboard.
 * Mounted at /home.
 */
export function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Home />
    </div>
  );
}

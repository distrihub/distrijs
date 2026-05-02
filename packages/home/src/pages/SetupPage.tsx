import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@distri/components';
import { useDistriHome } from '../provider/context';
import { useDistriHomeClient } from '../DistriHomeProvider';

/**
 * SetupPage — OSS first-run flow.
 *
 * Cloud's SetupPage is a multi-tenant OTP+workspace flow for
 * platform-shared bots. This OSS version is simpler:
 *   1. Display name entry.
 *   2. "Get started" navigates to /agents.
 *
 * If the HomeClient has a profile update API in the future,
 * save the name there; for now we just navigate on submit.
 */
export function SetupPage() {
  const nav = useNavigate();
  const home = useDistriHome();
  const homeClient = useDistriHomeClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefix = home.routes?.prefix ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // If the client exposes a profile/me PATCH endpoint in the future,
      // call it here to persist the display name.
      if (homeClient && name.trim()) {
        await homeClient.distriClient.fetch('/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        });
      }
    } catch {
      // Non-fatal: server may not have a PATCH /me; proceed to agents.
    } finally {
      setSaving(false);
      nav(prefix + '/agents');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <Card className="p-6 max-w-lg w-full space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Welcome to distri</h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s get your local server set up. You can always change these later.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="setup-name">
              Your name
            </label>
            <Input
              id="setup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Get started'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

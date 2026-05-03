import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, User } from 'lucide-react';
import { Button, Input } from '@distri/components';
import { useDistriHomeClient } from '../provider/context';
import type { Profile } from '../DistriHomeClient';

// ---------------------------------------------------------------------------
// ProfileEditor — edit display name and username.
// Uses DistriHomeClient.getProfile / updateProfile.
// Falls back gracefully when the server doesn't expose /profile (OSS).
// ---------------------------------------------------------------------------

export interface ProfileEditorProps {
  className?: string;
}

export function ProfileEditor({ className }: ProfileEditorProps = {}) {
  const homeClient = useDistriHomeClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notSupported, setNotSupported] = useState(false);

  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [originalUserName, setOriginalUserName] = useState('');

  const load = useCallback(async () => {
    if (!homeClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await homeClient.getProfile();
      if (!data) {
        setNotSupported(true);
        return;
      }
      setProfile(data);
      setName(data.name ?? '');
      setUserName(data.user_name);
      setOriginalUserName(data.user_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [homeClient]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeClient) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { name?: string; user_name?: string } = {};
      if (name !== (profile?.name ?? '')) updates.name = name;
      if (userName !== originalUserName) updates.user_name = userName;

      if (Object.keys(updates).length === 0) {
        setSuccess('No changes to save');
        setSaving(false);
        return;
      }

      const updated = await homeClient.updateProfile(updates);
      setProfile(updated);
      setName(updated.name ?? '');
      setUserName(updated.user_name);
      setOriginalUserName(updated.user_name);
      setSuccess('Profile updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = name !== (profile?.name ?? '') || userName !== originalUserName;

  if (notSupported) {
    return (
      <div className={`text-sm text-muted-foreground ${className ?? ''}`}>
        Profile management is not available in this installation.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-border bg-card p-5 ${className ?? ''}`}>
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Your account</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your profile information and username.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-400/50 bg-green-500/10 px-3 py-2.5 text-sm text-green-600 dark:text-green-300">
              <Check className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <Input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="mt-1 bg-muted/30 text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Display Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Username
            </label>
            <Input
              type="text"
              value={userName}
              onChange={(e) =>
                setUserName(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))
              }
              placeholder="username"
              className="mt-1 font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only lowercase letters, numbers, dashes, and underscores.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {profile?.id && (
              <p className="text-xs text-muted-foreground">
                User ID:{' '}
                <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[11px]">
                  {profile.id}
                </code>
              </p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={saving || !hasChanges}
              className="ml-auto"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

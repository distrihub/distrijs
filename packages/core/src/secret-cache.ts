/**
 * Client-side cache for resolved secrets and connection tokens.
 *
 * Ported from distri/src/secret_cache.rs.
 *
 * Resolution priority: env_vars > cache (non-expired) > batch fetch via server.
 */

import type { DistriClient } from './distri-client';

interface CachedEntry {
  value: string;
  expiresAt: number; // Date.now() + ttl
}

export class SecretCache {
  private cache: Map<string, CachedEntry> = new Map();
  private defaultTtlMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(private client: DistriClient) {}

  /**
   * Resolve variable names to their values.
   *
   * Priority: 1) env_vars, 2) cache hit (non-expired), 3) batch fetch via server.
   */
  async resolveVars(
    varNames: string[],
    envVars: Record<string, string>,
  ): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};
    const toFetch: string[] = [];

    const now = Date.now();

    // 1) Check env_vars first, 2) Then check cache
    for (const name of varNames) {
      if (envVars[name] !== undefined) {
        resolved[name] = envVars[name];
      } else {
        const entry = this.cache.get(name);
        if (entry && entry.expiresAt > now) {
          resolved[name] = entry.value;
        } else {
          toFetch.push(name);
        }
      }
    }

    // 3) Batch fetch remaining from server
    if (toFetch.length > 0) {
      try {
        const fetched = await this.client.resolveSecrets(toFetch);
        const expiresAt = Date.now() + this.defaultTtlMs;
        for (const [k, v] of Object.entries(fetched)) {
          this.cache.set(k, { value: v, expiresAt });
          resolved[k] = v;
        }
      } catch (e) {
        console.warn('failed to resolve secrets:', e);
        // Continue with what we have — unresolved vars stay as $VAR_NAME
      }
    }

    return resolved;
  }

  /**
   * Resolve a connection token by connection ID.
   *
   * Returns the access token string. Caches using `expires_at` from the
   * response when available, otherwise uses the default TTL.
   */
  async resolveConnectionToken(connectionId: string): Promise<string> {
    const cacheKey = `__connection:${connectionId}`;

    // Check cache
    const entry = this.cache.get(cacheKey);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }

    // Fetch from server
    const token = await this.client.getConnectionToken(connectionId);

    // Determine expiry
    let expiresAt: number;
    if (token.expires_at) {
      const dt = new Date(token.expires_at).getTime();
      if (!isNaN(dt)) {
        const now = Date.now();
        const dur = dt - now;
        // Subtract a 30s buffer so we refresh before actual expiry
        expiresAt = now + Math.max(0, dur - 30_000);
      } else {
        expiresAt = Date.now() + this.defaultTtlMs;
      }
    } else {
      expiresAt = Date.now() + this.defaultTtlMs;
    }

    // Cache
    this.cache.set(cacheKey, { value: token.access_token, expiresAt });

    return token.access_token;
  }

  /** Remove a specific entry from the cache. */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /** Clear all cached entries. */
  clear(): void {
    this.cache.clear();
  }
}

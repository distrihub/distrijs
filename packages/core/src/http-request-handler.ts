/**
 * Client-side HTTP request handler that mirrors the server-side HttpRequestTool.
 *
 * Ported from distri/src/client_http_request.rs.
 *
 * Resolves `$VAR_NAME` references via SecretCache and handles `x-connection-id`
 * for OAuth Bearer token injection.
 */

import { SecretCache } from './secret-cache';
import {
  extractVars,
  extractVarsFromValue,
  substituteString,
  substituteValue,
} from './resolve';

/** Useful response headers to keep (lowercase). */
const USEFUL_HEADERS = new Set([
  'content-type',
  'content-length',
  'location',
  'retry-after',
  'x-request-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'www-authenticate',
  'link',
]);

/**
 * Execute an HTTP request with variable resolution and connection token support.
 *
 * Input/output format matches the server-side HttpRequestTool:
 * - Input: `{ url, method, headers, body }`
 * - Output: `{ status, ok, headers, body }`
 */
export async function executeHttpRequest(
  input: Record<string, unknown>,
  secretCache: SecretCache,
  envVars: Record<string, string>,
): Promise<Record<string, unknown>> {
  // 1. Parse input
  const method = (
    typeof input.method === 'string' ? input.method : 'GET'
  ).toUpperCase();

  const rawUrl = input.url;
  if (typeof rawUrl !== 'string') {
    throw new Error("Missing 'url' parameter");
  }

  const headersValue =
    (input.headers as Record<string, unknown> | undefined) ?? {};
  const bodyValue = input.body ?? undefined;

  // 2. Check for x-connection-id
  const connectionId =
    typeof (headersValue as Record<string, unknown>)['x-connection-id'] ===
    'string'
      ? ((headersValue as Record<string, unknown>)['x-connection-id'] as string)
      : undefined;

  // 3. Collect all $VAR references
  const allVars = [
    ...extractVars(rawUrl),
    ...extractVarsFromValue(headersValue),
    ...(bodyValue !== undefined ? extractVarsFromValue(bodyValue) : []),
  ];
  allVars.sort();
  // Dedup
  const uniqueVars = allVars.filter((v, i) => i === 0 || v !== allVars[i - 1]);

  // 4. Resolve variables via SecretCache
  const resolved = await secretCache.resolveVars(uniqueVars, envVars);

  // 5. Substitute resolved values
  const url = substituteString(rawUrl, resolved);
  const substitutedHeaders = substituteValue(headersValue, resolved) as Record<
    string,
    unknown
  >;
  const substitutedBody =
    bodyValue !== undefined ? substituteValue(bodyValue, resolved) : undefined;

  // 6. Build request headers
  const fetchHeaders: Record<string, string> = {};
  let hasContentType = false;

  for (const [key, value] of Object.entries(substitutedHeaders)) {
    if (key === 'x-connection-id') {
      continue; // consumed, not forwarded
    }
    if (typeof value === 'string') {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'content-type') {
        hasContentType = true;
      }
      fetchHeaders[lowerKey] = value;
    }
  }

  // 7. If connection_id present, resolve token and inject Bearer header
  if (connectionId) {
    const accessToken =
      await secretCache.resolveConnectionToken(connectionId);
    fetchHeaders['authorization'] = `Bearer ${accessToken}`;
  }

  // 8. Build and send request
  const supportedMethods = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ]);
  if (!supportedMethods.has(method)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  const fetchInit: RequestInit = {
    method,
    headers: fetchHeaders,
  };

  if (
    substitutedBody !== undefined &&
    method !== 'GET' &&
    method !== 'DELETE'
  ) {
    if (!hasContentType) {
      // Send as JSON and set content-type
      fetchHeaders['content-type'] = 'application/json';
      fetchInit.headers = fetchHeaders;
      fetchInit.body = JSON.stringify(substitutedBody);
    } else {
      const bodyStr =
        typeof substitutedBody === 'string'
          ? substitutedBody
          : JSON.stringify(substitutedBody);
      fetchInit.body = bodyStr;
    }
  }

  // Use AbortController for 120s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  fetchInit.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } finally {
    clearTimeout(timeoutId);
  }

  // 9. Read response
  const status = response.status;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (USEFUL_HEADERS.has(key.toLowerCase())) {
      responseHeaders[key.toLowerCase()] = value;
    }
  });

  const contentType = (responseHeaders['content-type'] ?? '').toLowerCase();
  const responseText = await response.text();

  const isJson = contentType.includes('application/json');
  let responseBody: unknown;
  if (isJson) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  } else if (responseText.length === 0) {
    responseBody = null;
  } else {
    responseBody = responseText;
  }

  // 10. Build result — scrub secrets from the response body
  const secretValues = Object.values(resolved);
  const result = {
    status,
    ok: status >= 200 && status < 300,
    headers: responseHeaders,
    body: scrubSecrets(responseBody, secretValues),
  };

  return result;
}

/**
 * Remove secret values from a JSON value to prevent leaking them in tool output.
 */
function scrubSecrets(value: unknown, secrets: string[]): unknown {
  if (secrets.length === 0) {
    return value;
  }
  if (typeof value === 'string') {
    let result = value;
    for (const secret of secrets) {
      if (secret.length > 0) {
        // Replace all occurrences
        result = result.split(secret).join('***');
      }
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((v) => scrubSecrets(v, secrets));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = scrubSecrets(v, secrets);
    }
    return result;
  }
  return value;
}

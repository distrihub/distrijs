/**
 * HTTP request types and client-side auto-detect handler.
 *
 * Types ported from distri-types/src/http_request.rs.
 * Auto-detect logic ported from distri/src/client_http_request.rs.
 */

import {
  extractVars,
  substituteString,
  substituteValue,
} from './resolve';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestInput {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
}

export interface HttpRequestResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: unknown;
}

// ---------------------------------------------------------------------------
// Useful response headers to keep (lowercase)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Auto-detect execute
// ---------------------------------------------------------------------------

/**
 * Execute an HTTP request, auto-detecting whether to run locally or proxy.
 *
 * Logic (mirrors client_http_request.rs):
 *  1. Extract `$VAR_NAME` from url, headers, body.
 *  2. Check which are in `envVars`.
 *  3. If all resolved AND no `x-connection-id` header → substitute and
 *     execute locally with `fetch()`.
 *  4. If any unresolved OR `x-connection-id` present → call `proxyRequest`.
 */
export async function executeHttpRequest(
  input: HttpRequestInput,
  envVars: Record<string, string>,
  proxyRequest: (input: HttpRequestInput) => Promise<HttpRequestResponse>,
): Promise<HttpRequestResponse> {
  // Collect all $VAR references from url, headers, body
  const allVars: string[] = [...extractVars(input.url)];

  for (const [k, v] of Object.entries(input.headers)) {
    allVars.push(...extractVars(k));
    allVars.push(...extractVars(v));
  }

  if (input.body !== undefined) {
    const bodyStr = JSON.stringify(input.body);
    allVars.push(...extractVars(bodyStr));
  }

  allVars.sort();
  // Dedup (after sort, duplicates are adjacent)
  const uniqueVars = allVars.filter((v, i) => i === 0 || v !== allVars[i - 1]);

  const hasConnectionId = 'x-connection-id' in input.headers;
  const unresolved = uniqueVars.filter((v) => !(v in envVars));

  // Proxy to server if secrets needed or connection-id present
  if (unresolved.length > 0 || hasConnectionId) {
    return proxyRequest(input);
  }

  // Execute locally — all vars are in envVars
  return executeLocally(input, envVars);
}

// ---------------------------------------------------------------------------
// Local execution
// ---------------------------------------------------------------------------

async function executeLocally(
  input: HttpRequestInput,
  envVars: Record<string, string>,
): Promise<HttpRequestResponse> {
  const url = substituteString(input.url, envVars);

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.headers)) {
    headers[substituteString(k, envVars)] = substituteString(v, envVars);
  }

  const body =
    input.body !== undefined
      ? substituteValue(input.body, envVars)
      : undefined;

  // Build fetch request
  let hasContentType = false;
  const fetchHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'content-type') {
      hasContentType = true;
    }
    fetchHeaders[lowerKey] = value;
  }

  const fetchInit: RequestInit = {
    method: input.method,
    headers: fetchHeaders,
  };

  // Set body
  if (body !== undefined && input.method !== 'GET' && input.method !== 'DELETE') {
    if (!hasContentType) {
      fetchHeaders['content-type'] = 'application/json';
      fetchInit.headers = fetchHeaders;
      fetchInit.body = JSON.stringify(body);
    } else {
      const bodyStr =
        typeof body === 'string' ? body : JSON.stringify(body);
      fetchInit.body = bodyStr;
    }
  }

  // 120s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  fetchInit.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } finally {
    clearTimeout(timeoutId);
  }

  // Parse response
  const status = response.status;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (USEFUL_HEADERS.has(key.toLowerCase())) {
      responseHeaders[key.toLowerCase()] = value;
    }
  });

  const contentType = (responseHeaders['content-type'] ?? '').toLowerCase();
  const responseText = await response.text();

  let responseBody: unknown;
  if (contentType.includes('application/json')) {
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

  return {
    status,
    ok: status >= 200 && status < 300,
    headers: responseHeaders,
    body: responseBody,
  };
}

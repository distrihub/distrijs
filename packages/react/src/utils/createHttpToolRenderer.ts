import React from 'react';
import { ToolRendererMap, ToolRendererProps } from '../types';
import { HttpToolCard, PathConfig } from '../components/renderers/tools/HttpToolCard';

// Re-export PathConfig for consumer convenience
export type { PathConfig } from '../components/renderers/tools/HttpToolCard';

/**
 * Options for creating HTTP tool renderers.
 */
export interface HttpToolRendererOptions {
  /**
   * Tool names to handle (e.g. `['distri_request', 'api_request']`).
   * Each name gets an entry in the returned `ToolRendererMap`.
   */
  toolNames: string[];

  /**
   * Registered path patterns with optional display labels.
   *
   * Patterns support `:param` wildcards:
   * ```
   * { pattern: '/api/users/:id', label: 'Get User' }
   * ```
   */
  paths?: PathConfig[];
}

/**
 * Creates a `ToolRendererMap` that renders HTTP tool calls with an
 * improved UI — color-coded method badges, request body display,
 * formatted JSON responses, and status code indicators.
 *
 * Registered `paths` let you attach human-readable labels that appear
 * in the card header when the request URL matches a pattern.
 *
 * @example
 * ```tsx
 * import { createHttpToolRenderer } from '@distri/react';
 *
 * const httpRenderers = createHttpToolRenderer({
 *   toolNames: ['distri_request', 'api_request'],
 *   paths: [
 *     { pattern: '/api/users',     label: 'List Users' },
 *     { pattern: '/api/users/:id', label: 'Get User' },
 *   ],
 * });
 *
 * <Chat toolRenderers={{ ...httpRenderers }} />
 * ```
 */
export function createHttpToolRenderer(options: HttpToolRendererOptions): ToolRendererMap {
  const { toolNames, paths = [] } = options;
  const map: ToolRendererMap = {};

  for (const name of toolNames) {
    map[name] = (props: ToolRendererProps) =>
      React.createElement(HttpToolCard, {
        toolCall: props.toolCall,
        state: props.state,
        paths,
      });
  }

  return map;
}

import type { IndexedDbFilesystem } from '../storage/indexeddb-filesystem'

export interface ExecJsParams {
  code: string
  timeout?: number
}

export const EXEC_JS_TOOL_DEF = {
  name: 'ExecJs',
  description: 'Execute JavaScript code in the browser sandbox.',
  prompt:
    'Executes JavaScript code in the browser with access to the project filesystem via a `fs` global.\n' +
    '- Use `console.log()` for output. Returns stdout, stderr, and exit code.\n' +
    '- The `fs` object provides: readFile, writeFile, editFile, glob, grep, listDirectory, tree.\n' +
    '- Default timeout is 5000ms, max 30000ms.\n' +
    '- This runs in the browser, not Node.js — no `require()`, `process`, or Node built-ins.',
  parameters: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', description: 'JavaScript code to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds (default 5000, max 30000)' },
    },
  },
} as const

export function createExecJsHandler(fs: IndexedDbFilesystem) {
  return async (input: unknown) => {
    const params = input as ExecJsParams
    const timeoutMs = Math.min(params.timeout ?? 5000, 30000)
    const startTime = Date.now()

    let stdout = ''
    let stderr = ''
    let exitCode = 0

    const consoleMock = {
      log: (...args: unknown[]) => { stdout += args.map(String).join(' ') + '\n' },
      error: (...args: unknown[]) => { stderr += args.map(String).join(' ') + '\n' },
      warn: (...args: unknown[]) => { stderr += args.map(String).join(' ') + '\n' },
      info: (...args: unknown[]) => { stdout += args.map(String).join(' ') + '\n' },
    }

    try {
      const fn = new Function('console', 'fs', `
        return (async () => {
          ${params.code}
        })()
      `)

      const result = await Promise.race([
        fn(consoleMock, fs),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs),
        ),
      ])

      if (result !== undefined && !stdout) {
        stdout = String(result) + '\n'
      }
    } catch (err) {
      stderr += (err instanceof Error ? err.message : String(err)) + '\n'
      exitCode = 1
    }

    const durationMs = Date.now() - startTime
    return [{
      part_type: 'data' as const,
      data: {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exit_code: exitCode,
        duration_ms: durationMs,
      },
    }]
  }
}

// CodeEditor — Monaco-based source editor used by the workspace SplitEditor.
// Standardises font, theme, and option set so every code-y surface (markdown
// raw view, workflow JSON, skill scripts, templates) looks the same.

import Editor, { type OnChange } from '@monaco-editor/react'

export type CodeLanguage =
  | 'markdown'
  | 'json'
  | 'handlebars'
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'shell'
  | 'plaintext'
  | string

type Props = {
  language: CodeLanguage
  value: string
  onChange?: (next: string) => void
  readOnly?: boolean
  height?: string | number
}

export function CodeEditor({ language, value, onChange, readOnly, height = '100%' }: Props) {
  const handleChange: OnChange = (next) => {
    onChange?.(next ?? '')
  }
  return (
    <Editor
      language={language}
      value={value}
      theme="vs-dark"
      height={height}
      onChange={handleChange}
      options={{
        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
        lineHeight: 20,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        renderLineHighlight: 'gutter',
        readOnly: !!readOnly,
        tabSize: 2,
        padding: { top: 12, bottom: 12 },
      }}
    />
  )
}

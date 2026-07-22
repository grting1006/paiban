import { useRef } from 'react'
import { Bold, Heading1, Heading2, Italic, List, Quote } from 'lucide-react'

type TextToolKind = 'heading-1' | 'heading-2' | 'bold' | 'italic' | 'list' | 'quote'

interface TextTool {
  label: string
  Icon: typeof Heading1
  kind: TextToolKind
}

const textTools: TextTool[] = [
  { label: '一级标题', Icon: Heading1, kind: 'heading-1' },
  { label: '二级标题', Icon: Heading2, kind: 'heading-2' },
  { label: '粗体', Icon: Bold, kind: 'bold' },
  { label: '斜体', Icon: Italic, kind: 'italic' },
  { label: '列表', Icon: List, kind: 'list' },
  { label: '引用', Icon: Quote, kind: 'quote' },
]

const linePrefixes: Partial<Record<TextToolKind, string>> = {
  'heading-1': '# ',
  'heading-2': '## ',
  list: '- ',
  quote: '> ',
}

interface SourcePanelProps {
  value: string
  onChange: (value: string) => void
}

export function SourcePanel({ value, onChange }: SourcePanelProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)

  function applyTextFormat(kind: TextToolKind) {
    const editor = editorRef.current
    if (!editor) return

    const start = editor.selectionStart
    const end = editor.selectionEnd
    let nextValue = value
    let nextStart = start
    let nextEnd = end
    const marker = kind === 'bold' ? '**' : kind === 'italic' ? '*' : null

    if (marker) {
      nextValue = `${value.slice(0, start)}${marker}${value.slice(start, end)}${marker}${value.slice(end)}`
      nextStart = start + marker.length
      nextEnd = end + marker.length
    } else {
      const prefix = linePrefixes[kind] ?? ''
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
      const followingBreak = value.indexOf('\n', end)
      const lineEnd = followingBreak === -1 ? value.length : followingBreak
      const selectedLines = value.slice(lineStart, lineEnd)
      const formattedLines = selectedLines
        .split('\n')
        .map((line) => `${prefix}${line.replace(/^\s*(?:#{1,5}|>|[-+*])\s+/, '')}`)
        .join('\n')
      nextValue = `${value.slice(0, lineStart)}${formattedLines}${value.slice(lineEnd)}`
      nextStart = lineStart
      nextEnd = lineStart + formattedLines.length
    }

    onChange(nextValue)
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(nextStart, nextEnd)
    })
  }

  return (
    <section className="source-panel" aria-label="原始内容">
      <div className="source-toolbar" aria-label="文本工具">
        {textTools.map(({ label, Icon, kind }) => (
          <button
            key={label}
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyTextFormat(kind)}
          ><Icon size={15} /></button>
        ))}
      </div>
      <textarea
        ref={editorRef}
        className="source-editor"
        aria-label="原始文本"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </section>
  )
}

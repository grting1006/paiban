import { Bold, Heading1, Heading2, Italic, List, Quote } from 'lucide-react'

interface TextTool {
  label: string
  Icon: typeof Heading1
  command: string
  value?: string
}

const textTools: TextTool[] = [
  { label: '一级标题', Icon: Heading1, command: 'formatBlock', value: 'h1' },
  { label: '二级标题', Icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: '粗体', Icon: Bold, command: 'bold' },
  { label: '斜体', Icon: Italic, command: 'italic' },
  { label: '列表', Icon: List, command: 'insertUnorderedList' },
  { label: '引用', Icon: Quote, command: 'formatBlock', value: 'blockquote' },
] as const

function applyTextFormat(command: string, value?: string) {
  document.execCommand(command, false, value)
}

interface SourcePanelProps {
  value: string
  onChange: (value: string) => void
}

export function SourcePanel({ value, onChange }: SourcePanelProps) {
  return (
    <section className="source-panel" aria-label="原始内容">
      <div className="source-toolbar" aria-label="文本工具">
        {textTools.map(({ label, Icon, command, value }) => (
          <button
            key={label}
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyTextFormat(command, value)}
          ><Icon size={15} /></button>
        ))}
      </div>
      <article
        className="source-editor"
        contentEditable
        role="textbox"
        aria-label="原始文本"
        aria-multiline="true"
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(event) => onChange(event.currentTarget.innerText.replaceAll('\u00a0', ' '))}
      >{value}</article>
    </section>
  )
}

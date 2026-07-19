import { Bold, Heading1, Heading2, Italic, List, Quote } from 'lucide-react'
import { sampleDocument } from '../content/sampleDocument'

const textTools = [
  { label: '一级标题', Icon: Heading1 },
  { label: '二级标题', Icon: Heading2 },
  { label: '粗体', Icon: Bold },
  { label: '斜体', Icon: Italic },
  { label: '列表', Icon: List },
  { label: '引用', Icon: Quote },
] as const

export function SourcePanel() {
  return (
    <section className="source-panel" aria-label="原始内容">
      <div className="source-toolbar" aria-label="文本工具">
        {textTools.map(({ label, Icon }) => (
          <button key={label} aria-label={label} title={label} disabled><Icon size={15} /></button>
        ))}
      </div>
      <article className="source-editor">
        <h1>{sampleDocument.title}</h1>
        <p>{sampleDocument.paragraphs[0]}</p>
        <h2>{sampleDocument.sectionTitle}</h2>
        <p>{sampleDocument.quote}</p>
      </article>
    </section>
  )
}

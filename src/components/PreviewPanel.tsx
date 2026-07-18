import { Minus, Plus } from 'lucide-react'
import { sampleDocument } from '../content/sampleDocument'

export function PreviewPanel() {
  return (
    <section className="preview-panel" aria-label="文档预览">
      <div className="preview-toolbar">
        <span className="preview-toolbar__spacer" />
        <div className="zoom-control">
          <button aria-label="缩小" title="缩小" disabled><Minus size={14} /></button>
          <span className="zoom-track"><i /></span>
          <button aria-label="放大" title="放大" disabled><Plus size={14} /></button>
          <strong>78%</strong>
        </div>
      </div>
      <div className="canvas">
        <article className="paper">
          <div className="paper__kicker">TECHNOLOGY &amp; WORK</div>
          <h1>{sampleDocument.title}</h1>
          <div className="paper__deck">{sampleDocument.deck}</div>
          <h2>{sampleDocument.sectionTitle}</h2>
          <p>{sampleDocument.paragraphs[0]}</p>
          <blockquote>{sampleDocument.quote}</blockquote>
          <p>{sampleDocument.paragraphs[1]}</p>
          <div className="paper__folio"><span>排版台</span><span>01</span></div>
        </article>
      </div>
    </section>
  )
}

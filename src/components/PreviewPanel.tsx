import type { CSSProperties } from 'react'
import { Minus, Plus } from 'lucide-react'
import { sampleDocument } from '../content/sampleDocument'
import { fonts, type DocumentSettings, type LayoutPhase } from '../workbench'

interface PreviewPanelProps {
  settings: DocumentSettings
  phase: LayoutPhase
  onZoomChange: (zoom: number) => void
}

type PaperStyle = CSSProperties & {
  '--accent': string
  '--body-font': string
  '--body-size': string
  '--body-leading': number
  '--paper-scale': number
  '--zoom-progress': string
}

export function PreviewPanel({ settings, phase, onZoomChange }: PreviewPanelProps) {
  const font = fonts.find((item) => item.id === settings.font) ?? fonts[0]
  const style: PaperStyle = {
    '--accent': settings.accent,
    '--body-font': font.css,
    '--body-size': `${settings.fontSize}px`,
    '--body-leading': settings.lineHeight,
    '--paper-scale': settings.zoom / 78,
    '--zoom-progress': `${((settings.zoom - 60) / 36) * 100}%`,
  }

  return (
    <section className="preview-panel" aria-label="文档预览" style={style}>
      <div className="preview-toolbar">
        <span className="preview-toolbar__spacer" />
        <div className="zoom-control">
          <button aria-label="缩小" title="缩小" onClick={() => onZoomChange(Math.max(60, settings.zoom - 6))} disabled={settings.zoom <= 60}><Minus size={14} /></button>
          <span className="zoom-track"><i /></span>
          <button aria-label="放大" title="放大" onClick={() => onZoomChange(Math.min(96, settings.zoom + 6))} disabled={settings.zoom >= 96}><Plus size={14} /></button>
          <strong>{settings.zoom}%</strong>
        </div>
      </div>
      <div className="canvas">
        <article className={`paper paper--${settings.template}${phase === 'running' ? ' is-formatting' : ''}${phase === 'done' ? ' is-complete' : ''}`}>
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

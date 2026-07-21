import type { CSSProperties } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { LayoutDocument } from '../document/types'
import { DocumentRenderer } from './DocumentRenderer'
import type { DocumentSettings, LayoutPhase } from '../workbench'

interface PreviewPanelProps {
  document: LayoutDocument
  settings: DocumentSettings
  phase: LayoutPhase
  onZoomChange: (zoom: number) => void
}

type PaperStyle = CSSProperties & {
  '--accent': string
  '--paper-scale': number
  '--zoom-progress': string
}

export function PreviewPanel({ document, settings, phase, onZoomChange }: PreviewPanelProps) {
  const style: PaperStyle = {
    '--accent': settings.accent,
    '--paper-scale': settings.zoom / 100,
    '--zoom-progress': `${((settings.zoom - 70) / 60) * 100}%`,
  }

  return (
    <section className="preview-panel" aria-label="文档预览" style={style}>
      <div className="preview-toolbar">
        <span className="preview-toolbar__spacer" />
        <div className="zoom-control">
          <button aria-label="缩小" title="缩小" onClick={() => onZoomChange(Math.max(70, settings.zoom - 10))} disabled={settings.zoom <= 70}><Minus size={14} /></button>
          <span className="zoom-track"><i /></span>
          <button aria-label="放大" title="放大" onClick={() => onZoomChange(Math.min(130, settings.zoom + 10))} disabled={settings.zoom >= 130}><Plus size={14} /></button>
          <strong>{settings.zoom}%</strong>
        </div>
      </div>
      <div className="canvas">
        <article className={`paper${phase === 'running' ? ' is-formatting' : ''}${phase === 'done' ? ' is-complete' : ''}`}>
          <DocumentRenderer document={document} />
          <div className="paper__folio"><span>排版台</span><span>01</span></div>
        </article>
      </div>
    </section>
  )
}

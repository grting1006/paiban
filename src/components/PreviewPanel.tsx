import { useLayoutEffect, useState, type CSSProperties, type Ref } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { LayoutDocument } from '../document/types'
import { DocumentRenderer } from './DocumentRenderer'
import { measurePaperPageSegments, type PageSegment } from '../services/pdfExport'
import type { DocumentSettings, LayoutPhase } from '../workbench'

interface PreviewPanelProps {
  document: LayoutDocument
  settings: DocumentSettings
  phase: LayoutPhase
  paperRef?: Ref<HTMLElement>
  onPageCountChange: (pageCount: number) => void
  onZoomChange: (zoom: number) => void
}

type PaperStyle = CSSProperties & {
  '--accent': string
  '--paper-scale': number
  '--zoom-progress': string
}

export function PreviewPanel({ document, settings, phase, paperRef, onPageCountChange, onZoomChange }: PreviewPanelProps) {
  const [segments, setSegments] = useState<PageSegment[]>([{ start: 0, end: 510 }])
  const style: PaperStyle = {
    '--accent': settings.accent,
    '--paper-scale': settings.zoom / 100,
    '--zoom-progress': `${((settings.zoom - 70) / 60) * 100}%`,
  }

  useLayoutEffect(() => {
    let cancelled = false
    const measure = async () => {
      await globalThis.document.fonts?.ready
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const paper = globalThis.document.querySelector<HTMLElement>('.paper--page')
      if (!paper || cancelled) return
      const nextSegments = measurePaperPageSegments(paper)
      if (cancelled) return
      setSegments(nextSegments)
      onPageCountChange(nextSegments.length)
    }
    void measure()
    return () => { cancelled = true }
  }, [document, onPageCountChange])

  const paperClassName = `paper paper--page${phase === 'running' ? ' is-formatting' : ''}${phase === 'done' ? ' is-complete' : ''}`

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
        <div className="paper-stack">
          {segments.map((segment, index) => (
            <article ref={index === 0 ? paperRef : undefined} className={paperClassName} aria-hidden={index > 0 || undefined} key={`${segment.start}-${segment.end}`}>
              <div className="paper__page-window">
                <div className="paper__page-segment" style={{ height: segment.end - segment.start }}>
                  <div className="paper__page-flow" style={{ transform: `translateY(-${segment.start}px)` }}>
                    <DocumentRenderer document={document} />
                  </div>
                </div>
              </div>
              <div className="paper__folio"><span>排版台</span><span>{String(index + 1).padStart(2, '0')}</span></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

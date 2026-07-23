import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { InspectorPanel } from './components/InspectorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { SourcePanel } from './components/SourcePanel'
import { StatusBar } from './components/StatusBar'
import { sampleDocument, sampleSourceText } from './content/sampleDocument'
import { useHistoryState } from './hooks/useHistoryState'
import { requestLayout } from './services/layoutApi'
import { downloadPaperAsPdf } from './services/pdfExport'
import { initialSettings, type DocumentSettings, type LayoutPhase } from './workbench'

export default function App() {
  const { state: settings, setState: setSettings, undo, redo, canUndo, canRedo } = useHistoryState(initialSettings)
  const [document, setDocument] = useState(sampleDocument)
  const [sourceText, setSourceText] = useState(sampleSourceText)
  const [layoutPhase, setLayoutPhase] = useState<LayoutPhase>('idle')
  const [isExporting, setIsExporting] = useState(false)
  const [exportPageCount, setExportPageCount] = useState(1)
  const timers = useRef<number[]>([])
  const activeRequest = useRef<AbortController | null>(null)
  const paperRef = useRef<HTMLElement>(null)

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    activeRequest.current?.abort()
  }, [])

  const updateSettings = useCallback((patch: Partial<DocumentSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [setSettings])

  const startLayout = useCallback(async () => {
    if (layoutPhase === 'running' || !sourceText.trim()) return
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setLayoutPhase('running')

    try {
      const nextDocument = await requestLayout(sourceText, controller.signal)
      if (controller.signal.aborted) return
      setDocument(nextDocument)
      setExportPageCount(1)
      setLayoutPhase('done')
      timers.current.push(window.setTimeout(() => setLayoutPhase('idle'), 1400))
    } catch {
      if (!controller.signal.aborted) setLayoutPhase('error')
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [layoutPhase, sourceText])

  const exportPdf = useCallback(async () => {
    if (isExporting || !paperRef.current) return
    setIsExporting(true)
    try {
      setExportPageCount(await downloadPaperAsPdf(paperRef.current))
    } finally {
      setIsExporting(false)
    }
  }, [isExporting])

  return (
    <div className="workbench" data-testid="workbench-shell" data-layout-phase={layoutPhase}>
      <AppHeader
        phase={layoutPhase}
        canStartLayout={Boolean(sourceText.trim())}
        canUndo={canUndo}
        canRedo={canRedo}
        isExporting={isExporting}
        onStartLayout={startLayout}
        onUndo={undo}
        onRedo={redo}
        onExport={exportPdf}
      />
      <main className="workbench__main">
        <SourcePanel value={sourceText} onChange={setSourceText} />
        <PreviewPanel document={document} settings={settings} phase={layoutPhase} paperRef={paperRef} onPageCountChange={setExportPageCount} onZoomChange={(zoom) => updateSettings({ zoom })} />
        <InspectorPanel settings={settings} onChange={updateSettings} />
      </main>
      <StatusBar phase={layoutPhase} pageCount={exportPageCount} />
    </div>
  )
}

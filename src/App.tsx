import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { InspectorPanel } from './components/InspectorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { SourcePanel } from './components/SourcePanel'
import { StatusBar } from './components/StatusBar'
import { useHistoryState } from './hooks/useHistoryState'
import { initialSettings, type DocumentSettings, type LayoutPhase } from './workbench'

export default function App() {
  const { state: settings, setState: setSettings, undo, redo, canUndo, canRedo } = useHistoryState(initialSettings)
  const [layoutPhase, setLayoutPhase] = useState<LayoutPhase>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const updateSettings = useCallback((patch: Partial<DocumentSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [setSettings])

  const startLayout = useCallback(() => {
    if (layoutPhase === 'running') return
    setLayoutPhase('running')
    timers.current.push(window.setTimeout(() => {
      updateSettings({ template: 'editorial', font: 'source-serif', fontSize: 10.5, lineHeight: 1.7 })
      setLayoutPhase('done')
      timers.current.push(window.setTimeout(() => setLayoutPhase('idle'), 1400))
    }, 800))
  }, [layoutPhase, updateSettings])

  return (
    <div className="workbench" data-testid="workbench-shell">
      <AppHeader
        phase={layoutPhase}
        canUndo={canUndo}
        canRedo={canRedo}
        onStartLayout={startLayout}
        onUndo={undo}
        onRedo={redo}
        onExport={() => window.print()}
      />
      <main className="workbench__main">
        <SourcePanel />
        <PreviewPanel settings={settings} phase={layoutPhase} onZoomChange={(zoom) => updateSettings({ zoom })} />
        <InspectorPanel settings={settings} onChange={updateSettings} />
      </main>
      <StatusBar phase={layoutPhase} />
    </div>
  )
}

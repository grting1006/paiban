import { AppHeader } from './components/AppHeader'
import { InspectorPanel } from './components/InspectorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { SourcePanel } from './components/SourcePanel'
import { StatusBar } from './components/StatusBar'

export default function App() {
  return (
    <div className="workbench" data-testid="workbench-shell">
      <AppHeader />
      <main className="workbench__main">
        <SourcePanel />
        <PreviewPanel />
        <InspectorPanel />
      </main>
      <StatusBar />
    </div>
  )
}

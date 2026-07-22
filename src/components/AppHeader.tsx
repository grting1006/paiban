import { Check, Download, LoaderCircle, Redo2, Undo2 } from 'lucide-react'
import type { LayoutPhase } from '../workbench'

interface AppHeaderProps {
  phase: LayoutPhase
  canStartLayout: boolean
  canUndo: boolean
  canRedo: boolean
  isExporting: boolean
  onStartLayout: () => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
}

export function AppHeader({ phase, canStartLayout, canUndo, canRedo, isExporting, onStartLayout, onUndo, onRedo, onExport }: AppHeaderProps) {
  const layoutLabel = phase === 'running' ? '排版中' : phase === 'done' ? '已完成' : phase === 'error' ? '重试排版' : '开始排版'

  return (
    <header className="app-header">
      <div className="app-header__logo" aria-hidden="true">排</div>
      <strong className="app-header__product">排版台</strong>
      <button className={`layout-button layout-button--${phase}`} onClick={onStartLayout} disabled={phase === 'running' || !canStartLayout}>
        {phase === 'running' ? <LoaderCircle size={14} /> : phase === 'done' ? <Check size={14} /> : null}
        {layoutLabel}
      </button>
      <span className="app-header__spacer" />
      <button className="icon-button" aria-label="撤销" title="撤销" onClick={onUndo} disabled={!canUndo}><Undo2 size={16} /></button>
      <button className="icon-button" aria-label="重做" title="重做" onClick={onRedo} disabled={!canRedo}><Redo2 size={16} /></button>
      <button className={`command-button command-button--primary${isExporting ? ' command-button--loading' : ''}`} onClick={onExport} disabled={isExporting}>
        {isExporting ? <LoaderCircle size={15} /> : <Download size={15} />}
        {isExporting ? '生成中' : '导出 PDF'}
      </button>
    </header>
  )
}

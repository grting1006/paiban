import type { LayoutPhase } from '../workbench'

export function StatusBar({ phase }: { phase: LayoutPhase }) {
  const label = phase === 'running' ? '正在排版' : phase === 'done' ? '排版完成' : phase === 'error' ? '排版未完成' : '页面已就绪'
  return (
    <footer className="status-bar">
      <span className={`status-bar__ready status-bar__ready--${phase}`}><i />{label}</span><span>A4 · 210 × 297 mm</span><span>1 页</span>
    </footer>
  )
}

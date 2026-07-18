import { Download, Redo2, Save, Undo2 } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__logo" aria-hidden="true">排</div>
      <strong className="app-header__product">排版台</strong>
      <span className="app-header__document">未命名文档</span>
      <span className="app-header__spacer" />
      <button className="icon-button" aria-label="撤销" title="撤销" disabled><Undo2 size={16} /></button>
      <button className="icon-button" aria-label="重做" title="重做" disabled><Redo2 size={16} /></button>
      <button className="command-button" disabled><Save size={15} />保存草稿</button>
      <button className="command-button command-button--primary" disabled><Download size={15} />导出 PDF</button>
    </header>
  )
}

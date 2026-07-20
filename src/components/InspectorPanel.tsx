import { accentColors, type DocumentSettings } from '../workbench'

interface InspectorPanelProps {
  settings: DocumentSettings
  onChange: (patch: Partial<DocumentSettings>) => void
}

export function InspectorPanel({ settings, onChange }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel" aria-label="排版设置">
      <div className="inspector-title">样式</div>
      <section className="inspector-section">
        <h2>强调色</h2><div className="swatches">{accentColors.map((color) => <button className={settings.accent === color ? 'is-selected' : ''} aria-label={`颜色 ${color}`} aria-pressed={settings.accent === color} style={{ backgroundColor: color }} key={color} onClick={() => onChange({ accent: color })} />)}</div>
      </section>
    </aside>
  )
}

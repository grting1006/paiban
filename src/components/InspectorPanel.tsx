import { accentColors, fonts, fontSizes, lineHeights, templates, type DocumentSettings, type FontId, type TemplateId } from '../workbench'

interface InspectorPanelProps {
  settings: DocumentSettings
  onChange: (patch: Partial<DocumentSettings>) => void
}

export function InspectorPanel({ settings, onChange }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel" aria-label="排版设置">
      <div className="inspector-title">版式</div>
      <section className="inspector-section">
        <h2>版式模板</h2>
        <div className="template-grid">
          {templates.map(({ id, name }) => (
            <button className={`template-thumb${settings.template === id ? ' template-thumb--selected' : ''}`} aria-label={name} aria-pressed={settings.template === id} key={id} onClick={() => onChange({ template: id as TemplateId })}><i /><i /><i /></button>
          ))}
        </div>
      </section>
      <section className="inspector-section">
        <h2>正文样式</h2>
        <label className="setting-row"><span>字体</span><select value={settings.font} onChange={(event) => onChange({ font: event.target.value as FontId })}>{fonts.map((font) => <option value={font.id} key={font.id}>{font.label}</option>)}</select></label>
        <label className="setting-row"><span>字号</span><select value={settings.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}>{fontSizes.map((size) => <option value={size} key={size}>{size} pt</option>)}</select></label>
        <label className="setting-row"><span>行距</span><select value={settings.lineHeight} onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}>{lineHeights.map((lineHeight) => <option value={lineHeight} key={lineHeight}>{lineHeight} 倍</option>)}</select></label>
      </section>
      <section className="inspector-section">
        <h2>强调色</h2><div className="swatches">{accentColors.map((color) => <button className={settings.accent === color ? 'is-selected' : ''} aria-label={`颜色 ${color}`} aria-pressed={settings.accent === color} style={{ backgroundColor: color }} key={color} onClick={() => onChange({ accent: color })} />)}</div>
      </section>
    </aside>
  )
}

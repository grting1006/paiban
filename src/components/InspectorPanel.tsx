const templates = ['经典', '杂志', '简约'] as const
const colors = ['#147d72', '#df6c55', '#335c81', '#a48645'] as const

export function InspectorPanel() {
  return (
    <aside className="inspector-panel" aria-label="排版设置">
      <div className="inspector-tabs">
        {['版式', '文字', '页面'].map((tab, index) => <button className={index === 0 ? 'is-active' : ''} key={tab} disabled>{tab}</button>)}
      </div>
      <section className="inspector-section">
        <h2>版式模板</h2>
        <div className="template-grid">
          {templates.map((name, index) => (
            <button className={`template-thumb${index === 0 ? ' template-thumb--selected' : ''}`} aria-label={name} key={name} disabled><i /><i /><i /></button>
          ))}
        </div>
      </section>
      <section className="inspector-section">
        <h2>正文样式</h2>
        {[['字体', '思源宋体'], ['字号', '10.5 pt'], ['行距', '1.7 倍']].map(([label, value]) => (
          <div className="setting-row" key={label}><span>{label}</span><button disabled>{value}<span>⌄</span></button></div>
        ))}
      </section>
      <section className="inspector-section">
        <h2>内容密度</h2><div className="density-track"><i /></div><div className="density-labels"><span>舒展</span><span>紧凑</span></div>
      </section>
      <section className="inspector-section">
        <h2>强调色</h2><div className="swatches">{colors.map((color) => <button aria-label={`颜色 ${color}`} style={{ backgroundColor: color }} key={color} disabled />)}</div>
      </section>
    </aside>
  )
}

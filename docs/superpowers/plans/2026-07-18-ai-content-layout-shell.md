# AI Content Layout Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved desktop-only static React interface for the AI content layout workbench, without implementing any product behavior.

**Architecture:** A Vite React single page composes five focused presentational regions: header, source panel, preview canvas, inspector, and status bar. All displayed content comes from local constants; controls are deliberately non-functional and no state, network, persistence, PDF, backend, or responsive layout layer is introduced.

**Tech Stack:** React 19, TypeScript, Vite, Lucide React, CSS, Vitest, Testing Library

---

## File Map

- `package.json`: scripts and minimal runtime/test dependencies.
- `.gitignore`: local dependencies, builds, logs, coverage, and visual-companion artifacts.
- `index.html`: Vite document entry.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration.
- `vite.config.ts`: Vite and Vitest configuration.
- `src/main.tsx`: React bootstrap.
- `src/App.tsx`: composition only; owns no business state.
- `src/content/sampleDocument.ts`: fixed interface and sample-document copy.
- `src/components/AppHeader.tsx`: brand, document name, static commands.
- `src/components/SourcePanel.tsx`: static source editor and AI suggestion panel.
- `src/components/PreviewPanel.tsx`: static canvas and A4 document preview.
- `src/components/InspectorPanel.tsx`: static formatting inspector.
- `src/components/StatusBar.tsx`: fixed document status.
- `src/styles/tokens.css`: approved color and sizing tokens.
- `src/styles/app.css`: desktop workbench layout and component styling.
- `src/test/setup.ts`: Testing Library cleanup and DOM matchers.
- `src/App.test.tsx`: shell structure and non-functional-control contract.

### Task 1: Scaffold the Lightweight React Project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create repository exclusions, package metadata, and scripts**

Use these scripts and dependencies in `package.json`:

```json
{
  "name": "paiban",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Set `.gitignore` to exclude `node_modules/`, `dist/`, `.superpowers/`, `coverage/`, and `*.log`.

- [ ] **Step 2: Create the Vite document and TypeScript configuration**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>排版台</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

Create `tsconfig.json` with references to `tsconfig.app.json` and `tsconfig.node.json`. In `tsconfig.app.json`, set `target` to `ES2022`, `lib` to `ES2022` and `DOM`, `module` to `ESNext`, `moduleResolution` to `Bundler`, `jsx` to `react-jsx`, `strict` and `noEmit` to `true`, and include `src`. In `tsconfig.node.json`, use the same target, module, resolution, strict, and no-emit values and include `vite.config.ts`.

- [ ] **Step 3: Configure Vite and Vitest**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Create the React bootstrap**

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: installation succeeds and creates `package-lock.json` without audit-blocking errors.

- [ ] **Step 6: Commit project scaffolding**

```bash
git add .gitignore package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts src/main.tsx src/test/setup.ts
git commit -m "chore: scaffold static React workbench"
```

### Task 2: Build the Static Semantic Shell Test-First

**Files:**
- Create: `src/App.test.tsx`
- Create: `src/content/sampleDocument.ts`
- Create: `src/App.tsx`
- Create: `src/components/AppHeader.tsx`
- Create: `src/components/SourcePanel.tsx`
- Create: `src/components/PreviewPanel.tsx`
- Create: `src/components/InspectorPanel.tsx`
- Create: `src/components/StatusBar.tsx`

- [ ] **Step 1: Write the failing shell test**

Create `src/App.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import App from './App'

test('renders the complete desktop workbench shell', () => {
  render(<App />)

  expect(screen.getByRole('banner')).toHaveTextContent('排版台')
  expect(screen.getByRole('region', { name: '原始内容' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: '文档预览' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: '排版设置' })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent('A4 · 210 × 297 mm')
})

test('keeps every displayed command non-functional', () => {
  render(<App />)
  const shell = screen.getByTestId('workbench-shell')
  const controls = within(shell).getAllByRole('button')

  expect(controls.length).toBeGreaterThan(8)
  controls.forEach((control) => expect(control).toBeDisabled())
})
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 3: Add fixed content data**

Create `src/content/sampleDocument.ts`:

```ts
export const sampleDocument = {
  title: '人工智能如何改变知识工作的方式',
  deck: '从生成内容到组织信息，AI 正在重新定义内容的生产与呈现。',
  sectionTitle: '从生成内容到组织信息',
  paragraphs: [
    '人工智能不再只是自动化工具，它正在成为知识工作者的协作伙伴。真正影响阅读体验的，不只是文字本身，也包括信息结构、视觉层级与页面节奏。',
    '当内容结构被清晰识别，标题、正文、引语与数据便能进入合适的位置，最终形成稳定、专业并适合分享的页面。',
  ],
  quote: '好的排版让复杂观点更容易被理解，也让内容拥有可以被保存和传播的形态。',
} as const
```

- [ ] **Step 4: Implement the presentational components**

Create `src/components/AppHeader.tsx`:

```tsx
import { Download, Redo2, Save, Undo2 } from 'lucide-react'

export function AppHeader() {
  return <header className="app-header">
    <div className="app-header__logo">排</div><strong>排版台</strong><span className="app-header__document">未命名文档</span><span className="app-header__spacer" />
    <button className="icon-button" aria-label="撤销" disabled><Undo2 size={16} /></button>
    <button className="icon-button" aria-label="重做" disabled><Redo2 size={16} /></button>
    <button className="command-button" disabled><Save size={15} />保存草稿</button>
    <button className="command-button command-button--primary" disabled><Download size={15} />导出 PDF</button>
  </header>
}
```

Create `src/components/SourcePanel.tsx`:

```tsx
import { Sparkles } from 'lucide-react'
import { sampleDocument } from '../content/sampleDocument'

export function SourcePanel() {
  return <section className="source-panel" aria-label="原始内容">
    <div className="panel-heading"><span>原始内容</span><small>1,286 字</small></div>
    <div className="source-toolbar" aria-label="文本工具">
      {['H1', 'H2', 'B', 'I', '列表', '引用'].map((label) => <button key={label} disabled>{label}</button>)}
    </div>
    <article className="source-editor"><h1>{sampleDocument.title}</h1><p>{sampleDocument.paragraphs[0]}</p><h2>{sampleDocument.sectionTitle}</h2><p>{sampleDocument.quote}</p></article>
    <div className="ai-suggestion"><Sparkles size={18} /><span><strong>AI 排版建议</strong><small>识别结构并匹配版式</small></span><button disabled>开始排版</button></div>
  </section>
}
```

Create `src/components/PreviewPanel.tsx`:

```tsx
import { Minus, Plus } from 'lucide-react'
import { sampleDocument } from '../content/sampleDocument'

export function PreviewPanel() {
  return <section className="preview-panel" aria-label="文档预览">
    <div className="preview-toolbar"><button className="is-active" disabled>页面</button><button disabled>大纲</button><span className="preview-toolbar__spacer" /><button aria-label="缩小" disabled><Minus size={14} /></button><span>78%</span><button aria-label="放大" disabled><Plus size={14} /></button></div>
    <div className="canvas"><article className="paper"><div className="paper__kicker">TECHNOLOGY &amp; WORK</div><h1>{sampleDocument.title}</h1><div className="paper__deck">{sampleDocument.deck}</div><h2>{sampleDocument.sectionTitle}</h2><p>{sampleDocument.paragraphs[0]}</p><blockquote>{sampleDocument.quote}</blockquote><p>{sampleDocument.paragraphs[1]}</p><footer className="paper__folio"><span>排版台</span><span>01</span></footer></article></div>
  </section>
}
```

Create `src/components/InspectorPanel.tsx`:

```tsx
const templates = ['经典', '杂志', '简约']
const colors = ['#147d72', '#df6c55', '#335c81', '#a48645']

export function InspectorPanel() {
  return <aside className="inspector-panel" aria-label="排版设置">
    <div className="inspector-tabs">{['版式', '文字', '页面'].map((tab, index) => <button className={index === 0 ? 'is-active' : ''} key={tab} disabled>{tab}</button>)}</div>
    <section className="inspector-section"><h2>版式模板</h2><div className="template-grid">{templates.map((name, index) => <button className={`template-thumb${index === 0 ? ' template-thumb--selected' : ''}`} aria-label={name} key={name} disabled><i /><i /><i /></button>)}</div></section>
    <section className="inspector-section"><h2>正文样式</h2>{[['字体', '思源宋体'], ['字号', '10.5 pt'], ['行距', '1.7 倍']].map(([label, value]) => <div className="setting-row" key={label}><span>{label}</span><button disabled>{value}</button></div>)}</section>
    <section className="inspector-section"><h2>内容密度</h2><div className="density-track"><i /></div><div className="density-labels"><span>舒展</span><span>紧凑</span></div></section>
    <section className="inspector-section"><h2>强调色</h2><div className="swatches">{colors.map((color) => <button aria-label={`颜色 ${color}`} style={{ backgroundColor: color }} key={color} disabled />)}</div></section>
  </aside>
}
```

Create `src/components/StatusBar.tsx`:

```tsx
export function StatusBar() {
  return <footer className="status-bar"><span className="status-bar__ready">● 页面已就绪</span><span>A4 · 210 × 297 mm</span><span>1 页</span><span className="status-bar__spacer" /><span>自动保存于刚刚</span></footer>
}
```

Create `src/App.tsx`:

```tsx
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
```

- [ ] **Step 5: Run the semantic shell tests**

Run: `npm test -- src/App.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the static component structure**

```bash
git add src/App.tsx src/App.test.tsx src/content src/components
git commit -m "feat: add static content layout workbench"
```

### Task 3: Apply the Approved Desktop Visual System

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add a failing desktop-layout contract test**

Append to `src/App.test.tsx`:

```tsx
import { readFileSync } from 'node:fs'

test('locks the approved desktop-only three-column layout', () => {
  const styles = readFileSync(new URL('./styles/app.css', import.meta.url), 'utf8')

  expect(styles).toContain('grid-template-columns: minmax(300px, 31%) minmax(560px, 1fr) 250px')
  expect(styles).toContain('min-width: 1180px')
  expect(styles).not.toContain('@media')
})
```

- [ ] **Step 2: Run the test and confirm layout hooks are missing**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `src/styles/app.css` does not exist.

- [ ] **Step 3: Define exact design tokens**

Create `src/styles/tokens.css`:

```css
:root {
  color: #1f2933;
  background: #eef1f2;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --ink: #1f2933;
  --muted: #66727f;
  --subtle: #8a959e;
  --line: #dce1e5;
  --shell: #eef1f2;
  --paper: #ffffff;
  --teal: #147d72;
  --teal-soft: #e4f3f0;
  --coral: #df6c55;
  --coral-soft: #fff5f2;
  --radius-sm: 4px;
  --radius-md: 7px;
  --header-height: 56px;
  --status-height: 34px;
}

* { box-sizing: border-box; }
html, body, #root { min-width: 1180px; min-height: 720px; margin: 0; }
button, select { font: inherit; }
button:disabled { opacity: 1; cursor: default; }
```

- [ ] **Step 4: Implement the desktop-only layout stylesheet**

Create `src/styles/app.css` with these fixed layout rules and no media queries:

```css
.workbench { min-height: 100vh; display: grid; grid-template-rows: var(--header-height) minmax(630px, 1fr) var(--status-height); background: var(--shell); }
.workbench__main { min-width: 1180px; display: grid; grid-template-columns: minmax(300px, 31%) minmax(560px, 1fr) 250px; overflow: hidden; }
.app-header { display: flex; align-items: center; gap: 12px; padding: 0 18px; background: var(--paper); border-bottom: 1px solid var(--line); }
.app-header__logo { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 6px; background: var(--ink); color: white; font-family: "Songti SC", serif; font-weight: 700; }
.app-header__spacer { flex: 1; }
.icon-button { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--muted); }
.command-button { height: 34px; display: inline-flex; align-items: center; gap: 7px; padding: 0 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: white; color: var(--ink); font-size: 12px; font-weight: 600; }
.command-button--primary { border-color: var(--teal); background: var(--teal); color: white; }
.source-panel, .inspector-panel { background: var(--paper); }
.source-panel { display: flex; flex-direction: column; border-right: 1px solid var(--line); }
.preview-panel { display: flex; min-width: 0; flex-direction: column; }
.inspector-panel { border-left: 1px solid var(--line); }
.panel-heading { height: 46px; display: flex; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--line); font-size: 12px; font-weight: 700; }
.source-toolbar { height: 38px; display: flex; align-items: center; gap: 3px; padding: 0 10px; border-bottom: 1px solid #e8ebed; }
.source-editor { flex: 1; overflow: hidden; padding: 24px; font-family: Georgia, "Songti SC", serif; color: #4e5b65; line-height: 1.85; }
.source-editor h1 { margin: 0 0 16px; color: var(--ink); font-size: 24px; line-height: 1.35; letter-spacing: 0; }
.ai-suggestion { margin: 0 12px 12px; display: flex; align-items: center; gap: 9px; padding: 10px; border: 1px solid #f0c7bd; border-radius: 6px; background: var(--coral-soft); color: #934936; }
.preview-toolbar { height: 46px; display: flex; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--line); background: #f8f9fa; }
.canvas { flex: 1; display: flex; justify-content: center; overflow: hidden; padding: 28px 44px; background-color: #e9edef; background-image: linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px); background-size: 18px 18px; }
.paper { width: 420px; aspect-ratio: 210 / 297; align-self: flex-start; padding: 52px 48px 40px; background: var(--paper); box-shadow: 0 8px 28px rgba(31,41,51,.18); color: #26333b; font-family: Georgia, "Songti SC", serif; }
.paper h1 { margin: 0 0 13px; font-size: 28px; line-height: 1.35; letter-spacing: 0; }
.paper__deck { padding-bottom: 18px; border-bottom: 2px solid var(--ink); color: #77828a; font-size: 12px; line-height: 1.6; }
.paper p { color: #4d5961; font-size: 10px; line-height: 1.85; text-align: justify; }
.paper blockquote { margin: 18px 0; padding: 12px 14px; border-left: 3px solid var(--coral); background: var(--coral-soft); color: #77473d; font-size: 11px; line-height: 1.65; }
.inspector-tabs { height: 46px; display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--line); }
.inspector-section { padding: 15px; border-bottom: 1px solid #e7eaec; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.template-thumb { height: 66px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #f8f9f9; }
.template-thumb--selected { border: 2px solid var(--teal); background: var(--teal-soft); }
.status-bar { display: flex; align-items: center; gap: 18px; padding: 0 14px; border-top: 1px solid var(--line); background: var(--paper); color: var(--muted); font-size: 11px; }
.status-bar__ready { color: var(--teal); font-weight: 700; }
.status-bar__spacer { flex: 1; }
```

Append these component-detail rules to `src/styles/app.css`:

```css
.app-header__document { padding-left: 12px; border-left: 1px solid var(--line); color: var(--muted); font-size: 12px; }
.panel-heading small { margin-left: auto; color: var(--subtle); font-weight: 400; }
.source-toolbar button, .preview-toolbar button, .inspector-tabs button { border: 0; background: transparent; color: var(--muted); font-size: 11px; }
.source-toolbar button { min-width: 28px; height: 26px; border-radius: var(--radius-sm); }
.source-editor h2 { margin: 20px 0 8px; color: var(--ink); font-size: 15px; letter-spacing: 0; }
.source-editor p { margin: 0 0 10px; font-size: 13px; }
.ai-suggestion span { display: grid; gap: 2px; }
.ai-suggestion small { font-size: 10px; }
.ai-suggestion button { margin-left: auto; height: 28px; padding: 0 9px; border: 0; border-radius: var(--radius-sm); background: var(--coral); color: white; font-size: 11px; font-weight: 700; }
.preview-toolbar .is-active { height: 27px; padding: 0 10px; border-radius: var(--radius-sm); background: white; box-shadow: 0 1px 3px rgba(31,41,51,.12); color: var(--ink); font-weight: 700; }
.preview-toolbar__spacer { flex: 1; }
.paper__kicker { margin-bottom: 11px; color: var(--teal); font-family: ui-sans-serif, system-ui, sans-serif; font-size: 8px; font-weight: 800; }
.paper h2 { margin: 20px 0 9px; font-size: 14px; letter-spacing: 0; }
.paper__folio { display: flex; justify-content: space-between; margin-top: 20px; color: var(--subtle); font-family: ui-sans-serif, system-ui, sans-serif; font-size: 8px; }
.inspector-tabs button.is-active { border-bottom: 2px solid var(--teal); color: var(--teal); font-weight: 700; }
.inspector-section h2 { margin: 0 0 11px; font-size: 11px; letter-spacing: 0; }
.template-thumb { padding: 9px; }
.template-thumb i { display: block; height: 2px; margin-bottom: 5px; background: #9da6ac; }
.setting-row { display: grid; grid-template-columns: 1fr 92px; align-items: center; gap: 8px; margin-top: 9px; color: var(--muted); font-size: 11px; }
.setting-row button { height: 29px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: white; color: var(--ink); font-size: 11px; }
.density-track { height: 3px; margin: 15px 3px 10px; border-radius: 2px; background: #d9dfe2; }
.density-track i { display: block; width: 11px; height: 11px; margin-left: 56%; transform: translateY(-4px); border-radius: 50%; background: var(--teal); }
.density-labels { display: flex; justify-content: space-between; color: var(--subtle); font-size: 10px; }
.swatches { display: flex; gap: 9px; }
.swatches button { width: 22px; height: 22px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 1px #cbd1d6; }
```

- [ ] **Step 5: Run component tests and production build**

Run: `npm test`

Expected: 3 tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite complete successfully and write `dist/`.

- [ ] **Step 6: Commit the approved visual system**

```bash
git add src/styles src/components src/App.test.tsx
git commit -m "style: apply approved desktop workbench design"
```

### Task 4: Browser Fidelity Verification

**Files:**
- Create temporarily, then remove: browser screenshots used for QA
- Modify only if mismatches are found: `src/styles/app.css`, `src/components/*.tsx`

- [ ] **Step 1: Start the development server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL and stays running.

- [ ] **Step 2: Capture the accepted concept**

Open the accepted visual companion at `http://localhost:53310` while it is still available and capture the refined A workbench at its native browser size. Save the concept screenshot outside the tracked source tree.

- [ ] **Step 3: Inspect the implementation at desktop sizes**

Use the in-app browser at 1280×800, 1440×900, and 1600×900. Confirm the header, three columns, centered A4 page, inspector, and status bar remain visible with no overlap. No mobile viewport is required.

- [ ] **Step 4: Compare concept and implementation directly**

Use `view_image` on the accepted concept screenshot and the latest implementation screenshot in the same QA pass. Record and fix mismatches for:

1. visible copy and command order;
2. three-column proportions and A4 placement;
3. graphite, teal, coral, white, and fog-gray palette;
4. editor, preview, and inspector typography;
5. borders, radii, spacing, and control density;
6. icon metaphor, stroke weight, size, and alignment.

- [ ] **Step 5: Verify the deliberate non-functional contract**

Inspect every visible command. Confirm native controls are disabled, no network requests occur, and no local storage, file download, state mutation, or navigation is triggered.

- [ ] **Step 6: Re-run automated verification**

Run: `npm test`

Expected: 3 tests PASS.

Run: `npm run build`

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Remove temporary QA artifacts and commit final corrections**

```bash
git add src
git commit -m "fix: align workbench with approved concept"
```

If the comparison required no source corrections, do not create an empty commit.

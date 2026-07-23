import { expect, test } from 'vitest'
import { hasSourceFidelity } from '../../src/document/normalize'
import { sampleSourceText } from '../../src/content/sampleDocument'
import { buildDeterministicLayoutPlan, buildDocumentFromPlan, type LayoutPlan } from './plan'
import { sourceUnits } from './units'

test('builds a rich document plan without changing the source', () => {
  const units = sourceUnits(sampleSourceText)
  const at = (text: string) => {
    const index = units.findIndex((unit) => unit.source.includes(text))
    if (index === -1) throw new Error(`Missing source unit: ${text}`)
    return index
  }
  const plan: LayoutPlan = {
    blocks: [
      { start: at('# 人工智能'), end: at('# 人工智能'), type: 'heading', level: 1, formats: [] },
      { start: at('## 从生成内容'), end: at('## 从生成内容'), type: 'heading', level: 2, formats: [] },
      {
        start: at('人工智能正在成为'),
        end: at('人工智能正在成为'),
        type: 'paragraph',
        formats: [
          { source: '**协作伙伴**', kind: 'bold', occurrence: 0 },
          { source: '$E = mc^2$', kind: 'math', occurrence: 0 },
        ],
      },
      { start: at('### 信息结构'), end: at('### 信息结构'), type: 'heading', level: 3, formats: [] },
      { start: at('> 好的排版'), end: at('> 好的排版'), type: 'quote', formats: [] },
      { start: at('#### 排版时'), end: at('#### 排版时'), type: 'heading', level: 4, formats: [] },
      { start: at('- 原始文字'), end: at('- 数学公式'), type: 'list', ordered: false, formats: [] },
      { start: at('##### 进一步说明'), end: at('##### 进一步说明'), type: 'heading', level: 5, formats: [] },
      { start: at('$$\\int'), end: at('$$\\int'), type: 'math', formats: [] },
    ],
  }

  const document = buildDocumentFromPlan(sampleSourceText, plan)
  const paragraph = document.blocks[2]

  expect(hasSourceFidelity(document)).toBe(true)
  expect(paragraph.type).toBe('paragraph')
  if (paragraph.type === 'paragraph') {
    expect(paragraph.content.some((item) => item.type === 'text' && item.marks?.includes('bold'))).toBe(true)
    expect(paragraph.content.some((item) => item.type === 'math' && item.latex === 'E = mc^2')).toBe(true)
  }

  const list = document.blocks[6]
  expect(list.type).toBe('list')
  if (list.type === 'list') {
    expect(list.items[0].children?.items).toHaveLength(2)
    expect(list.items[0].children?.ordered).toBe(false)
  }
})

test('preserves ordered list nesting and confirmed inline formatting', () => {
  const source = '1. 第一项\n  a) **子项**\n2. 第二项'
  const document = buildDocumentFromPlan(source, {
    blocks: [{
      start: 0,
      end: 2,
      type: 'list',
      ordered: true,
      formats: [{ source: '**子项**', kind: 'bold', occurrence: 0 }],
    }],
  })
  const list = document.blocks[0]

  expect(hasSourceFidelity(document)).toBe(true)
  expect(list.type).toBe('list')
  if (list.type === 'list') {
    expect(list.ordered).toBe(true)
    expect(list.items).toHaveLength(2)
    expect(list.items[0].children?.ordered).toBe(true)
    expect(list.items[0].children?.items).toHaveLength(1)
    expect(list.items[0].children?.items[0].content[0]).toMatchObject({ text: '子项', marks: ['bold'] })
  }
})

test('recognizes unambiguous inline formatting when the model omits it', () => {
  const source = '这是**重点**，也有*斜体*，公式为 $E=mc^2$，价格 $5 and $10 保持原样。'
  const document = buildDocumentFromPlan(source, {
    blocks: [{ start: 0, end: 0, type: 'paragraph', formats: [] }],
  })
  const paragraph = document.blocks[0]

  expect(paragraph.type).toBe('paragraph')
  if (paragraph.type === 'paragraph') {
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '重点', marks: ['bold'] }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '斜体', marks: ['italic'] }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'math', latex: 'E=mc^2' }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '，价格 $5 and $10 保持原样。' }))
  }
})

test('protects explicit tables when the model classifies them as paragraphs', () => {
  const source = '| 序号 | 内容 |\n| --- | --- |\n| 1 | 第一项 |\n| 2 | 第二项 |'
  const document = buildDocumentFromPlan(source, {
    blocks: [{ start: 0, end: 3, type: 'paragraph', formats: [] }],
  })

  expect(hasSourceFidelity(document)).toBe(true)
  expect(document.blocks).toHaveLength(1)
  expect(document.blocks[0]).toMatchObject({ type: 'table' })
  if (document.blocks[0].type === 'table') {
    expect(document.blocks[0].headers).toHaveLength(2)
    expect(document.blocks[0].rows).toHaveLength(2)
  }
})

test('protects fenced code, quotes, and original list markers from model downgrades', () => {
  const source = '```ts\nconst value = 1\n```\n> 第一行引用\n> 第二行引用\n1. 第一项\n3) 第三项'
  const document = buildDocumentFromPlan(source, {
    blocks: [{ start: 0, end: 6, type: 'paragraph', formats: [] }],
  })

  expect(hasSourceFidelity(document)).toBe(true)
  expect(document.blocks).toMatchObject([
    { type: 'code', language: 'ts' },
    { type: 'quote' },
    { type: 'list', ordered: true, items: [{ marker: '1.' }, { marker: '3)' }] },
  ])
})

test('removes asymmetric bold markers left after a spaced list bullet', () => {
  const source = '* *正向比较**与过度攀比\n* *对立统一关系**。正文保持不变。'
  const document = buildDocumentFromPlan(source, {
    blocks: [{ start: 0, end: 1, type: 'list', ordered: false, formats: [] }],
  })
  const list = document.blocks[0]

  expect(hasSourceFidelity(document)).toBe(true)
  expect(list.type).toBe('list')
  if (list.type === 'list') {
    expect(list.items[0].marker).toBe('*')
    expect(list.items[0].content).toContainEqual(expect.objectContaining({ text: '正向比较', marks: ['bold'] }))
    expect(list.items[1].content).toContainEqual(expect.objectContaining({ text: '对立统一关系', marks: ['bold'] }))
    expect(list.items.flatMap((item) => item.content).filter((item) => item.type === 'text').map((item) => item.text).join('')).not.toContain('*')
  }
})

test('builds semantic ranges without blank lines or formatting markers', () => {
  const source = '年度工作总结\n项目已经进入交付阶段\n核心功能已经完成。\n风险仍需跟踪。'
  const document = buildDocumentFromPlan(source, {
    blocks: [
      { start: 0, end: 0, type: 'heading', level: 1, formats: [] },
      { start: 1, end: 1, type: 'heading', level: 2, formats: [] },
      { start: 2, end: 3, type: 'paragraph', formats: [] },
    ],
  })

  expect(hasSourceFidelity(document)).toBe(true)
  expect(document.blocks).toHaveLength(3)
  expect(document.blocks[0]).toMatchObject({ type: 'heading', level: 1, source: '年度工作总结' })
  expect(document.blocks[1]).toMatchObject({ type: 'heading', level: 2, source: '项目已经进入交付阶段' })
  expect(document.blocks[2]).toMatchObject({ type: 'paragraph', source: '核心功能已经完成。\n风险仍需跟踪。' })
})

test('only creates optional boundaries at source line breaks and colons', () => {
  expect(sourceUnits('第一句。第二句！第三句？')).toMatchObject([
    { index: 0, source: '第一句。第二句！第三句？' },
  ])
  expect(sourceUnits('主题：正文保持在同一段。')).toMatchObject([
    { index: 0, source: '主题：' },
    { index: 1, source: '正文保持在同一段。' },
  ])
  expect(sourceUnits('说明：**术语：定义**保持完整')).toMatchObject([
    { index: 0, source: '说明：' },
    { index: 1, source: '**术语：定义**保持完整' },
  ])
})

test('demotes every heading level when a plan contains multiple document titles', () => {
  const source = '第一部分\n第二部分\n下级主题'
  const document = buildDocumentFromPlan(source, {
    blocks: [
      { start: 0, end: 0, type: 'heading', level: 1, formats: [] },
      { start: 1, end: 1, type: 'heading', level: 1, formats: [] },
      { start: 2, end: 2, type: 'heading', level: 2, formats: [] },
    ],
  })

  expect(document.blocks).toMatchObject([
    { type: 'heading', level: 2 },
    { type: 'heading', level: 2 },
    { type: 'heading', level: 3 },
  ])
})

test('merges adjacent ordered list ranges so numbering does not restart', () => {
  const source = '1. 第一项\n3) 第二项\n五、第三项'
  const document = buildDocumentFromPlan(source, {
    blocks: [
      { start: 0, end: 0, type: 'list', ordered: true, formats: [] },
      { start: 1, end: 1, type: 'list', ordered: true, formats: [] },
      { start: 2, end: 2, type: 'list', ordered: true, formats: [] },
    ],
  })

  expect(hasSourceFidelity(document)).toBe(true)
  expect(document.blocks).toHaveLength(1)
  expect(document.blocks[0]).toMatchObject({
    type: 'list',
    ordered: true,
    items: [{ marker: '1.' }, { marker: '3)' }, { marker: '五、' }],
  })
})

test('keeps an obvious heading hierarchy when AI providers are unavailable', () => {
  const source = '人工智能项目年度总结\n项目背景\n本年度团队围绕知识整理效率开展工作。\n核心成果\n系统已经能够处理常见知识文章。'
  const document = buildDocumentFromPlan(source, buildDeterministicLayoutPlan(source))

  expect(hasSourceFidelity(document)).toBe(true)
  expect(document.blocks).toMatchObject([
    { type: 'heading', level: 1, source: '人工智能项目年度总结' },
    { type: 'heading', level: 2, source: '项目背景' },
    { type: 'paragraph', source: '本年度团队围绕知识整理效率开展工作。' },
    { type: 'heading', level: 2, source: '核心成果' },
    { type: 'paragraph', source: '系统已经能够处理常见知识文章。' },
  ])
})

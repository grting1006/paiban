import { expect, test } from 'vitest'
import { hasSourceFidelity } from '../../src/document/normalize'
import { sampleSourceText } from '../../src/content/sampleDocument'
import { buildDocumentFromPlan, type LayoutPlan } from './plan'

test('builds a rich document plan without changing the source', () => {
  const plan: LayoutPlan = {
    blocks: [
      { index: 0, type: 'heading', level: 1, formats: [] },
      { index: 1, type: 'heading', level: 2, formats: [] },
      {
        index: 2,
        type: 'paragraph',
        formats: [
          { source: '**协作伙伴**', kind: 'bold', occurrence: 0 },
          { source: '$E = mc^2$', kind: 'math', occurrence: 0 },
        ],
      },
      { index: 3, type: 'heading', level: 3, formats: [] },
      { index: 4, type: 'quote', formats: [] },
      { index: 5, type: 'heading', level: 4, formats: [] },
      { index: 6, type: 'list', ordered: false, formats: [] },
      { index: 7, type: 'heading', level: 5, formats: [] },
      { index: 8, type: 'math', formats: [] },
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
      index: 0,
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
  const source = '这是**重点**，公式为 $E=mc^2$，价格 $5 and $10 保持原样。'
  const document = buildDocumentFromPlan(source, {
    blocks: [{ index: 0, type: 'paragraph', formats: [] }],
  })
  const paragraph = document.blocks[0]

  expect(paragraph.type).toBe('paragraph')
  if (paragraph.type === 'paragraph') {
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '重点', marks: ['bold'] }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'math', latex: 'E=mc^2' }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '，价格 $5 and $10 保持原样。' }))
  }
})

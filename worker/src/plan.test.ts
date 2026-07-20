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
      { index: 7, type: 'math', formats: [] },
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
})

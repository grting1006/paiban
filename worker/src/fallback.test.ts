import { expect, test, vi } from 'vitest'
import { sampleDocument } from '../../src/content/sampleDocument'
import { createLayoutDocumentWithFallback } from './fallback'
import { LayoutGenerationError } from './generation'

test('uses the OpenRouter free fallback only after Zhipu fails', async () => {
  const zhipu = vi.fn().mockRejectedValue(new LayoutGenerationError('upstream_timeout'))
  const openRouter = vi.fn().mockResolvedValue(sampleDocument)

  const document = await createLayoutDocumentWithFallback('原文', {
    zhipu: 'zhipu-key',
    openRouter: 'openrouter-key',
  }, { zhipu, openRouter })

  expect(document).toBe(sampleDocument)
  expect(zhipu).toHaveBeenCalledWith('原文', 'zhipu-key')
  expect(openRouter).toHaveBeenCalledWith('原文', 'openrouter-key')
})

test('does not call OpenRouter when Zhipu succeeds', async () => {
  const zhipu = vi.fn().mockResolvedValue(sampleDocument)
  const openRouter = vi.fn()

  await createLayoutDocumentWithFallback('原文', {
    zhipu: 'zhipu-key',
    openRouter: 'openrouter-key',
  }, { zhipu, openRouter })

  expect(openRouter).not.toHaveBeenCalled()
})

test('uses deterministic formatting when both AI providers fail', async () => {
  const document = await createLayoutDocumentWithFallback('# 标题\n\n这是**重点**，公式为 $E=mc^2$。', {
    zhipu: 'zhipu-key',
    openRouter: 'openrouter-key',
  }, {
    zhipu: vi.fn().mockRejectedValue(new LayoutGenerationError('upstream_timeout')),
    openRouter: vi.fn().mockRejectedValue(new LayoutGenerationError('openrouter_upstream_429')),
  })

  expect(document.blocks[0]).toMatchObject({ type: 'heading', level: 1 })
  expect(document.blocks[1]).toMatchObject({ type: 'paragraph' })
  const paragraph = document.blocks[1]
  if (paragraph.type === 'paragraph') {
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'text', text: '重点', marks: ['bold'] }))
    expect(paragraph.content).toContainEqual(expect.objectContaining({ type: 'math', latex: 'E=mc^2' }))
  }
})

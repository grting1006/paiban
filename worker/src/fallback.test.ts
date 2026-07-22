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

import type { LayoutDocument } from '../../src/document/types'
import { errorCode, LayoutGenerationError } from './generation'
import { createOpenRouterLayoutDocument } from './openrouter'
import { createZhipuLayoutDocument } from './zhipu'

interface ProviderClients {
  zhipu: (sourceText: string, apiKey: string) => Promise<LayoutDocument>
  openRouter: (sourceText: string, apiKey: string) => Promise<LayoutDocument>
}

interface ProviderKeys {
  zhipu?: string
  openRouter?: string
}

const defaultClients: ProviderClients = {
  zhipu: createZhipuLayoutDocument,
  openRouter: createOpenRouterLayoutDocument,
}

export async function createLayoutDocumentWithFallback(
  sourceText: string,
  keys: ProviderKeys,
  clients: ProviderClients = defaultClients,
) {
  let lastError: unknown

  if (keys.zhipu) {
    try {
      return await clients.zhipu(sourceText, keys.zhipu)
    } catch (error) {
      lastError = error
      console.warn('Zhipu layout generation failed; trying fallback', errorCode(error))
    }
  }

  if (keys.openRouter) {
    try {
      return await clients.openRouter(sourceText, keys.openRouter)
    } catch (error) {
      lastError = error
      console.warn('OpenRouter free fallback generation failed', errorCode(error))
    }
  }

  if (lastError) throw lastError
  throw new LayoutGenerationError('service_not_configured')
}

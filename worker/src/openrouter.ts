import { buildDocumentFromModelContent, LayoutGenerationError } from './generation'
import { buildUserPrompt, systemPrompt } from './prompt'

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const FREE_MODEL_ROUTER = 'openrouter/free'

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    code?: string | number
  }
}

export async function createOpenRouterLayoutDocument(sourceText: string, apiKey: string) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://grting1006.github.io/paiban/',
      'X-Title': 'Paiban',
    },
    body: JSON.stringify({
      model: FREE_MODEL_ROUTER,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserPrompt(sourceText) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(20_000),
  })

  const payload = await response.json().catch(() => null) as OpenRouterResponse | null
  if (!response.ok) {
    const providerCode = payload?.error?.code
    const suffix = providerCode === undefined ? '' : `_${String(providerCode).replace(/[^a-zA-Z0-9_-]/g, '')}`
    throw new LayoutGenerationError(`openrouter_upstream_${response.status}${suffix}`)
  }

  const content = payload?.choices?.[0]?.message?.content
  if (!content) throw new LayoutGenerationError('openrouter_missing_content')
  return buildDocumentFromModelContent(sourceText, content)
}

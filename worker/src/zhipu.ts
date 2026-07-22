import { buildDocumentFromModelContent, LayoutGenerationError } from './generation'
import { buildUserPrompt, systemPrompt } from './prompt'

const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const ZHIPU_MODEL = 'glm-4.7-flash'

interface ZhipuResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

interface ZhipuErrorResponse {
  error?: {
    code?: string | number
  }
  code?: string | number
}

async function requestPlan(sourceText: string, apiKey: string) {
  const response = await fetch(ZHIPU_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ZHIPU_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserPrompt(sourceText) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (response.ok) return response
  const payload = await response.json().catch(() => null) as ZhipuErrorResponse | null
  const providerCode = payload?.error?.code ?? payload?.code
  const code = providerCode === undefined ? `upstream_${response.status}` : `upstream_${response.status}_${String(providerCode).replace(/[^a-zA-Z0-9_-]/g, '')}`
  throw new LayoutGenerationError(code)
}

export async function createZhipuLayoutDocument(sourceText: string, apiKey: string) {
  const response = await requestPlan(sourceText, apiKey)
  const payload = await response.json() as ZhipuResponse
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new LayoutGenerationError('missing_content')

  return buildDocumentFromModelContent(sourceText, content)
}

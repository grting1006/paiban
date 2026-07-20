import { hasSourceFidelity } from '../../src/document/normalize'
import { parseLayoutDocument } from '../../src/document/schema'
import type { LayoutDocument } from '../../src/document/types'
import { buildDocumentFromPlan, layoutPlanSchema } from './plan'
import { buildUserPrompt, systemPrompt } from './prompt'

const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MODEL_FALLBACKS = ['glm-4.7-flash', 'glm-4-flash-250414'] as const

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

export class LayoutGenerationError extends Error {
  constructor(public readonly code: string) {
    super(code)
  }
}

async function requestPlan(sourceText: string, apiKey: string) {
  for (const model of MODEL_FALLBACKS) {
    let response: Response
    try {
      response = await fetch(ZHIPU_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: buildUserPrompt(sourceText) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(35_000),
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError' && model !== MODEL_FALLBACKS.at(-1)) continue
      throw error
    }

    if (response.ok) return response
    const payload = await response.json().catch(() => null) as ZhipuErrorResponse | null
    const providerCode = payload?.error?.code ?? payload?.code
    const code = providerCode === undefined ? `upstream_${response.status}` : `upstream_${response.status}_${String(providerCode).replace(/[^a-zA-Z0-9_-]/g, '')}`
    if (response.status !== 429) throw new LayoutGenerationError(code)
    if (model === MODEL_FALLBACKS.at(-1)) throw new LayoutGenerationError(code)
  }
  throw new LayoutGenerationError('upstream_429')
}

export async function createLayoutDocument(sourceText: string, apiKey: string): Promise<LayoutDocument> {
  const response = await requestPlan(sourceText, apiKey)
  const payload = await response.json() as ZhipuResponse
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new LayoutGenerationError('missing_content')

  let input: unknown
  try {
    input = JSON.parse(content)
  } catch {
    throw new LayoutGenerationError('invalid_json')
  }

  const planResult = layoutPlanSchema.safeParse(input)
  if (!planResult.success) {
    const issue = planResult.error.issues[0]
    const path = issue?.path.join('_').replace(/[^a-zA-Z0-9_-]/g, '') || 'root'
    throw new LayoutGenerationError(`invalid_plan_${path}_${issue?.code ?? 'unknown'}`)
  }

  let document: LayoutDocument
  try {
    document = parseLayoutDocument(buildDocumentFromPlan(sourceText, planResult.data))
  } catch {
    throw new LayoutGenerationError('invalid_document')
  }
  if (document.sourceText !== sourceText || !hasSourceFidelity(document)) {
    throw new LayoutGenerationError('source_mismatch')
  }

  return document
}

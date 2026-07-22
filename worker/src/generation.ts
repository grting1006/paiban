import { hasSourceFidelity } from '../../src/document/normalize'
import { parseLayoutDocument } from '../../src/document/schema'
import type { LayoutDocument } from '../../src/document/types'
import { buildDocumentFromPlan, layoutPlanSchema } from './plan'

export class LayoutGenerationError extends Error {
  constructor(public readonly code: string) {
    super(code)
  }
}

export function errorCode(error: unknown) {
  if (error instanceof LayoutGenerationError) return error.code
  if (error instanceof Error && error.name === 'TimeoutError') return 'upstream_timeout'
  return 'unknown'
}

export function buildDocumentFromModelContent(sourceText: string, content: string): LayoutDocument {
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

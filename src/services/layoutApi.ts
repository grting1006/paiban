import { hasSourceFidelity } from '../document/normalize'
import type { LayoutDocument } from '../document/types'

const layoutApiUrl = import.meta.env.VITE_LAYOUT_API_URL ?? 'https://paiban-layout-api.grting1006.workers.dev/api/layout'

export async function requestLayout(sourceText: string, signal?: AbortSignal): Promise<LayoutDocument> {
  const response = await fetch(layoutApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceText }),
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { code?: string } | null
    console.error('Layout request failed', payload?.code ?? response.status)
    throw new Error('排版服务暂时不可用')
  }

  const { parseLayoutDocument } = await import('../document/schema')
  const document = parseLayoutDocument(await response.json())
  if (!hasSourceFidelity(document) || document.sourceText !== sourceText) {
    throw new Error('排版结果未通过原文校验')
  }

  return document
}

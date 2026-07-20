import { z } from 'zod'
import { documentSourceText, preserveUncertainFormatting } from '../../src/document/normalize'
import type { DocumentBlock, InlineContent, InlineMark, LayoutDocument } from '../../src/document/types'

const formatDecisionSchema = z.object({
  source: z.string().min(2),
  kind: z.enum(['bold', 'italic', 'strikethrough', 'code', 'math']),
  occurrence: z.number().int().nonnegative().default(0),
}).strict()

const blockPlanSchema = z.object({
  index: z.number().int().nonnegative(),
  type: z.enum(['heading', 'paragraph', 'quote', 'list', 'code', 'math', 'table', 'callout', 'divider']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  ordered: z.boolean().optional(),
  tone: z.enum(['note', 'important']).optional(),
  language: z.string().optional(),
  formats: z.array(formatDecisionSchema).default([]),
}).strict()

export const layoutPlanSchema = z.object({
  blocks: z.array(blockPlanSchema),
}).strict()

export type LayoutPlan = z.infer<typeof layoutPlanSchema>
type FormatDecision = z.infer<typeof formatDecisionSchema>

function nthIndexOf(value: string, search: string, occurrence: number) {
  let index = -1
  for (let count = 0; count <= occurrence; count += 1) {
    index = value.indexOf(search, index + 1)
    if (index === -1) return -1
  }
  return index
}

function recognizedContent(decision: FormatDecision): { text: string; marks?: InlineMark[]; latex?: string } | null {
  const source = decision.source
  if (decision.kind === 'bold' && source.startsWith('**') && source.endsWith('**') && source.length > 4) {
    return { text: source.slice(2, -2), marks: ['bold'] }
  }
  if (decision.kind === 'italic' && source.startsWith('*') && source.endsWith('*') && !source.startsWith('**') && source.length > 2) {
    return { text: source.slice(1, -1), marks: ['italic'] }
  }
  if (decision.kind === 'strikethrough' && source.startsWith('~~') && source.endsWith('~~') && source.length > 4) {
    return { text: source.slice(2, -2), marks: ['strikethrough'] }
  }
  if (decision.kind === 'code' && source.startsWith('`') && source.endsWith('`') && source.length > 2) {
    return { text: source.slice(1, -1), marks: ['code'] }
  }
  if (decision.kind === 'math' && source.startsWith('$') && source.endsWith('$') && !source.startsWith('$$') && source.length > 2) {
    return { text: '', latex: source.slice(1, -1) }
  }
  if (decision.kind === 'math' && source.startsWith('\\(') && source.endsWith('\\)') && source.length > 4) {
    return { text: '', latex: source.slice(2, -2) }
  }
  return null
}

function inlineContent(source: string, decisions: FormatDecision[]): InlineContent[] {
  const ranges = decisions.flatMap((decision) => {
    const content = recognizedContent(decision)
    const start = content ? nthIndexOf(source, decision.source, decision.occurrence) : -1
    return start === -1 || !content ? [] : [{ start, end: start + decision.source.length, decision, content }]
  }).sort((left, right) => left.start - right.start)

  const output: InlineContent[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor) continue
    if (range.start > cursor) output.push(...preserveUncertainFormatting(source.slice(cursor, range.start)))
    if (range.content.latex !== undefined) {
      output.push({ type: 'math', latex: range.content.latex, source: range.decision.source })
    } else {
      output.push({ type: 'text', text: range.content.text, source: range.decision.source, marks: range.content.marks })
    }
    cursor = range.end
  }
  if (cursor < source.length) output.push(...preserveUncertainFormatting(source.slice(cursor)))
  return output.length ? output : preserveUncertainFormatting(source)
}

function withoutHeadingMarker(source: string) {
  return source.replace(/^#{1,4}[ \t]+/, '')
}

function withoutQuoteMarker(source: string) {
  return source.replace(/^>[ \t]?/gm, '')
}

function listItems(source: string) {
  return source.split('\n').map((line) => line.replace(/^[ \t]*(?:[-+*]|\d+[.)])[ \t]+/, ''))
}

function tableRows(source: string) {
  return source.split('\n')
    .filter((line) => !/^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/.test(line))
    .map((line) => line.replace(/^\s*\||\|\s*$/g, '').split('|').map((cell) => inlineContent(cell.trim(), [])))
}

function buildBlock(source: string, index: number, plan?: LayoutPlan['blocks'][number]): DocumentBlock {
  const id = `block-${index + 1}`
  const type = plan?.type ?? 'paragraph'
  const formats = plan?.formats ?? []

  if (type === 'heading') return { id, type, source, level: plan?.level ?? 2, content: inlineContent(withoutHeadingMarker(source), formats) }
  if (type === 'quote') return { id, type, source, content: inlineContent(withoutQuoteMarker(source), formats) }
  if (type === 'list') return { id, type, source, ordered: plan?.ordered ?? /^\s*\d+[.)]/.test(source), items: listItems(source).map((item) => inlineContent(item, [])) }
  if (type === 'code') return { id, type, source, language: plan?.language, code: source.replace(/^```[^\n]*\n?|\n?```$/g, '') }
  if (type === 'math') return { id, type, source, latex: source.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '') }
  if (type === 'table') {
    const rows = tableRows(source)
    return { id, type, source, headers: rows[0] ?? [], rows: rows.slice(1) }
  }
  if (type === 'callout') return { id, type, source, tone: plan?.tone ?? 'note', content: inlineContent(source, formats) }
  if (type === 'divider') return { id, type, source }
  return { id, type: 'paragraph', source, content: inlineContent(source, formats) }
}

export function buildDocumentFromPlan(sourceText: string, plan: LayoutPlan): LayoutDocument {
  const sources = sourceText.split('\n\n')
  const plansByIndex = new Map(plan.blocks.map((block) => [block.index, block]))
  const blocks = sources.map((source, index) => buildBlock(source, index, plansByIndex.get(index)))
  const document: LayoutDocument = { version: 1, sourceText, meta: {}, blocks }

  if (documentSourceText(blocks) !== sourceText) throw new Error('Document builder did not preserve source text')
  return document
}

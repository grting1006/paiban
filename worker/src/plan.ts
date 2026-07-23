import { z } from 'zod'
import { hasSourceFidelity, preserveUncertainFormatting } from '../../src/document/normalize'
import type { DocumentBlock, InlineContent, InlineMark, LayoutDocument } from '../../src/document/types'
import { sourceUnits } from './units'

const formatDecisionSchema = z.object({
  source: z.string().min(2),
  kind: z.enum(['bold', 'italic', 'strikethrough', 'code', 'math']),
  occurrence: z.number().int().nonnegative().default(0),
}).strict()

const blockPlanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  type: z.enum(['heading', 'paragraph', 'quote', 'list', 'code', 'math', 'table', 'callout', 'divider']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
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

const listLinePattern = /^([ \t]*)((?:[-+*•·])|(?:(?:\d+|[a-zA-Z]|[一二三四五六七八九十]+)[.)、）])|(?:[（(](?:\d+|[a-zA-Z]|[一二三四五六七八九十]+)[）)])|[①-⑳])[ \t]*(.*)$/

function isOrderedMarker(marker: string) {
  return !/^[-+*•·]$/.test(marker)
}

function explicitStructurePlans(units: ReturnType<typeof sourceUnits>): LayoutPlan['blocks'] {
  const blocks: LayoutPlan['blocks'] = []
  let index = 0

  const push = (end: number, type: LayoutPlan['blocks'][number]['type'], options: Partial<LayoutPlan['blocks'][number]> = {}) => {
    blocks.push({ start: index, end, type, formats: [], ...options })
    index = end + 1
  }

  while (index < units.length) {
    const trimmed = units[index].source.trimStart()
    if (/^```/.test(trimmed)) {
      let end = index
      while (end + 1 < units.length && !/```\s*$/.test(units[end].source.trimEnd())) end += 1
      push(end, 'code', { language: trimmed.match(/^```([^\n]*)/)?.[1] || undefined })
      continue
    }
    if (/^(?:\$\$|\\\[)/.test(trimmed)) {
      let end = index
      const closes = (source: string) => /(?:\$\$|\\\])\s*$/.test(source.trimEnd())
      while (end + 1 < units.length && !closes(units[end].source)) end += 1
      push(end, 'math')
      continue
    }
    if (/^\s*\|.*\|\s*$/.test(units[index].source)) {
      let end = index
      while (end + 1 < units.length && /^\s*\|.*\|\s*$/.test(units[end + 1].source)) end += 1
      const sources = units.slice(index, end + 1).map((unit) => unit.source)
      if (sources.length >= 2 && sources.some((source) => /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/.test(source))) {
        push(end, 'table')
        continue
      }
    }
    if (/^>[ \t]?/.test(trimmed)) {
      let end = index
      while (end + 1 < units.length && /^>[ \t]?/.test(units[end + 1].source.trimStart())) end += 1
      push(end, 'quote')
      continue
    }
    const listMatch = units[index].source.match(listLinePattern)
    if (listMatch) {
      let end = index
      while (end + 1 < units.length && listLinePattern.test(units[end + 1].source)) end += 1
      push(end, 'list', { ordered: isOrderedMarker(listMatch[2]) })
      continue
    }
    index += 1
  }

  return blocks
}

function applyExplicitStructures(units: ReturnType<typeof sourceUnits>, plan: LayoutPlan) {
  const explicit = explicitStructurePlans(units)
  const modelBlocks = normalizeHeadingLevels(plan).blocks.flatMap((block) => {
    let ranges = [{ start: block.start, end: block.end }]
    for (const protectedRange of explicit) {
      ranges = ranges.flatMap((range) => {
        if (range.end < protectedRange.start || range.start > protectedRange.end) return [range]
        return [
          ...(range.start < protectedRange.start ? [{ start: range.start, end: protectedRange.start - 1 }] : []),
          ...(range.end > protectedRange.end ? [{ start: protectedRange.end + 1, end: range.end }] : []),
        ]
      })
    }
    return ranges.map((range) => ({ ...block, ...range }))
  })
  return [...modelBlocks, ...explicit].sort((left, right) => left.start - right.start)
}

function normalizeHeadingLevels(plan: LayoutPlan): LayoutPlan {
  const hasMultipleDocumentTitles = plan.blocks.filter((block) => block.type === 'heading' && block.level === 1).length > 1
  if (!hasMultipleDocumentTitles) return plan
  return {
    blocks: plan.blocks.map((block) => block.type === 'heading'
      ? { ...block, level: Math.min((block.level ?? 2) + 1, 5) as 1 | 2 | 3 | 4 | 5 }
      : block),
  }
}

function isStandalonePlainHeading(sourceText: string, start: number, end: number, source: string) {
  const text = source.trim()
  const startsLine = start === 0 || sourceText[start - 1] === '\n'
  const endsLine = end === sourceText.length || sourceText[end] === '\n'
  return startsLine
    && endsLine
    && text.length >= 2
    && text.length <= 30
    && !/[。！？!?；;：:]$/.test(text)
    && !/^(?:#{1,5}|>|[-+*]|\d+[.)]|[a-zA-Z][.)])(?:[ \t]+|$)/.test(text)
}

export function buildDeterministicLayoutPlan(sourceText: string): LayoutPlan {
  const units = sourceUnits(sourceText)
  return {
    blocks: units.map(({ index, start, end, source }) => {
      const trimmed = source.trimStart()
      const heading = trimmed.match(/^(#{1,5})[ \t]+/)
      if (heading) return { start: index, end: index, type: 'heading' as const, level: heading[1].length as 1 | 2 | 3 | 4 | 5, formats: [] }
      if (/^```/.test(trimmed)) return { start: index, end: index, type: 'code' as const, formats: [], language: trimmed.match(/^```([^\n]*)/)?.[1] || undefined }
      if (/^(?:\$\$|\\\[)/.test(trimmed)) return { start: index, end: index, type: 'math' as const, formats: [] }
      if (/^>[ \t]?/m.test(trimmed)) return { start: index, end: index, type: 'quote' as const, formats: [] }

      const lines = source.split('\n').filter((line) => line.trim())
      const isList = lines.length > 0 && lines.every((line) => listLinePattern.test(line))
      if (isList) {
        const marker = lines[0].match(listLinePattern)?.[2] ?? '-'
        return {
          start: index,
          end: index,
          type: 'list' as const,
          ordered: isOrderedMarker(marker),
          formats: [],
        }
      }
      if (lines.length >= 2 && lines.every((line) => /^\s*\|.*\|\s*$/.test(line))) {
        return { start: index, end: index, type: 'table' as const, formats: [] }
      }
      if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(source)) return { start: index, end: index, type: 'divider' as const, formats: [] }
      if (isStandalonePlainHeading(sourceText, start, end, source) && index < units.length - 1) {
        return { start: index, end: index, type: 'heading' as const, level: index === 0 ? 1 as const : 2 as const, formats: [] }
      }
      return { start: index, end: index, type: 'paragraph' as const, formats: [] }
    }),
  }
}

function safeFormatDecisions(source: string): FormatDecision[] {
  const decisions: FormatDecision[] = []
  const occurrences = new Map<string, number>()

  function collect(pattern: RegExp, kind: FormatDecision['kind'], accepts: (inner: string) => boolean = () => true) {
    for (const match of source.matchAll(pattern)) {
      const fragment = match[0]
      if (!accepts(match[1] ?? '')) continue
      const occurrence = occurrences.get(fragment) ?? 0
      decisions.push({ source: fragment, kind, occurrence })
      occurrences.set(fragment, occurrence + 1)
    }
  }

  collect(/\*\*([^*\n]+)\*\*/g, 'bold')
  collect(/(?<!\*)\*([^*\n]+)\*\*(?!\*)/g, 'bold')
  collect(/(?<!\*)\*\*([^*\n]+)\*(?!\*)/g, 'bold')
  collect(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, 'italic')
  collect(/~~([^~\n]+)~~/g, 'strikethrough')
  collect(/`([^`\n]+)`/g, 'code')
  collect(/(?<!\$)\$(?!\$)([^$\n]+)(?<!\$)\$(?!\$)/g, 'math', (inner) => /[\\=^_{}]|[A-Za-z]\s*=|\d\s*[+*/-]/.test(inner))
  collect(/\\\(([^\n]+)\\\)/g, 'math', (inner) => /[\\=^_{}]|[A-Za-z]\s*=|\d\s*[+*/-]/.test(inner))

  return decisions
}

function mergeFormatDecisions(source: string, decisions: FormatDecision[]) {
  const merged = [...decisions]
  const existing = new Set(decisions.map((decision) => `${decision.kind}\0${decision.source}\0${decision.occurrence}`))
  for (const decision of safeFormatDecisions(source)) {
    const key = `${decision.kind}\0${decision.source}\0${decision.occurrence}`
    if (!existing.has(key)) merged.push(decision)
  }
  return merged
}

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
  if (decision.kind === 'bold' && source.startsWith('*') && !source.startsWith('**') && source.endsWith('**') && source.length > 3) {
    return { text: source.slice(1, -2), marks: ['bold'] }
  }
  if (decision.kind === 'bold' && source.startsWith('**') && source.endsWith('*') && !source.endsWith('**') && source.length > 3) {
    return { text: source.slice(2, -1), marks: ['bold'] }
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
  return source.replace(/^\s*#{1,5}[ \t]+/, '')
}

function withoutQuoteMarker(source: string) {
  return source.replace(/^\s*>[ \t]?/gm, '')
}

function occurrencesBefore(value: string, search: string, end: number) {
  let count = 0
  let cursor = value.indexOf(search)
  while (cursor !== -1 && cursor < end) {
    count += 1
    cursor = value.indexOf(search, cursor + search.length)
  }
  return count
}

function listItems(source: string, decisions: FormatDecision[]) {
  let sourceOffset = 0
  const lines = source.split('\n').map((line) => {
    const match = line.match(listLinePattern)
    const indent = match?.[1].replace(/\t/g, '  ').length ?? 0
    const marker = match?.[2]
    const value = match?.[3] ?? line
    const contentStart = sourceOffset + line.length - value.length
    const lineDecisions = decisions.flatMap((decision) => {
      const decisionStart = nthIndexOf(source, decision.source, decision.occurrence)
      if (decisionStart < contentStart || decisionStart + decision.source.length > contentStart + value.length) return []
      return [{
        ...decision,
        occurrence: occurrencesBefore(value, decision.source, decisionStart - contentStart),
      }]
    })
    sourceOffset += line.length + 1
    return {
      indent,
      marker,
      ordered: marker ? isOrderedMarker(marker) : false,
      content: inlineContent(value, lineDecisions),
    }
  })
  const baseIndent = Math.min(...lines.map((line) => line.indent))
  const items: import('../../src/document/types').ListItem[] = []

  for (const line of lines) {
    if (line.indent > baseIndent && items.length) {
      const parent = items[items.length - 1]
      parent.children ??= { ordered: line.ordered, items: [] }
      parent.children.items.push({ marker: line.marker, content: line.content })
    } else {
      items.push({ marker: line.marker, content: line.content })
    }
  }
  return items
}

function tableRows(source: string) {
  return source.split('\n')
    .filter((line) => !/^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/.test(line))
    .map((line) => line.replace(/^\s*\||\|\s*$/g, '').split('|').map((cell) => inlineContent(cell.trim(), [])))
}

function buildBlock(source: string, index: number, plan?: LayoutPlan['blocks'][number]): DocumentBlock {
  const id = `block-${index + 1}`
  const type = plan?.type ?? 'paragraph'
  const formats = mergeFormatDecisions(source, plan?.formats ?? [])

  if (type === 'heading') return { id, type, source, level: plan?.level ?? 2, content: inlineContent(withoutHeadingMarker(source), formats) }
  if (type === 'quote') return { id, type, source, content: inlineContent(withoutQuoteMarker(source), formats) }
  if (type === 'list') {
    const marker = source.match(listLinePattern)?.[2]
    return { id, type, source, ordered: plan?.ordered ?? Boolean(marker && isOrderedMarker(marker)), items: listItems(source, formats) }
  }
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

function mergeAdjacentLists(sourceText: string, blocks: DocumentBlock[]) {
  const merged: DocumentBlock[] = []
  let cursor = 0

  for (const block of blocks) {
    const start = sourceText.indexOf(block.source, cursor)
    const gap = start === -1 ? '' : sourceText.slice(cursor, start)
    const previous = merged[merged.length - 1]
    if (previous?.type === 'list' && block.type === 'list' && previous.ordered === block.ordered && !gap.trim()) {
      previous.source += gap + block.source
      previous.items.push(...block.items)
    } else {
      merged.push(block)
    }
    if (start !== -1) cursor = start + block.source.length
  }

  return merged
}

export function buildDocumentFromPlan(sourceText: string, plan: LayoutPlan): LayoutDocument {
  const units = sourceUnits(sourceText)
  const plannedRanges = applyExplicitStructures(units, plan)
  const blocks: DocumentBlock[] = []
  let cursor = 0

  const appendBlock = (start: number, end: number, blockPlan?: LayoutPlan['blocks'][number]) => {
    if (start < 0 || end < start || end >= units.length) throw new Error('Invalid source unit range')
    const source = sourceText.slice(units[start].start, units[end].end)
    blocks.push(buildBlock(source, blocks.length, blockPlan))
  }

  for (const blockPlan of plannedRanges) {
    if (blockPlan.start < cursor) throw new Error('Overlapping source unit ranges')
    if (blockPlan.start > cursor) appendBlock(cursor, blockPlan.start - 1)
    appendBlock(blockPlan.start, blockPlan.end, blockPlan)
    cursor = blockPlan.end + 1
  }
  if (cursor < units.length) appendBlock(cursor, units.length - 1)

  const document: LayoutDocument = { version: 1, sourceText, meta: {}, blocks: mergeAdjacentLists(sourceText, blocks) }

  if (!hasSourceFidelity(document)) throw new Error('Document builder did not preserve source text')
  return document
}

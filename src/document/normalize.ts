import type { DocumentBlock, InlineContent, LayoutDocument } from './types'

export function inlineSourceText(content: InlineContent[]) {
  return content.map((item) => item.source).join('')
}

export function inlineVisibleText(content: InlineContent[]) {
  return content.map((item) => {
    if (item.type === 'text') return item.text
    if (item.type === 'math') return item.latex
    return '\n'
  }).join('')
}

export function documentSourceText(blocks: DocumentBlock[]) {
  return blocks.map((block) => block.source).join('\n\n')
}

export function hasSourceFidelity(document: LayoutDocument) {
  let cursor = 0
  for (const block of document.blocks) {
    const blockStart = document.sourceText.indexOf(block.source, cursor)
    if (blockStart === -1 || document.sourceText.slice(cursor, blockStart).trim()) return false
    cursor = blockStart + block.source.length
  }
  return !document.sourceText.slice(cursor).trim()
}

export function preserveUncertainFormatting(source: string): InlineContent[] {
  return [{ type: 'text', text: source, source }]
}

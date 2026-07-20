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
  return document.sourceText === documentSourceText(document.blocks)
}

export function preserveUncertainFormatting(source: string): InlineContent[] {
  return [{ type: 'text', text: source, source }]
}

export type HeadingLevel = 1 | 2 | 3 | 4

export type InlineMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'

export interface TextRun {
  type: 'text'
  text: string
  source: string
  marks?: InlineMark[]
}

export interface InlineMath {
  type: 'math'
  latex: string
  source: string
}

export interface LineBreak {
  type: 'break'
  source: '\n'
}

export type InlineContent = TextRun | InlineMath | LineBreak

interface SourceBlock {
  id: string
  source: string
}

export interface HeadingBlock extends SourceBlock {
  type: 'heading'
  level: HeadingLevel
  content: InlineContent[]
}

export interface ParagraphBlock extends SourceBlock {
  type: 'paragraph'
  content: InlineContent[]
}

export interface QuoteBlock extends SourceBlock {
  type: 'quote'
  content: InlineContent[]
  attribution?: InlineContent[]
}

export interface ListBlock extends SourceBlock {
  type: 'list'
  ordered: boolean
  items: InlineContent[][]
}

export interface CodeBlock extends SourceBlock {
  type: 'code'
  code: string
  language?: string
}

export interface MathBlock extends SourceBlock {
  type: 'math'
  latex: string
}

export interface TableBlock extends SourceBlock {
  type: 'table'
  headers: InlineContent[][]
  rows: InlineContent[][][]
}

export interface CalloutBlock extends SourceBlock {
  type: 'callout'
  tone: 'note' | 'important'
  content: InlineContent[]
}

export interface DividerBlock extends SourceBlock {
  type: 'divider'
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | MathBlock
  | TableBlock
  | CalloutBlock
  | DividerBlock

export interface LayoutDocument {
  version: 1
  sourceText: string
  meta: {
    category?: string
    description?: string
  }
  blocks: DocumentBlock[]
}

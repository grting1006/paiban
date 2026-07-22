import { Fragment, type ReactNode } from 'react'
import katex from 'katex'
import type { DocumentBlock, InlineContent, InlineMark, LayoutDocument, ListItem } from '../document/types'
import { inlineVisibleText } from '../document/normalize'

interface DocumentRendererProps {
  document: LayoutDocument
}

interface FormulaProps {
  latex: string
  displayMode?: boolean
  className?: string
}

function Formula({ latex, displayMode = false, className }: FormulaProps) {
  const html = katex.renderToString(latex, {
    displayMode,
    output: 'htmlAndMathml',
    strict: false,
    throwOnError: false,
    trust: false,
  })

  const Tag = displayMode ? 'div' : 'span'
  return <Tag className={[displayMode ? 'document-math document-math--block' : 'document-math', className].filter(Boolean).join(' ')} dangerouslySetInnerHTML={{ __html: html }} />
}

function applyMarks(content: ReactNode, marks: InlineMark[] = []) {
  return marks.reduce<ReactNode>((child, mark) => {
    if (mark === 'bold') return <strong>{child}</strong>
    if (mark === 'italic') return <em>{child}</em>
    if (mark === 'underline') return <u>{child}</u>
    if (mark === 'strikethrough') return <s>{child}</s>
    return <code>{child}</code>
  }, content)
}

function InlineRenderer({ content }: { content: InlineContent[] }) {
  return content.map((item, index) => {
    const key = `${item.type}-${index}`
    if (item.type === 'break') return <br key={key} />
    if (item.type === 'math') return <Formula key={key} latex={item.latex} />
    return <Fragment key={key}>{applyMarks(item.text, item.marks)}</Fragment>
  })
}

function bodyBlockClass(sectionLevel: number) {
  return sectionLevel > 0 ? `document-body-block document-body-block--level-${sectionLevel}` : undefined
}

function ListRenderer({ ordered, items, className }: { ordered: boolean; items: ListItem[]; className?: string }) {
  const List = ordered ? 'ol' : 'ul'
  const hasSourceMarkers = items.some((item) => item.marker)
  return <List className={[className, hasSourceMarkers ? 'document-list--source-markers' : ''].filter(Boolean).join(' ')}>{items.map((item, index) => <li key={index}>
    <div className="document-list__line">
      {item.marker ? <span className="document-list__marker">{item.marker}</span> : null}
      <span><InlineRenderer content={item.content} /></span>
    </div>
    {item.children ? <ListRenderer ordered={item.children.ordered} items={item.children.items} /> : null}
  </li>)}</List>
}

function isNumericCell(content: InlineContent[]) {
  return /^[\s¥￥$€£+\-()\d,.%]+$/.test(inlineVisibleText(content))
}

function renderBlock(block: DocumentBlock, sectionLevel: number) {
  const className = bodyBlockClass(sectionLevel)
  if (block.type === 'heading') {
    const Heading = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
    return <Heading key={block.id}><InlineRenderer content={block.content} /></Heading>
  }
  if (block.type === 'paragraph') return <p className={className} key={block.id}><InlineRenderer content={block.content} /></p>
  if (block.type === 'quote') {
    return <blockquote className={className} key={block.id}>
      <InlineRenderer content={block.content} />
      {block.attribution ? <cite><InlineRenderer content={block.attribution} /></cite> : null}
    </blockquote>
  }
  if (block.type === 'list') {
    return <ListRenderer className={className} key={block.id} ordered={block.ordered} items={block.items} />
  }
  if (block.type === 'code') return <pre className={className} key={block.id}><code data-language={block.language}>{block.code}</code></pre>
  if (block.type === 'math') return <Formula className={className} key={block.id} latex={block.latex} displayMode />
  if (block.type === 'table') {
    return <table className={className} key={block.id}>
      <thead><tr>{block.headers.map((header, index) => <th key={`${block.id}-header-${index}`}><InlineRenderer content={header} /></th>)}</tr></thead>
      <tbody>{block.rows.map((row, rowIndex) => <tr key={`${block.id}-row-${rowIndex}`}>{row.map((cell, cellIndex) => <td className={isNumericCell(cell) ? 'is-numeric' : undefined} key={`${block.id}-${rowIndex}-${cellIndex}`}><InlineRenderer content={cell} /></td>)}</tr>)}</tbody>
    </table>
  }
  if (block.type === 'callout') return <aside className={`document-callout document-callout--${block.tone} ${className ?? ''}`} key={block.id}><InlineRenderer content={block.content} /></aside>
  return <hr key={block.id} />
}

export function DocumentRenderer({ document }: DocumentRendererProps) {
  let sectionLevel = 0
  const blocks = document.blocks.map((block) => {
    if (block.type === 'heading') sectionLevel = block.level
    return renderBlock(block, sectionLevel)
  })
  return <>
    {document.meta.category ? <div className="paper__kicker">{document.meta.category}</div> : null}
    {document.meta.description ? <div className="paper__deck">{document.meta.description}</div> : null}
    <div className="document-content">{blocks}</div>
  </>
}

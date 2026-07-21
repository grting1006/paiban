import { documentSourceText } from '../document/normalize'
import type { DocumentBlock, InlineContent, InlineMark, LayoutDocument } from '../document/types'

const text = (value: string, source = value, marks?: InlineMark[]): InlineContent => ({
  type: 'text',
  text: value,
  source,
  marks,
})

const blocks: DocumentBlock[] = [
  {
    id: 'title',
    type: 'heading',
    level: 1,
    source: '# 人工智能如何改变知识工作的方式',
    content: [text('人工智能如何改变知识工作的方式')],
  },
  {
    id: 'section-1',
    type: 'heading',
    level: 2,
    source: '## 从生成内容到组织信息',
    content: [text('从生成内容到组织信息')],
  },
  {
    id: 'paragraph-1',
    type: 'paragraph',
    source: '人工智能正在成为知识工作者的**协作伙伴**，排版系统需要保留原文，同时识别 $E = mc^2$ 这样的公式。',
    content: [
      text('人工智能正在成为知识工作者的'),
      text('协作伙伴', '**协作伙伴**', ['bold']),
      text('，排版系统需要保留原文，同时识别 '),
      { type: 'math', latex: 'E = mc^2', source: '$E = mc^2$' },
      text(' 这样的公式。'),
    ],
  },
  {
    id: 'section-1-1',
    type: 'heading',
    level: 3,
    source: '### 信息结构决定阅读路径',
    content: [text('信息结构决定阅读路径')],
  },
  {
    id: 'quote-1',
    type: 'quote',
    source: '> 好的排版让复杂观点更容易被理解。',
    content: [text('好的排版让复杂观点更容易被理解。')],
  },
  {
    id: 'section-1-1-1',
    type: 'heading',
    level: 4,
    source: '#### 排版时需要保留的内容',
    content: [text('排版时需要保留的内容')],
  },
  {
    id: 'list-1',
    type: 'list',
    ordered: false,
    source: '- 原始文字\n  - 标题与正文\n  - 引用和列表\n- 明确的强调格式\n- 数学公式',
    items: [
      {
        content: [text('原始文字')],
        children: {
          ordered: false,
          items: [
            { content: [text('标题与正文')] },
            { content: [text('引用和列表')] },
          ],
        },
      },
      { content: [text('明确的强调格式')] },
      { content: [text('数学公式')] },
    ],
  },
  {
    id: 'section-1-1-1-1',
    type: 'heading',
    level: 5,
    source: '##### 进一步说明',
    content: [text('进一步说明')],
  },
  {
    id: 'math-1',
    type: 'math',
    source: '$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$',
    latex: '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
  },
]

export const sampleDocument: LayoutDocument = {
  version: 1,
  sourceText: documentSourceText(blocks),
  meta: {
    category: 'TECHNOLOGY & WORK',
    description: '从生成内容到组织信息，AI 正在重新定义内容的生产与呈现。',
  },
  blocks,
}

export const sampleSourceText = sampleDocument.sourceText

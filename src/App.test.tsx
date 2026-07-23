import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'
import { sampleDocument } from './content/sampleDocument'
import { hasSourceFidelity, inlineSourceText } from './document/normalize'
import * as pdfExport from './services/pdfExport'

test('renders the complete desktop workbench shell', () => {
  render(<App />)

  expect(screen.getByRole('banner')).toHaveTextContent('排版台')
  expect(screen.getByRole('region', { name: '原始内容' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: '文档预览' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: '排版设置' })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent('A4 · 210 × 297 mm')
})

test('exposes the primary local interactions', () => {
  render(<App />)

  expect(screen.getByRole('button', { name: '开始排版' })).toBeEnabled()
  expect(screen.getByRole('button', { name: '导出 PDF' })).toBeEnabled()
  expect(screen.getByRole('button', { name: '撤销' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '颜色 #147d72' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('textbox', { name: '原始文本' })).toBeInstanceOf(HTMLTextAreaElement)
})

test('preserves pasted line breaks and writes toolbar formatting into source text', () => {
  render(<App />)
  const editor = screen.getByRole('textbox', { name: '原始文本' }) as HTMLTextAreaElement

  fireEvent.change(editor, { target: { value: '标题\n\n正文' } })
  expect(editor.value).toBe('标题\n\n正文')

  editor.setSelectionRange(0, 2)
  fireEvent.click(screen.getByRole('button', { name: '一级标题' }))
  expect(editor.value).toBe('# 标题\n\n正文')

  editor.setSelectionRange(6, 8)
  fireEvent.click(screen.getByRole('button', { name: '粗体' }))
  expect(editor.value).toBe('# 标题\n\n**正文**')
})

test('renders five document levels, rich formatting, and compiled math', () => {
  const { container } = render(<App />)

  expect(screen.getByRole('heading', { level: 1, name: '人工智能如何改变知识工作的方式' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: '从生成内容到组织信息' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '信息结构决定阅读路径' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 4, name: '排版时需要保留的内容' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 5, name: '进一步说明' })).toBeInTheDocument()
  expect(screen.getByText('协作伙伴').tagName).toBe('STRONG')
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(container.querySelectorAll('.katex').length).toBeGreaterThan(0)
})

test('keeps every original character while presenting recognized formatting', () => {
  const paragraph = sampleDocument.blocks.find((block) => block.id === 'paragraph-1')

  expect(hasSourceFidelity(sampleDocument)).toBe(true)
  expect(paragraph?.type).toBe('paragraph')
  if (paragraph?.type === 'paragraph') {
    expect(inlineSourceText(paragraph.content)).toBe(paragraph.source)
  }
})

test('sends the source to the layout service and renders the accepted document', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => sampleDocument,
  })
  vi.stubGlobal('fetch', fetch)
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: '开始排版' }))

  expect(await screen.findByRole('button', { name: '已完成' })).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledOnce()
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ sourceText: sampleDocument.sourceText })
  vi.unstubAllGlobals()
})

test('updates the accent locally and downloads the rendered paper as PDF', async () => {
  const download = vi.spyOn(pdfExport, 'downloadPaperAsPdf').mockResolvedValue(2)
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: '颜色 #df6c55' }))
  expect(screen.getByRole('button', { name: '颜色 #df6c55' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: '撤销' })).toBeEnabled()

  fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }))
  expect(await screen.findByRole('button', { name: '导出 PDF' })).toBeEnabled()
  expect(download).toHaveBeenCalledOnce()
  expect(download.mock.calls[0][0]).toHaveClass('paper')
  expect(screen.getByRole('contentinfo')).toHaveTextContent('2 页')
  download.mockRestore()
})

test('locks the approved desktop-only three-column layout', () => {
  const styles = readFileSync('src/styles/app.css', 'utf8')

  expect(styles).toContain('grid-template-columns: minmax(300px, 31%) minmax(560px, 1fr) 210px')
  expect(styles).toContain('min-width: 1180px')
  expect(styles).not.toContain('@media (max-width')
})

test('locks fixed typography while leaving only the accent customizable', () => {
  const styles = readFileSync('src/styles/app.css', 'utf8')
  render(<App />)

  expect(styles).toContain('"Source Han Serif SC"')
  expect(styles).toContain('"Source Han Sans SC"')
  expect(styles).toContain('font-family: KaiTi')
  expect(styles).toContain('font-family: "Times New Roman", KaiTi')
  expect(styles).toContain('.paper blockquote { margin: .5em 2em;')
  expect(styles).toContain('font-family: "Times New Roman", "Source Han Serif SC"')
  expect(styles).toContain('font-style: normal')
  expect(styles).toContain('background: transparent')
  expect(styles).toContain('font-weight: 700')
  expect(styles).toContain('font-size: calc(var(--body-size) * 1.8)')
  expect(styles).toContain('text-align: left')
  expect(screen.queryByText('版式模板')).not.toBeInTheDocument()
  expect(screen.queryByText('正文样式')).not.toBeInTheDocument()
})

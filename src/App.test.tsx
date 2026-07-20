import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'

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
  expect(screen.getByRole('button', { name: '经典' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('region', { name: '原始内容' }).querySelector('[contenteditable="true"]')).toBeInTheDocument()
})

test('updates templates locally and sends export to browser print', () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: '简约' }))
  expect(screen.getByRole('button', { name: '简约' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: '撤销' })).toBeEnabled()

  fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }))
  expect(print).toHaveBeenCalledOnce()
  print.mockRestore()
})

test('locks the approved desktop-only three-column layout', () => {
  const styles = readFileSync('src/styles/app.css', 'utf8')

  expect(styles).toContain('grid-template-columns: minmax(300px, 31%) minmax(560px, 1fr) 210px')
  expect(styles).toContain('min-width: 1180px')
  expect(styles).not.toContain('@media (max-width')
})

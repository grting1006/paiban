import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the complete desktop workbench shell', () => {
  render(<App />)

  expect(screen.getByRole('banner')).toHaveTextContent('排版台')
  expect(screen.getByRole('region', { name: '原始内容' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: '文档预览' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: '排版设置' })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toHaveTextContent('A4 · 210 × 297 mm')
})

test('keeps every displayed command non-functional', () => {
  render(<App />)
  const shell = screen.getByTestId('workbench-shell')
  const controls = within(shell).getAllByRole('button')

  expect(controls.length).toBeGreaterThan(8)
  controls.forEach((control) => expect(control).toBeDisabled())
})

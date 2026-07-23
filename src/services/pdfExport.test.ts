import { expect, test, vi } from 'vitest'
import { measurePaperPageSegments, paginateFlow } from './pdfExport'

test('paginates at complete block boundaries', () => {
  const blocks = Array.from({ length: 8 }, (_, index) => ({
    top: index * 100,
    bottom: (index + 1) * 100,
    heading: false,
  }))

  expect(paginateFlow(800, 510, blocks)).toEqual([
    { start: 0, end: 500 },
    { start: 500, end: 800 },
  ])
})

test('moves an orphaned heading to the next page', () => {
  const blocks = [
    { top: 0, bottom: 400, heading: false },
    { top: 430, bottom: 470, heading: true },
    { top: 480, bottom: 620, heading: false },
  ]

  expect(paginateFlow(620, 510, blocks)).toEqual([
    { start: 0, end: 430 },
    { start: 430, end: 620 },
  ])
})

test('splits a block only when it is taller than a page', () => {
  const blocks = [{ top: 0, bottom: 900, heading: false }]

  expect(paginateFlow(900, 510, blocks)).toEqual([
    { start: 0, end: 510 },
    { start: 510, end: 900 },
  ])
})

test('measures the complete document flow from a clipped preview page', () => {
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = Number(this.dataset.top ?? 0)
    const bottom = Number(this.dataset.bottom ?? top)
    return { top, bottom, left: 0, right: 420, width: 420, height: bottom - top, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  })
  const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('is-export-flow') ? 1200 : 510
  })
  const paper = document.createElement('article')
  paper.className = 'paper paper--page'
  paper.innerHTML = `
    <div class="paper__page-window">
      <div class="paper__page-segment">
        <div class="paper__page-flow">
          <div class="document-content">
            <h2 data-top="0" data-bottom="40">标题一</h2>
            <p data-top="50" data-bottom="480">正文一</p>
            <h2 data-top="500" data-bottom="540">标题二</h2>
            <p data-top="550" data-bottom="1000">正文二</p>
            <p data-top="1010" data-bottom="1200">正文三</p>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.append(paper)

  expect(measurePaperPageSegments(paper)).toEqual([
    { start: 0, end: 500 },
    { start: 500, end: 1010 },
    { start: 1010, end: 1200 },
  ])

  paper.remove()
  rect.mockRestore()
  scrollHeight.mockRestore()
})

import { expect, test } from 'vitest'
import { paginateFlow } from './pdfExport'

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

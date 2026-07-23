const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const PAPER_WIDTH_PX = 420
const PAPER_HEIGHT_PX = PAPER_WIDTH_PX * A4_HEIGHT_MM / A4_WIDTH_MM
const PAGE_TOP_PX = 44
const PAGE_BOTTOM_PX = 40
const PAGE_CONTENT_HEIGHT_PX = PAPER_HEIGHT_PX - PAGE_TOP_PX - PAGE_BOTTOM_PX
const PDF_TEXT_FONT_URL = `${import.meta.env.BASE_URL}fonts/LXGWWenKai-Regular.ttf`

export interface FlowBlock {
  top: number
  bottom: number
  heading: boolean
}

export interface PageSegment {
  start: number
  end: number
}

interface TextFragment {
  text: string
  left: number
  top: number
  right: number
  bottom: number
}

type Html2Canvas = typeof import('html2canvas')['default']

export function paginateFlow(flowHeight: number, pageHeight: number, blocks: FlowBlock[]): PageSegment[] {
  if (flowHeight <= 0) return [{ start: 0, end: 0 }]

  const segments: PageSegment[] = []
  let pageStart = 0
  let blockIndex = 0

  while (pageStart < flowHeight) {
    const target = Math.min(pageStart + pageHeight, flowHeight)
    const firstBlockIndex = blockIndex
    while (blockIndex < blocks.length && blocks[blockIndex].bottom <= target) blockIndex += 1

    if (blockIndex >= blocks.length) {
      segments.push({ start: pageStart, end: flowHeight })
      break
    }

    let pageEnd = blocks[blockIndex].top
    let followingLines = 0
    for (let index = blockIndex - 1; index >= firstBlockIndex && followingLines < 2; index -= 1) {
      if (blocks[index].heading) {
        blockIndex = index
        pageEnd = blocks[index].top
        break
      }
      followingLines += Math.max(1, Math.floor((blocks[index].bottom - blocks[index].top) / 24))
    }

    if (blockIndex === firstBlockIndex) {
      pageEnd = target
    }

    segments.push({ start: pageStart, end: pageEnd })
    pageStart = pageEnd
  }

  return segments
}

function createExportSurface(element: HTMLElement) {
  const surface = element.cloneNode(true) as HTMLElement
  const pageFlow = surface.querySelector('.paper__page-flow')
  if (pageFlow) surface.replaceChildren(...Array.from(pageFlow.childNodes))
  const computed = getComputedStyle(element)
  for (const property of ['--accent', '--body-size', '--body-leading', '--indent-step']) {
    surface.style.setProperty(property, computed.getPropertyValue(property))
  }
  surface.querySelector('.paper__folio')?.remove()
  surface.classList.add('is-exporting', 'is-export-flow')
  Object.assign(surface.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    height: 'auto',
    minHeight: '0',
    aspectRatio: 'auto',
    paddingTop: '0',
    paddingBottom: '0',
    transform: 'none',
    zIndex: '-1',
  })
  document.body.append(surface)
  return surface
}

function toFlowBlock(rect: DOMRect, surfaceTop: number, heading = false): FlowBlock {
  return { top: rect.top - surfaceTop, bottom: rect.bottom - surfaceTop, heading }
}

function lineBlocks(element: HTMLElement, surfaceTop: number) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const lines: FlowBlock[] = []
  const rects = typeof range.getClientRects === 'function' ? range.getClientRects() : []
  for (const rect of rects) {
    if (rect.width <= 0 || rect.height <= 0) continue
    const block = toFlowBlock(rect, surfaceTop)
    const previous = lines.at(-1)
    if (previous && Math.abs(previous.top - block.top) < 1) {
      previous.bottom = Math.max(previous.bottom, block.bottom)
    } else {
      lines.push(block)
    }
  }
  range.detach()
  return lines
}

function measureElementBlocks(element: HTMLElement, surfaceTop: number): FlowBlock[] {
  if (/^H[1-5]$/.test(element.tagName)) return [toFlowBlock(element.getBoundingClientRect(), surfaceTop, true)]

  if (element.tagName === 'TABLE') {
    return Array.from(element.querySelectorAll<HTMLElement>('tr'), (row, index) =>
      toFlowBlock(row.getBoundingClientRect(), surfaceTop, index === 0),
    )
  }

  if (element.matches('ol, ul')) {
    const listLines = Array.from(element.querySelectorAll<HTMLElement>('.document-list__line'), (line) =>
      toFlowBlock(line.getBoundingClientRect(), surfaceTop),
    )
    if (listLines.length) return listLines
  }

  const lines = lineBlocks(element, surfaceTop)
  return lines.length ? lines : [toFlowBlock(element.getBoundingClientRect(), surfaceTop)]
}

function measureFlow(surface: HTMLElement) {
  const surfaceTop = surface.getBoundingClientRect().top
  const elements = surface.querySelectorAll<HTMLElement>(':scope > .paper__kicker, :scope > .paper__deck, :scope > .document-content > *')
  const blocks = Array.from(elements).flatMap((element) => measureElementBlocks(element, surfaceTop))
  const flowHeight = Math.max(surface.scrollHeight, blocks.at(-1)?.bottom ?? 0)
  return { blocks, flowHeight }
}

function collectTextFragments(surface: HTMLElement) {
  const fragments: TextFragment[] = []
  const surfaceRect = surface.getBoundingClientRect()
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let node = walker.nextNode()

  while (node) {
    const parent = node.parentElement
    const text = node.nodeValue ?? ''
    if (parent && text && !parent.closest('.katex, script, style')) {
      const style = getComputedStyle(parent)
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        let offset = 0
        let current: TextFragment | undefined
        for (const character of text) {
          const end = offset + character.length
          range.setStart(node, offset)
          range.setEnd(node, end)
          const rect = range.getBoundingClientRect()
          const normalized = character === '\u00a0' ? ' ' : character
          if (rect.width > 0 && rect.height > 0 && !/[\r\n]/.test(normalized)) {
            const next = {
              text: normalized,
              left: rect.left - surfaceRect.left,
              top: rect.top - surfaceRect.top,
              right: rect.right - surfaceRect.left,
              bottom: rect.bottom - surfaceRect.top,
            }
            if (current && Math.abs(current.top - next.top) < 1 && next.left - current.right < rect.height) {
              current.text += next.text
              current.right = next.right
              current.bottom = Math.max(current.bottom, next.bottom)
            } else {
              current = next
              fragments.push(current)
            }
          } else {
            current = undefined
          }
          offset = end
        }
      }
    }
    node = walker.nextNode()
  }

  range.detach()
  return fragments
}

async function rasterizeComplexBlocks(surface: HTMLElement, html2canvas: Html2Canvas) {
  const blocks = Array.from(surface.querySelectorAll<HTMLElement>('table, pre'))
  for (const block of blocks) {
    const rect = block.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) continue
    const computed = getComputedStyle(block)
    const canvas = await html2canvas(block, {
      backgroundColor: null,
      height: Math.ceil(rect.height),
      logging: false,
      scale: 3,
      useCORS: true,
      width: Math.ceil(rect.width),
    })
    const image = document.createElement('img')
    image.alt = ''
    image.className = 'pdf-raster-block'
    image.src = canvas.toDataURL('image/png')
    Object.assign(image.style, {
      display: 'block',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      marginTop: computed.marginTop,
      marginRight: computed.marginRight,
      marginBottom: computed.marginBottom,
      marginLeft: computed.marginLeft,
      maxWidth: 'none',
    })
    block.replaceWith(image)
    await image.decode()
  }
}

export function measurePaperPageSegments(element: HTMLElement) {
  const surface = createExportSurface(element)
  try {
    const { blocks, flowHeight } = measureFlow(surface)
    return paginateFlow(flowHeight, PAGE_CONTENT_HEIGHT_PX, blocks)
  } finally {
    surface.remove()
  }
}

function drawFolio(context: CanvasRenderingContext2D, width: number, height: number, scale: number, pageNumber: number) {
  context.fillStyle = '#8a959e'
  context.font = `${8 * scale}px Arial, sans-serif`
  context.textBaseline = 'alphabetic'
  const baseline = height - 18 * scale
  context.textAlign = 'left'
  context.fillText('排版台', 48 * scale, baseline)
  context.textAlign = 'right'
  context.fillText(String(pageNumber).padStart(2, '0'), width - 48 * scale, baseline)
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadPaperAsPdf(element: HTMLElement, filename = '排版文档.pdf') {
  const [{ default: html2canvas }, { PDFDocument, PageSizes, rgb }, { default: fontkit }, fontResponse] = await Promise.all([
    import('html2canvas'),
    import('pdf-lib'),
    import('@pdf-lib/fontkit'),
    fetch(PDF_TEXT_FONT_URL),
  ])
  if (!fontResponse.ok) throw new Error('PDF font is unavailable')

  await document.fonts?.ready
  const surface = createExportSurface(element)
  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const { blocks, flowHeight } = measureFlow(surface)
    const segments = paginateFlow(flowHeight, PAGE_CONTENT_HEIGHT_PX, blocks)
    const textFragments = collectTextFragments(surface)
    await rasterizeComplexBlocks(surface, html2canvas)
    const flowCanvas = await html2canvas(surface, {
      backgroundColor: '#ffffff',
      height: Math.ceil(flowHeight),
      logging: false,
      scale: 3,
      useCORS: true,
      width: surface.offsetWidth,
    })
    const scale = flowCanvas.width / surface.offsetWidth
    const pageWidth = flowCanvas.width
    const pageHeight = Math.round(pageWidth * A4_HEIGHT_MM / A4_WIDTH_MM)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = pageWidth
    pageCanvas.height = pageHeight
    const context = pageCanvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const textFont = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: true })
    pdf.setTitle(filename.replace(/\.pdf$/i, ''))
    pdf.setCreator('排版台')
    const [pdfWidth, pdfHeight] = PageSizes.A4
    const pdfScale = pdfWidth / surface.offsetWidth

    for (const [index, segment] of segments.entries()) {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, pageWidth, pageHeight)
      const sourceY = Math.round(segment.start * scale)
      const sourceHeight = Math.min(Math.round((segment.end - segment.start) * scale), flowCanvas.height - sourceY)
      context.drawImage(flowCanvas, 0, sourceY, pageWidth, sourceHeight, 0, Math.round(PAGE_TOP_PX * scale), pageWidth, sourceHeight)
      drawFolio(context, pageWidth, pageHeight, scale, index + 1)
      const page = pdf.addPage(PageSizes.A4)
      const pageImage = await pdf.embedJpg(pageCanvas.toDataURL('image/jpeg', .96))
      page.drawImage(pageImage, { x: 0, y: 0, width: pdfWidth, height: pdfHeight })

      for (const fragment of textFragments) {
        const midpoint = (fragment.top + fragment.bottom) / 2
        if (midpoint < segment.start || midpoint >= segment.end || !fragment.text.trim()) continue
        const size = Math.max(1, (fragment.bottom - fragment.top) * pdfScale * .82)
        const y = pdfHeight - (PAGE_TOP_PX + fragment.bottom - segment.start) * pdfScale
        page.drawText(fragment.text, {
          x: Math.max(0, fragment.left * pdfScale),
          y: Math.max(0, y),
          size,
          font: textFont,
          color: rgb(0, 0, 0),
          opacity: 0,
        })
      }
    }

    const pdfBytes = await pdf.save({ useObjectStreams: true })
    downloadPdf(pdfBytes, filename)
    return segments.length
  } finally {
    surface.remove()
  }
}

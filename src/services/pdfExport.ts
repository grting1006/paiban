const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const PAPER_WIDTH_PX = 420
const PAPER_HEIGHT_PX = PAPER_WIDTH_PX * A4_HEIGHT_MM / A4_WIDTH_MM
const PAGE_TOP_PX = 44
const PAGE_BOTTOM_PX = 40
const PAGE_CONTENT_HEIGHT_PX = PAPER_HEIGHT_PX - PAGE_TOP_PX - PAGE_BOTTOM_PX

export interface FlowBlock {
  top: number
  bottom: number
  heading: boolean
}

export interface PageSegment {
  start: number
  end: number
}

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
    if (blockIndex > firstBlockIndex && blocks[blockIndex - 1].heading) {
      blockIndex -= 1
      pageEnd = blocks[blockIndex].top
    }

    if (blockIndex === firstBlockIndex || pageEnd - pageStart < pageHeight * .3) {
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

function measureFlow(surface: HTMLElement) {
  const surfaceTop = surface.getBoundingClientRect().top
  const elements = surface.querySelectorAll<HTMLElement>(':scope > .paper__kicker, :scope > .paper__deck, :scope > .document-content > *')
  const blocks = Array.from(elements, (element) => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top - surfaceTop,
      bottom: rect.bottom - surfaceTop,
      heading: /^H[1-5]$/.test(element.tagName),
    }
  })
  const flowHeight = Math.max(surface.scrollHeight, blocks.at(-1)?.bottom ?? 0)
  return { blocks, flowHeight }
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

export async function downloadPaperAsPdf(element: HTMLElement, filename = '排版文档.pdf') {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  await document.fonts?.ready
  const surface = createExportSurface(element)
  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const { blocks, flowHeight } = measureFlow(surface)
    const segments = paginateFlow(flowHeight, PAGE_CONTENT_HEIGHT_PX, blocks)
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

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    segments.forEach((segment, index) => {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, pageWidth, pageHeight)
      const sourceY = Math.round(segment.start * scale)
      const sourceHeight = Math.min(Math.round((segment.end - segment.start) * scale), flowCanvas.height - sourceY)
      context.drawImage(flowCanvas, 0, sourceY, pageWidth, sourceHeight, 0, Math.round(PAGE_TOP_PX * scale), pageWidth, sourceHeight)
      drawFolio(context, pageWidth, pageHeight, scale, index + 1)
      if (index > 0) pdf.addPage('a4', 'portrait')
      pdf.addImage(pageCanvas.toDataURL('image/jpeg', .96), 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST')
    })
    pdf.save(filename)
    return segments.length
  } finally {
    surface.remove()
  }
}

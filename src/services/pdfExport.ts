const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export async function downloadPaperAsPdf(element: HTMLElement, filename = '排版文档.pdf') {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  element.classList.add('is-exporting')
  try {
    await document.fonts?.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      logging: false,
      scale: 3,
      useCORS: true,
    })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    pdf.addImage(canvas.toDataURL('image/jpeg', .96), 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST')
    pdf.save(filename)
  } finally {
    element.classList.remove('is-exporting')
  }
}

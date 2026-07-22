export interface SourceUnit {
  index: number
  start: number
  end: number
  source: string
}

const optionalBreaks = new Set(['：', ':'])

function protectedFormattingRanges(source: string) {
  const ranges: Array<{ start: number; end: number }> = []
  const patterns = [
    /\*\*[^*\n]+\*\*/g,
    /(?<!\*)\*(?!\*)[^*\n]+\*(?!\*)/g,
    /~~[^~\n]+~~/g,
    /`[^`\n]+`/g,
    /\$\$[^$\n]+\$\$/g,
    /(?<!\$)\$(?!\$)[^$\n]+\$(?!\$)/g,
    /\\\([^\n]+\\\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) ranges.push({ start: match.index, end: match.index + match[0].length })
  }
  return ranges
}

export function sourceUnits(sourceText: string): SourceUnit[] {
  const units: SourceUnit[] = []

  for (const lineMatch of sourceText.matchAll(/[^\n]+/g)) {
    const line = lineMatch[0]
    const lineStart = lineMatch.index
    let segmentStart = 0
    const protectedRanges = protectedFormattingRanges(line)

    const pushSegment = (segmentEnd: number) => {
      const source = line.slice(segmentStart, segmentEnd)
      if (source.trim()) {
        units.push({
          index: units.length,
          start: lineStart + segmentStart,
          end: lineStart + segmentEnd,
          source,
        })
      }
      segmentStart = segmentEnd
    }

    for (let cursor = 0; cursor < line.length; cursor += 1) {
      const isProtected = protectedRanges.some((range) => cursor >= range.start && cursor < range.end)
      if (optionalBreaks.has(line[cursor]) && !isProtected) pushSegment(cursor + 1)
    }
    if (segmentStart < line.length) pushSegment(line.length)
  }

  return units
}

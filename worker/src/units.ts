export interface SourceUnit {
  index: number
  start: number
  end: number
  source: string
}

const sentenceEndings = new Set(['。', '！', '？', '!', '?', '；', ';'])
const closingPunctuation = new Set(['”', '’', '』', '」', '）', ')', '】', ']', '》'])

export function sourceUnits(sourceText: string): SourceUnit[] {
  const units: SourceUnit[] = []

  for (const lineMatch of sourceText.matchAll(/[^\n]+/g)) {
    const line = lineMatch[0]
    const lineStart = lineMatch.index
    let segmentStart = 0

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
      if (!sentenceEndings.has(line[cursor])) continue
      let segmentEnd = cursor + 1
      while (segmentEnd < line.length && closingPunctuation.has(line[segmentEnd])) segmentEnd += 1
      pushSegment(segmentEnd)
      cursor = segmentEnd - 1
    }
    if (segmentStart < line.length) pushSegment(line.length)
  }

  return units
}

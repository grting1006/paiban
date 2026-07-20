export type TemplateId = 'classic' | 'editorial' | 'minimal'
export type FontId = 'source-serif' | 'source-sans' | 'kaiti' | 'fangsong' | 'georgia' | 'baskerville' | 'inter'
export type LayoutPhase = 'idle' | 'running' | 'done'

export interface DocumentSettings {
  template: TemplateId
  font: FontId
  fontSize: number
  lineHeight: number
  accent: string
  zoom: number
}

export const initialSettings: DocumentSettings = {
  template: 'classic',
  font: 'source-serif',
  fontSize: 10.5,
  lineHeight: 1.7,
  accent: '#147d72',
  zoom: 78,
}

export const templates = [
  { id: 'classic', name: '经典' },
  { id: 'editorial', name: '杂志' },
  { id: 'minimal', name: '简约' },
] as const

export const fonts = [
  { id: 'source-serif', label: '思源宋体', group: '中文', css: '"Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", STSong, serif' },
  { id: 'source-sans', label: '思源黑体', group: '中文', css: '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: 'kaiti', label: '楷体', group: '中文', css: 'KaiTi, "STKaiti", serif' },
  { id: 'fangsong', label: '仿宋', group: '中文', css: 'FangSong, STFangsong, serif' },
  { id: 'georgia', label: 'Georgia', group: '英文', css: 'Georgia, "Songti SC", STSong, serif' },
  { id: 'baskerville', label: 'Baskerville', group: '英文', css: 'Baskerville, "Songti SC", STSong, serif' },
  { id: 'inter', label: 'Inter', group: '英文', css: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' },
] as const

export const fontSizes = [9.5, 10.5, 11.5] as const
export const lineHeights = [1.5, 1.7, 1.9] as const
export const accentColors = ['#147d72', '#df6c55', '#335c81', '#a48645'] as const

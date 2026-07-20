export type TemplateId = 'classic' | 'editorial' | 'minimal'
export type FontId = 'songti' | 'sans' | 'kai'
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
  font: 'songti',
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
  { id: 'songti', label: '思源宋体', css: 'Georgia, "Songti SC", "STSong", serif' },
  { id: 'sans', label: '现代黑体', css: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: 'kai', label: '楷体', css: 'KaiTi, "STKaiti", serif' },
] as const

export const fontSizes = [9.5, 10.5, 11.5] as const
export const lineHeights = [1.5, 1.7, 1.9] as const
export const accentColors = ['#147d72', '#df6c55', '#335c81', '#a48645'] as const

export type LayoutPhase = 'idle' | 'running' | 'done' | 'error'

export interface DocumentSettings {
  accent: string
  zoom: number
}

export const initialSettings: DocumentSettings = {
  accent: '#147d72',
  zoom: 78,
}

export const accentColors = ['#147d72', '#df6c55', '#335c81', '#a48645'] as const

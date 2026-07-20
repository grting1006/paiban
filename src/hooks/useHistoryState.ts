import { useCallback, useState } from 'react'

const HISTORY_LIMIT = 30

export function useHistoryState<T>(initialValue: T) {
  const [history, setHistory] = useState({ past: [] as T[], present: initialValue, future: [] as T[] })

  const setState = useCallback((next: T | ((current: T) => T)) => {
    setHistory((current) => {
      const resolved = typeof next === 'function' ? (next as (value: T) => T)(current.present) : next
      if (Object.is(resolved, current.present)) return current
      return {
        past: [...current.past.slice(-(HISTORY_LIMIT - 1)), current.present],
        present: resolved,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1)
      if (previous === undefined) return current
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0]
      if (next === undefined) return current
      return {
        past: [...current.past, current.present],
        present: next,
        future: current.future.slice(1),
      }
    })
  }, [])

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}

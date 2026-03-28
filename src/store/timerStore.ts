import { create } from 'zustand'

interface TimerState {
  gameTime: number       // seconds elapsed since match start
  running: boolean
  _intervalId: number | null

  start: () => void
  pause: () => void
  reset: () => void
  adjustTime: (delta: number) => void
  setTime: (seconds: number) => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  gameTime: 0,
  running: false,
  _intervalId: null,

  start: () => {
    if (get().running) return
    const id = window.setInterval(() => {
      set(s => ({ gameTime: s.gameTime + 1 }))
    }, 1000)
    set({ running: true, _intervalId: id })
  },

  pause: () => {
    const { _intervalId } = get()
    if (_intervalId !== null) clearInterval(_intervalId)
    set({ running: false, _intervalId: null })
  },

  reset: () => {
    const { _intervalId } = get()
    if (_intervalId !== null) clearInterval(_intervalId)
    set({ gameTime: 0, running: false, _intervalId: null })
  },

  adjustTime: (delta: number) => {
    set(s => ({ gameTime: Math.max(0, s.gameTime + delta) }))
  },

  setTime: (seconds: number) => {
    set({ gameTime: Math.max(0, seconds) })
  },
}))

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

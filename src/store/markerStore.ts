import { create } from 'zustand'
import type { MarkerState, MarkerStatus } from '../types'

interface MarkerStoreState {
  markers: Record<string, MarkerState>
  initMarkers: (ids: string[]) => void
  markCleared: (id: string, gameTime: number, respawnInterval: number) => void
  resetMarker: (id: string) => void
  resetAll: () => void
  getStatus: (id: string, gameTime: number, firstSpawn: number | undefined, spawnType: string) => MarkerStatus
}

export const useMarkerStore = create<MarkerStoreState>((set, get) => ({
  markers: {},

  initMarkers: (ids: string[]) => {
    const markers: Record<string, MarkerState> = {}
    ids.forEach(id => {
      markers[id] = { id, status: 'pending' }
    })
    set({ markers })
  },

  markCleared: (id: string, gameTime: number, respawnInterval: number) => {
    set(s => ({
      markers: {
        ...s.markers,
        [id]: {
          id,
          status: 'cleared',
          clearedAt: gameTime,
          nextSpawnAt: gameTime + respawnInterval,
        },
      },
    }))
  },

  resetMarker: (id: string) => {
    set(s => ({
      markers: {
        ...s.markers,
        [id]: { id, status: 'pending' },
      },
    }))
  },

  resetAll: () => {
    const ids = Object.keys(get().markers)
    const markers: Record<string, MarkerState> = {}
    ids.forEach(id => { markers[id] = { id, status: 'pending' } })
    set({ markers })
  },

  // Derive the live status of a marker given current game time
  getStatus: (id, gameTime, firstSpawn, spawnType) => {
    if (spawnType === 'static') return 'active'

    const state = get().markers[id]
    if (!state) return 'pending'

    // If manually cleared, check if respawn has occurred
    if (state.status === 'cleared' && state.nextSpawnAt !== undefined) {
      const timeUntil = state.nextSpawnAt - gameTime
      if (timeUntil <= 0) return 'active'
      if (timeUntil <= 5) return 'spawning'
      return 'cleared'
    }

    // Fixed-clock or on_kill before first clear: check firstSpawn
    if (firstSpawn !== undefined) {
      const timeUntilFirst = firstSpawn - gameTime
      if (timeUntilFirst > 5) return 'pending'
      if (timeUntilFirst > 0) return 'spawning'
    }

    return 'active'
  },
}))

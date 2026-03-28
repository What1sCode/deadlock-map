import { create } from 'zustand'
import type L from 'leaflet'

interface MapStoreState {
  map: L.Map | null
  setMap: (map: L.Map | null) => void
}

export const useMapStore = create<MapStoreState>(set => ({
  map: null,
  setMap: map => set({ map }),
}))

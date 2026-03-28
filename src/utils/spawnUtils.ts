import type { POI } from '../types'

export const MAP_WIDTH = 1264
export const MAP_HEIGHT = 1313

/**
 * Convert POI pixel coords (top-left origin, y-down) to
 * Leaflet CRS.Simple coords (bottom-left origin, y-up).
 */
export function toLeafletCoords(x: number, y: number): [number, number] {
  return [MAP_HEIGHT - y, x]
}

/**
 * Returns seconds remaining until next spawn.
 * Returns 0 if already active.
 */
export function timeUntilSpawn(poi: POI, gameTime: number, clearedAt?: number): number {
  if (poi.spawnType === 'static') return 0

  if (clearedAt !== undefined && poi.respawnInterval !== undefined) {
    const nextSpawn = clearedAt + poi.respawnInterval
    return Math.max(0, nextSpawn - gameTime)
  }

  if (poi.firstSpawn !== undefined) {
    return Math.max(0, poi.firstSpawn - gameTime)
  }

  return 0
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`
  return `${s}s`
}

export function markerSize(poi: POI): number {
  switch (poi.size) {
    case 'large': return 36
    case 'medium': return 30
    default: return 24
  }
}

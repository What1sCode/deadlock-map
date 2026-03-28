export type POICategory =
  | 'tier1'
  | 'tier2'
  | 'tier3'
  | 'bridge_buff'
  | 'boss'
  | 'urn'
  | 'shop'
  | 'objective'
  | 'spawn'

export type SpawnType =
  | 'static'       // Always visible, no timer (shops, spawn rooms)
  | 'fixed_clock'  // Spawns at fixed game-time intervals regardless of kill
  | 'on_kill'      // Respawn timer starts when player marks it cleared

export type MarkerStatus = 'pending' | 'active' | 'cleared' | 'spawning'

export interface POI {
  id: string
  name: string
  category: POICategory
  // Pixel coordinates in image space (top-left origin, y-down)
  x: number
  y: number
  description?: string
  spawnType: SpawnType
  firstSpawn?: number       // seconds from match start
  respawnInterval?: number  // seconds
  teamSide?: 'amber' | 'sapphire' | 'neutral'
  size?: 'small' | 'medium' | 'large'
}

export interface MarkerState {
  id: string
  status: MarkerStatus
  clearedAt?: number   // game time (seconds) when cleared
  nextSpawnAt?: number // computed game time for next spawn
}

export interface CategoryMeta {
  label: string
  icon: string  // emoji/char used in tooltips and legend
  color: string
}

export const CATEGORY_META: Record<POICategory, CategoryMeta> = {
  tier1:       { label: 'T1 Camp',      icon: '▲',  color: '#86efac' },
  tier2:       { label: 'T2 Camp',      icon: '▲▲', color: '#fbbf24' },
  tier3:       { label: 'T3 Camp',      icon: '▲▲▲',color: '#f87171' },
  bridge_buff: { label: 'Bridge Buff',  icon: '◆',  color: '#67e8f9' },
  boss:        { label: 'Boss',         icon: '💀', color: '#ef4444' },
  urn:         { label: 'Urn',          icon: '🏺', color: '#c084fc' },
  shop:        { label: 'Shop',         icon: '🛒', color: '#fbbf24' },
  objective:   { label: 'Objective',    icon: '⚔️', color: '#60a5fa' },
  spawn:       { label: 'Spawn',        icon: '🏠', color: '#fb923c' },
}

// Default spawn data per category — used as fallback in pois.json entries
export const SPAWN_DEFAULTS: Partial<Record<POICategory, { firstSpawn: number; respawnInterval: number; spawnType: SpawnType }>> = {
  tier1:       { firstSpawn: 120,  respawnInterval: 85,  spawnType: 'on_kill' },
  tier2:       { firstSpawn: 360,  respawnInterval: 420, spawnType: 'on_kill' },
  tier3:       { firstSpawn: 480,  respawnInterval: 600, spawnType: 'on_kill' },
  bridge_buff: { firstSpawn: 300,  respawnInterval: 300, spawnType: 'fixed_clock' },
  boss:        { firstSpawn: 600,  respawnInterval: 360, spawnType: 'fixed_clock' },
  urn:         { firstSpawn: 300,  respawnInterval: 180, spawnType: 'fixed_clock' },
}

export const TIER_BARS: Partial<Record<POICategory, number>> = {
  tier1: 1,
  tier2: 2,
  tier3: 3,
}

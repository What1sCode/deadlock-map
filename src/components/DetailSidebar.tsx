import type { POI } from '../types'
import { CATEGORY_META } from '../types'
import { useTimerStore, formatTime } from '../store/timerStore'
import { useMarkerStore } from '../store/markerStore'
import { formatCountdown, timeUntilSpawn } from '../utils/spawnUtils'

interface DetailSidebarProps {
  poi: POI | null
  onClose: () => void
}

const TEAM_LABEL: Record<string, string> = {
  amber: 'Amber Hand',
  sapphire: 'Sapphire Flame',
  neutral: 'Neutral',
}

const TEAM_COLOR: Record<string, string> = {
  amber: '#fbbf24',
  sapphire: '#60a5fa',
  neutral: '#94a3b8',
}

export function DetailSidebar({ poi, onClose }: DetailSidebarProps) {
  const gameTime = useTimerStore(s => s.gameTime)
  const { markers, markCleared, resetMarker, getStatus } = useMarkerStore()

  if (!poi) return null

  const meta = CATEGORY_META[poi.category]
  const markerState = markers[poi.id]
  const status = getStatus(poi.id, gameTime, poi.firstSpawn, poi.spawnType)
  const countdown = timeUntilSpawn(poi, gameTime, markerState?.clearedAt)
  const isStatic = poi.spawnType === 'static'

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Not Yet Spawned', color: '#94a3b8' },
    active:   { label: 'Active',          color: '#4ade80' },
    cleared:  { label: 'Cleared',         color: '#f87171' },
    spawning: { label: 'Spawning Soon!',  color: '#fbbf24' },
  }

  const statusInfo = statusLabel[status] ?? statusLabel.active

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-[#0d1018] border-l border-[#2d3448] z-[1000] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[#2d3448]">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 flex-shrink-0"
            style={{ background: `${meta.color}22`, borderColor: meta.color }}
          >
            {meta.icon}
          </span>
          <div>
            <div className="text-white font-bold text-sm leading-tight">{poi.name}</div>
            <div className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.label}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors text-lg leading-none mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Description */}
        {poi.description && (
          <p className="text-slate-300 text-sm leading-relaxed">{poi.description}</p>
        )}

        {/* Team */}
        {poi.teamSide && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Team</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${TEAM_COLOR[poi.teamSide]}22`, color: TEAM_COLOR[poi.teamSide] }}
            >
              {TEAM_LABEL[poi.teamSide]}
            </span>
          </div>
        )}

        {/* Size */}
        {poi.size && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Size</span>
            <span className="text-xs font-bold text-slate-300 capitalize">{poi.size}</span>
          </div>
        )}

        {/* Spawn Info */}
        {!isStatic && (
          <div className="bg-[#1a1e2e] rounded-lg p-3 flex flex-col gap-2">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">Spawn Info</div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400">First Spawn</span>
              <span className="text-slate-200 font-mono">
                {poi.firstSpawn !== undefined ? formatTime(poi.firstSpawn) : '—'}
              </span>
            </div>

            {poi.respawnInterval !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Respawn</span>
                <span className="text-slate-200 font-mono">{poi.respawnInterval}s</span>
              </div>
            )}

            {poi.spawnType === 'on_kill' && (
              <div className="text-[10px] text-slate-500 italic">
                Respawn timer starts when marked cleared
              </div>
            )}

            {poi.spawnType === 'fixed_clock' && (
              <div className="text-[10px] text-slate-500 italic">
                Spawns on a fixed game clock
              </div>
            )}
          </div>
        )}

        {/* Live Status */}
        {!isStatic && (
          <div className="bg-[#1a1e2e] rounded-lg p-3 flex flex-col gap-2">
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">Live Status</div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: statusInfo.color }}
              />
              <span className="text-sm font-semibold" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>
            {countdown > 0 && (
              <div className="text-xs text-slate-400">
                Spawns in{' '}
                <span className="text-white font-mono font-bold">{formatCountdown(countdown)}</span>
              </div>
            )}
            {markerState?.nextSpawnAt !== undefined && status !== 'active' && (
              <div className="text-xs text-slate-500">
                Next spawn at <span className="font-mono text-slate-300">{formatTime(markerState.nextSpawnAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {poi.spawnType === 'on_kill' && (
        <div className="p-4 border-t border-[#2d3448] flex flex-col gap-2">
          {status === 'active' || status === 'spawning' ? (
            <button
              onClick={() =>
                poi.respawnInterval !== undefined &&
                markCleared(poi.id, gameTime, poi.respawnInterval)
              }
              className="w-full py-2 rounded-lg font-bold text-sm bg-[#f87171] text-black hover:bg-red-400 transition-colors"
            >
              Mark as Cleared
            </button>
          ) : (
            <button
              onClick={() => resetMarker(poi.id)}
              className="w-full py-2 rounded-lg font-bold text-sm bg-[#1e2130] text-slate-300 hover:bg-[#2d3448] transition-colors border border-[#2d3448]"
            >
              Undo Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

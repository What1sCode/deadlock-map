import { useState } from 'react'
import type { POI } from '../types'
import { CATEGORY_META } from '../types'
import { toLeafletCoords } from '../utils/spawnUtils'
import { useMapStore } from '../store/mapStore'

interface SearchBarProps {
  pois: POI[]
  onSelect: (poi: POI) => void
}

export function SearchBar({ pois, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const map = useMapStore(s => s.map)

  const results =
    query.trim().length > 0
      ? pois
          .filter(
            p =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 8)
      : []

  function select(poi: POI) {
    if (map) {
      const pos = toLeafletCoords(poi.x, poi.y)
      map.flyTo(pos, Math.max(map.getZoom(), 0), { duration: 0.8 })
    }
    onSelect(poi)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search locations…"
        className="bg-[#12151f] border border-[#2d3448] rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[#3b82f6] transition-colors w-52"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-[#12151f] border border-[#2d3448] rounded-xl overflow-hidden shadow-2xl z-[2000]">
          {results.map(poi => {
            const meta = CATEGORY_META[poi.category]
            return (
              <button
                key={poi.id}
                onMouseDown={() => select(poi)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#1e2130] transition-colors text-left"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border"
                  style={{
                    background: `${meta.color}22`,
                    borderColor: meta.color,
                  }}
                >
                  {meta.icon}
                </span>
                <div>
                  <div className="text-xs text-white font-medium">{poi.name}</div>
                  <div className="text-[10px]" style={{ color: meta.color }}>
                    {meta.label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

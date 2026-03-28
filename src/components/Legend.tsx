import type { POICategory } from '../types'
import { CATEGORY_META, TIER_BARS } from '../types'

interface LegendProps {
  visible: Record<POICategory, boolean>
  onToggle: (cat: POICategory) => void
}

/** Mini version of the stacked-bar camp icon for the legend */
function TierIcon({ barCount, color }: { barCount: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 14 }}>
      <div
        style={{
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `7px solid ${color}`,
        }}
      />
      {Array(barCount).fill(null).map((_, i) => (
        <div
          key={i}
          style={{ width: 12, height: 4, background: color, borderRadius: 1 }}
        />
      ))}
    </div>
  )
}

function BuffIcon({ color }: { color: string }) {
  return (
    <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 9, height: 9,
          background: color,
          transform: 'rotate(45deg)',
          borderRadius: 1,
        }}
      />
    </div>
  )
}

export function Legend({ visible, onToggle }: LegendProps) {
  const categories = Object.keys(CATEGORY_META) as POICategory[]

  return (
    <div className="bg-[#12151f] border border-[#2d3448] rounded-xl p-3 shadow-xl w-48">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
        Legend
      </div>
      <div className="flex flex-col gap-0.5">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat]
          const on = visible[cat]
          const barCount = TIER_BARS[cat]

          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                on ? 'hover:bg-[#1e2130]' : 'opacity-40'
              }`}
            >
              {/* Icon */}
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {barCount !== undefined ? (
                  <TierIcon barCount={barCount} color={on ? meta.color : '#3d4663'} />
                ) : cat === 'bridge_buff' ? (
                  <BuffIcon color={on ? meta.color : '#3d4663'} />
                ) : (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border"
                    style={{
                      background: on ? `${meta.color}22` : '#1e2130',
                      borderColor: on ? meta.color : '#3d4663',
                    }}
                  >
                    {meta.icon}
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-300 font-medium leading-none">
                {meta.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { POI } from '../types'
import { CATEGORY_META, TIER_BARS } from '../types'
import { useTimerStore } from '../store/timerStore'
import { useMarkerStore } from '../store/markerStore'
import { toLeafletCoords, formatCountdown, timeUntilSpawn, markerSize } from '../utils/spawnUtils'

interface POIMarkerProps {
  poi: POI
  onClick: (poi: POI) => void
}

/** Builds the HTML for a camp tier marker (stacked bars + triangle) */
function buildCampIcon(barCount: number, color: string, status: string): { html: string; width: number; height: number } {
  const barW = 13
  const barH = 5
  const triBase = 13
  const triH = 8
  const gap = 1

  const totalH = triH + gap + barCount * (barH + gap)
  const bars = Array(barCount)
    .fill(null)
    .map(
      () =>
        `<div style="width:${barW}px;height:${barH}px;background:${color};border-radius:2px;margin-top:${gap}px;"></div>`,
    )
    .join('')

  const html = `
    <div class="camp-marker ${status}" style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="width:0;height:0;border-left:${Math.ceil(triBase / 2)}px solid transparent;border-right:${Math.ceil(triBase / 2)}px solid transparent;border-bottom:${triH}px solid ${color};"></div>
      ${bars}
    </div>
  `

  return { html, width: triBase, height: totalH }
}

/** Builds the HTML for a bridge buff marker (diamond shape) */
function buildBuffIcon(color: string, status: string): { html: string; width: number; height: number } {
  const size = 12
  const html = `
    <div class="camp-marker ${status}" style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="width:${size}px;height:${size}px;background:${color};transform:rotate(45deg);border-radius:2px;box-shadow:0 0 4px ${color}88;"></div>
    </div>
  `
  return { html, width: size, height: size }
}

export function POIMarker({ poi, onClick }: POIMarkerProps) {
  const gameTime = useTimerStore(s => s.gameTime)
  const { markers, getStatus } = useMarkerStore()
  const markerState = markers[poi.id]
  const status = getStatus(poi.id, gameTime, poi.firstSpawn, poi.spawnType)
  const meta = CATEGORY_META[poi.category]
  const countdown = timeUntilSpawn(poi, gameTime, markerState?.clearedAt)

  const isCamp = poi.category in TIER_BARS || poi.category === 'bridge_buff'

  const icon = useMemo(() => {
    const countdownBadge =
      countdown > 0
        ? `<div class="marker-countdown">${formatCountdown(countdown)}</div>`
        : ''

    if (poi.category === 'bridge_buff') {
      const { html, width, height } = buildBuffIcon(meta.color, status)
      return L.divIcon({
        className: '',
        html: html.replace('</div>\n  ', `${countdownBadge}</div>\n  `),
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2],
      })
    }

    const barCount = TIER_BARS[poi.category]
    if (barCount !== undefined) {
      const { html, width, height } = buildCampIcon(barCount, meta.color, status)
      return L.divIcon({
        className: '',
        html: html.replace('</div>\n  ', `${countdownBadge}</div>\n  `),
        iconSize: [width, height],
        iconAnchor: [width / 2, height],
      })
    }

    // Circle marker for non-camp POIs
    const size = markerSize(poi)
    return L.divIcon({
      className: '',
      html: `
        <div class="poi-marker ${poi.category} ${status}" style="width:${size}px;height:${size}px;position:relative;">
          ${meta.icon}
          ${countdownBadge}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }, [poi, status, countdown, meta, isCamp])

  const position = toLeafletCoords(poi.x, poi.y)

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: () => onClick(poi) }}
      zIndexOffset={status === 'spawning' ? 1000 : 0}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
        <div
          style={{
            background: '#0d1018',
            border: `1px solid ${meta.color}`,
            borderRadius: 8,
            padding: '6px 10px',
            minWidth: 130,
          }}
        >
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
            {poi.name}
          </div>
          <div style={{ color: meta.color, fontSize: 11 }}>{meta.label}</div>
          {countdown > 0 && (
            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
              Spawns in{' '}
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                {formatCountdown(countdown)}
              </span>
            </div>
          )}
          {status === 'active' && poi.spawnType !== 'static' && (
            <div style={{ color: '#4ade80', fontSize: 11, marginTop: 4 }}>● Active</div>
          )}
          {status === 'cleared' && (
            <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>● Cleared</div>
          )}
          {poi.spawnType !== 'static' && (
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>Click for details</div>
          )}
        </div>
      </Tooltip>
    </Marker>
  )
}

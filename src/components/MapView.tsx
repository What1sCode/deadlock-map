import { useEffect, useState } from 'react'
import { MapContainer, ImageOverlay, LayerGroup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { POI, POICategory } from '../types'
import { CATEGORY_META } from '../types'
import { MAP_WIDTH, MAP_HEIGHT } from '../utils/spawnUtils'
import { useMarkerStore } from '../store/markerStore'
import { useMapStore } from '../store/mapStore'
import { POIMarker } from './POIMarker'
import { Legend } from './Legend'
import { MatchTimer } from './MatchTimer'
import { DetailSidebar } from './DetailSidebar'
import { CoordPicker } from './CoordPicker'
import { SearchBar } from './SearchBar'
import poisData from '../data/pois.json'

const pois = poisData as POI[]
const MAP_BOUNDS: L.LatLngBoundsExpression = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]

const MAP_IMAGE_URL = '/map.png'

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as POICategory[]
const DEFAULT_VISIBLE = ALL_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat]: true }),
  {} as Record<POICategory, boolean>,
)

/** Registers the Leaflet map instance into the global store so SearchBar can call flyTo */
function MapRegistrar() {
  const map = useMap()
  const setMap = useMapStore(s => s.setMap)
  useEffect(() => {
    setMap(map)
    return () => setMap(null)
  }, [map, setMap])
  return null
}

export function MapView() {
  const initMarkers = useMarkerStore(s => s.initMarkers)
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const [visible, setVisible] = useState<Record<POICategory, boolean>>(DEFAULT_VISIBLE)
  const [coordPickerActive, setCoordPickerActive] = useState(false)

  useEffect(() => {
    initMarkers(pois.map(p => p.id))
  }, [initMarkers])

  function toggleCategory(cat: POICategory) {
    setVisible(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const grouped = ALL_CATEGORIES.reduce(
    (acc, cat) => ({ ...acc, [cat]: pois.filter(p => p.category === cat) }),
    {} as Record<POICategory, POI[]>,
  )

  return (
    <div className="relative w-full h-full">
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <MapContainer
        crs={L.CRS.Simple}
        bounds={MAP_BOUNDS}
        minZoom={-1}
        maxZoom={4}
        zoom={0}
        center={[MAP_HEIGHT / 2, MAP_WIDTH / 2]}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <MapRegistrar />
        <ImageOverlay url={MAP_IMAGE_URL} bounds={MAP_BOUNDS} />

        {ALL_CATEGORIES.map(
          cat =>
            visible[cat] && (
              <LayerGroup key={cat}>
                {grouped[cat].map(poi => (
                  <POIMarker key={poi.id} poi={poi} onClick={setSelectedPOI} />
                ))}
              </LayerGroup>
            ),
        )}

        <CoordPicker active={coordPickerActive} />
      </MapContainer>

      {/* ── Timer (top center) ──────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
        <MatchTimer />
      </div>

      {/* ── Title + Search (top left) ───────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#12151f] border border-[#2d3448] rounded-xl px-4 py-2">
          <span className="text-white font-bold text-sm tracking-wide">Deadlock</span>
          <span className="text-slate-500 font-medium text-sm"> · Map Tracker</span>
        </div>
        <SearchBar pois={pois} onSelect={setSelectedPOI} />
      </div>

      {/* ── Toolbar (top right) ─────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end pointer-events-auto">
        <button
          onClick={() => setCoordPickerActive(v => !v)}
          title="Toggle Coord Picker (for calibrating POI positions)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border transition-colors shadow-lg ${
            coordPickerActive
              ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
              : 'bg-[#12151f] border-[#2d3448] text-slate-400 hover:text-white'
          }`}
        >
          📍
        </button>
      </div>

      {/* ── Legend (bottom left) ────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-4 z-[1000] pointer-events-auto">
        <Legend visible={visible} onToggle={toggleCategory} />
      </div>

      {/* ── Detail sidebar (right) ──────────────────────────────────────── */}
      {selectedPOI && (
        <DetailSidebar poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
      )}
    </div>
  )
}

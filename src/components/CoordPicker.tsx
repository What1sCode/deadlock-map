import { useState, useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import { MAP_HEIGHT } from '../utils/spawnUtils'

interface CoordPickerProps {
  active: boolean
}

interface PickedCoord {
  x: number
  y: number
  label: string
}

const STORAGE_KEY = 'deadlock_coord_picker'

function loadFromStorage(): PickedCoord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PickedCoord[]) : []
  } catch {
    return []
  }
}

function saveToStorage(coords: PickedCoord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coords))
}

function PickerEvents({ onPick }: { onPick: (c: PickedCoord) => void }) {
  useMapEvents({
    click(e) {
      const x = Math.round(e.latlng.lng)
      const y = Math.round(MAP_HEIGHT - e.latlng.lat)
      onPick({ x, y, label: '' })
    },
  })
  return null
}

export function CoordPicker({ active }: CoordPickerProps) {
  const [coords, setCoords] = useState<PickedCoord[]>(loadFromStorage)
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [labelInput, setLabelInput] = useState('')

  // Persist to localStorage whenever coords change
  useEffect(() => {
    saveToStorage(coords)
  }, [coords])

  function addCoord(c: PickedCoord) {
    setCoords(prev => [c, ...prev])
  }

  function removeCoord(i: number) {
    setCoords(prev => prev.filter((_, idx) => idx !== i))
  }

  function saveLabel(i: number) {
    setCoords(prev => prev.map((c, idx) => idx === i ? { ...c, label: labelInput } : c))
    setEditingLabel(null)
    setLabelInput('')
  }

  function copyAll() {
    const json = JSON.stringify(
      coords.map(c => ({ label: c.label || 'unlabeled', x: c.x, y: c.y })),
      null,
      2,
    )
    navigator.clipboard.writeText(json)
  }

  function downloadAll() {
    const json = JSON.stringify(
      coords.map(c => ({ label: c.label || 'unlabeled', x: c.x, y: c.y })),
      null,
      2,
    )
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deadlock_coords.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearAll() {
    if (confirm('Clear all saved coordinates?')) {
      setCoords([])
    }
  }

  if (!active) return null

  return (
    <>
      <PickerEvents onPick={addCoord} />
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#0d1018f0',
          border: '1px solid #f59e0b',
          borderRadius: 10,
          padding: '10px 14px',
          width: 340,
          maxHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>
            📍 Coord Picker ({coords.length} saved)
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={copyAll}
              disabled={coords.length === 0}
              style={{
                background: '#1e2130', border: '1px solid #3d4663', borderRadius: 5,
                color: '#94a3b8', fontSize: 10, padding: '2px 7px', cursor: 'pointer',
              }}
            >
              Copy JSON
            </button>
            <button
              onClick={downloadAll}
              disabled={coords.length === 0}
              style={{
                background: '#f59e0b', border: 'none', borderRadius: 5,
                color: '#000', fontWeight: 700, fontSize: 10, padding: '2px 7px', cursor: 'pointer',
              }}
            >
              ↓ Export
            </button>
            <button
              onClick={clearAll}
              disabled={coords.length === 0}
              style={{
                background: 'none', border: 'none', color: '#f87171',
                fontSize: 10, padding: '2px 5px', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{ color: '#64748b', fontSize: 10 }}>
          Click map to add · Click label to name · Data saved across reloads
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {coords.length === 0 && (
            <div style={{ color: '#475569', fontSize: 11, paddingTop: 4 }}>
              No coords yet — click anywhere on the map.
            </div>
          )}
          {coords.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'monospace', fontSize: 11,
                padding: '3px 4px', borderRadius: 4,
                background: i === 0 ? '#1a2030' : 'transparent',
              }}
            >
              <span style={{ color: '#475569', width: 22, flexShrink: 0 }}>#{coords.length - i}</span>
              <span style={{ color: '#60a5fa', flexShrink: 0 }}>x:{c.x}</span>
              <span style={{ color: '#4ade80', flexShrink: 0 }}>y:{c.y}</span>

              {editingLabel === i ? (
                <input
                  autoFocus
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveLabel(i); if (e.key === 'Escape') setEditingLabel(null) }}
                  onBlur={() => saveLabel(i)}
                  style={{
                    flex: 1, background: '#1e2130', border: '1px solid #3d4663',
                    borderRadius: 3, color: '#fff', fontSize: 10, padding: '1px 4px',
                  }}
                />
              ) : (
                <span
                  onClick={() => { setEditingLabel(i); setLabelInput(c.label) }}
                  style={{
                    flex: 1, color: c.label ? '#e2e8f0' : '#334155',
                    cursor: 'pointer', fontSize: 10,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  title="Click to label this coord"
                >
                  {c.label || 'click to label…'}
                </span>
              )}

              <button
                onClick={() => navigator.clipboard.writeText(`"x": ${c.x}, "y": ${c.y}`)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, flexShrink: 0 }}
                title="Copy this coord"
              >
                📋
              </button>
              <button
                onClick={() => removeCoord(i)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

import { useTimerStore, formatTime } from '../store/timerStore'
import { useMarkerStore } from '../store/markerStore'

export function MatchTimer() {
  const { gameTime, running, start, pause, reset, adjustTime } = useTimerStore()
  const resetAll = useMarkerStore(s => s.resetAll)

  function handleReset() {
    reset()
    resetAll()
  }

  return (
    <div className="flex items-center gap-3 bg-[#12151f] border border-[#2d3448] rounded-xl px-4 py-2 shadow-xl select-none">
      {/* Clock display */}
      <div
        className="font-mono text-3xl font-bold tracking-widest w-24 text-center"
        style={{ color: running ? '#60a5fa' : gameTime > 0 ? '#fbbf24' : '#94a3b8' }}
      >
        {formatTime(gameTime)}
      </div>

      {/* Adjust buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => adjustTime(10)}
          className="text-[10px] font-bold text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#2d3448] transition-colors"
        >
          +10s
        </button>
        <button
          onClick={() => adjustTime(-10)}
          className="text-[10px] font-bold text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#2d3448] transition-colors"
        >
          −10s
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-1.5">
        <button
          onClick={running ? pause : start}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            running
              ? 'bg-[#fbbf24] text-black hover:bg-yellow-300'
              : 'bg-[#3b82f6] text-white hover:bg-blue-400'
          }`}
        >
          {running ? '⏸ Pause' : gameTime > 0 ? '▶ Resume' : '▶ Start'}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[#1e2130] text-slate-300 hover:bg-[#2d3448] transition-colors border border-[#2d3448]"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

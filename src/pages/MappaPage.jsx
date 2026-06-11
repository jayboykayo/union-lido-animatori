import { useState, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

export default function MappaPage() {
  const [scale, setScale] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef(null)

  const zoomIn = () => setScale(s => Math.min(s + 0.3, 4))
  const zoomOut = () => setScale(s => Math.max(s - 0.3, 0.5))
  const reset = () => setScale(1)

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'max-w-lg mx-auto px-4 py-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Mappa Union Lido</h1>
        <button
          onClick={() => { setFullscreen(!fullscreen); setScale(1) }}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Mappa scrollabile */}
      <div
        ref={containerRef}
        className="overflow-auto rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        style={{ height: fullscreen ? 'calc(100vh - 80px)' : '65vh' }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
            width: `${100 / scale}%`,
          }}
        >
          <img
            src="/mappa2.pdf"
            alt="Mappa Union Lido"
            className="w-full h-auto select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Controlli zoom */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 active:scale-95 transition"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={reset}
          className="px-5 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold active:scale-95 transition"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={zoomIn}
          disabled={scale >= 4}
          className="w-11 h-11 rounded-2xl bg-mare-500 flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition"
        >
          <ZoomIn size={20} />
        </button>
      </div>
    </div>
  )
}
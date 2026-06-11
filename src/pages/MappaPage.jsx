import { useState } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'

const ZONE = [
  { id: 'vovi_vegs', label: 'Vovi Vegs', x: 45, y: 55, url: 'https://maps.app.goo.gl/fBHHVmFmuQiUmQCj6' },
  { id: 'aquapark_marino', label: 'Aqua Park Marino', x: 42, y: 35, url: 'https://maps.app.goo.gl/HBtSuAo3XtVYc8fK8' },
  { id: 'beach_volley', label: 'Campi Beach Volley', x: 60, y: 15, url: 'https://maps.app.goo.gl/xsEEQ4jbc8jV5uHx8' },
  { id: 'lido55', label: 'Lido 55', x: 18, y: 65, url: 'https://maps.app.goo.gl/dmSprWoSuEr7RUEg7' },
  { id: 'luxury_beach', label: 'Luxury Beach', x: 72, y: 10, url: 'https://maps.app.goo.gl/CgUYrd6sDyasuinq8' },
  { id: 'aquapark_laguna', label: 'Aqua Park Laguna', x: 78, y: 75, url: 'https://maps.app.goo.gl/CgUYrd6sDyasuinq8' },
  { id: 'beach_bar', label: 'Beach Bar', x: 55, y: 12, url: 'https://maps.app.goo.gl/goidyoxDcc8HFQQJA' },
  { id: 'info_point', label: 'Info Point', x: 82, y: 45, url: 'https://maps.app.goo.gl/goidyoxDcc8HFQQJA' },
  { id: 'il_borgo', label: 'Il Borgo', x: 35, y: 48, url: 'https://maps.app.goo.gl/eSRSoFuj8RryCEnr5' },
  { id: 'da_italo', label: 'Da Italo', x: 50, y: 70, url: 'https://maps.app.goo.gl/iEhicZBGip7FEUGs9' },
  { id: 'casa_venezia', label: 'Casa Venezia', x: 65, y: 55, url: 'https://maps.app.goo.gl/KMXjPYWr1BsqgViT9' },
]

export default function MappaPage() {
  const [fullscreen, setFullscreen] = useState(false)
  const [tooltip, setTooltip] = useState(null)

  const openMaps = (url) => {
  window.open(url, '_blank')
}
  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : 'max-w-lg mx-auto px-4 py-5'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Mappa Union Lido</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tocca un punto per aprire in Maps</p>
        </div>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      <div
        className="relative rounded-2xl overflow-auto border border-gray-100 dark:border-gray-700 bg-gray-50"
        style={{ height: fullscreen ? 'calc(100vh - 90px)' : '70vh' }}
      >
        <div className="relative min-w-[600px]">
          <img
            src="/mappa2.png"
            alt="Mappa Union Lido"
            className="w-full h-auto select-none"
            draggable={false}
          />

          {/* Punti interattivi */}
          {ZONE.map(zona => (
            <button
              key={zona.id}
              onClick={() => {
                setTooltip(zona)
              }}
              style={{ left: `${zona.x}%`, top: `${zona.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            >
              <div className="w-5 h-5 bg-mare-500 border-2 border-white rounded-full shadow-lg animate-pulse group-active:scale-125 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Tooltip popup */}
      {tooltip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4" onClick={() => setTooltip(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-mare-500 font-semibold uppercase tracking-wide mb-1">Posizione</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{tooltip.label}</h3>
              </div>
              <button onClick={() => setTooltip(null)} className="p-1 text-gray-400">
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => { openMaps(tooltip.url); setTooltip(null) }}
              className="btn-primary w-full"
            >
              📍 Apri in Maps
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
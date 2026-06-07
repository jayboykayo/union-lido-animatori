import { Waves } from 'lucide-react'

export default function LoadingSpinner({ fullScreen = true }) {
  if (!fullScreen) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-mare-200 border-t-mare-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-mare-500 to-corallo-500 flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mb-6 animate-bounce-gentle">
        <Waves size={40} className="text-white" />
      </div>
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="text-white/80 mt-4 text-sm font-medium">Caricamento...</p>
    </div>
  )
}

const colors = {
  'Mascotte':      'bg-pink-100 text-pink-700',
  'Mini Club':     'bg-purple-100 text-purple-700',
  'Maxi Club':     'bg-indigo-100 text-indigo-700',
  'Sport Coach':   'bg-green-100 text-green-700',
  'Fitness Coach': 'bg-orange-100 text-orange-700',
  'Service':       'bg-gray-100 text-gray-600',
  'moderatore':    'bg-red-100 text-red-700',
  'capo':          'bg-mare-100 text-mare-700',
  'animatore':     'bg-corallo-100 text-corallo-700',
}

export default function TipoBadge({ tipo, size = 'sm' }) {
  const cls = colors[tipo] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`badge ${cls} ${size === 'xs' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      {tipo}
    </span>
  )
}

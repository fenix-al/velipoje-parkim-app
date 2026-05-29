export default function MapLegend() {
  const items = [
    { color: '#22c55e', label: 'I lirë' },
    { color: '#ef4444', label: 'I zënë' },
    { color: '#6b7280', label: 'Jashtë shërbimit' },
    { color: '#eab308', label: 'Duke u përpunuar' },
  ]

  return (
    <div className="absolute bottom-16 left-2 z-30 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
      <div className="flex flex-col gap-1">
        {items.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

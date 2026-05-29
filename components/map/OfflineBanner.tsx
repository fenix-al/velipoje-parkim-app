import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  return (
    <div
      role="alert"
      className="absolute top-0 left-0 right-0 z-50 bg-amber-500 text-white text-sm font-medium flex items-center justify-center gap-2 py-2 px-4"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>Nuk ka lidhje interneti — veprimet janë të çaktivizuara</span>
    </div>
  )
}

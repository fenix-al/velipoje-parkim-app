'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-gray-900">Ndodhi një gabim</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Diçka shkoi keq gjatë ngarkimit të faqes. Provo përsëri — nëse problemi
          vazhdon, kontakto administratorin.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">Kodi: {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-6">
          <RotateCcw className="h-4 w-4" />
          Provo përsëri
        </Button>
      </div>
    </main>
  )
}

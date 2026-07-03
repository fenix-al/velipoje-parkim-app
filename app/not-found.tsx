import Link from 'next/link'
import { MapPinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <MapPinOff className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-gray-900">Faqja nuk u gjet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adresa që kërkove nuk ekziston ose është zhvendosur.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Kthehu në fillim</Link>
        </Button>
      </div>
    </main>
  )
}

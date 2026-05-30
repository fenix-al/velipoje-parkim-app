import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCompletedSessions } from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import { formatDuration, formatLocal, startOfDayTirane } from '@/lib/utils/time'

export const metadata: Metadata = {
  title: 'Historiku im - Parkimi',
}

export default async function EmployeeHistoryPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const sessions = await getCompletedSessions({
    employeeId: profile.id,
    from: startOfDayTirane(),
    limit: 50,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Historiku im</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seancat e mbyllura sot nga profili yt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seancat e fundit ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sessions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nuk ke ende seanca te mbyllura sot.
              </div>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.zone_code}</Badge>
                      <p className="font-semibold text-slate-900">{session.spot_code}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatLocal(session.occupied_at, 'dd/MM HH:mm')} - {formatLocal(session.released_at, 'HH:mm')}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {formatDuration(session.duration_minutes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

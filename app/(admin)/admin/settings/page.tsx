import { Metadata } from 'next'
import { getProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Cilësimet — Admin Parkimi',
}

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="space-y-5 max-w-xl">
      <PageHeader title="Cilësimet" description="Llogaria dhe informacioni i sistemit." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Llogaria ime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Emri</span>
            <span className="font-medium">{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Roli</span>
            <Badge>{profile?.role === 'supervisor' ? 'Supervisor' : 'Administrator'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sistemi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zona kohore</span>
            <span>Europe/Tirane (UTC+2)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versioni</span>
            <span>1.0.0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

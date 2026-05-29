import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Profili — Parkimi Velipojë',
}

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrator',
  supervisor: 'Supervisor',
  employee:   'Punonjës',
}

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-lg font-semibold">Profili im</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacionet e llogarisë</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Emri</p>
            <p className="font-medium">{profile.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Roli</p>
            <Badge variant="secondary">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Statusi</p>
            <Badge variant={profile.is_active ? 'success' : 'destructive'}>
              {profile.is_active ? 'Aktiv' : 'Joaktiv'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="destructive" className="w-full">
          Dil nga llogaria
        </Button>
      </form>
    </div>
  )
}

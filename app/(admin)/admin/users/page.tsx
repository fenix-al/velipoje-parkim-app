import { Metadata } from 'next'
import { getAllProfiles } from '@/lib/db/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatLocal } from '@/lib/utils/time'
import UserActions from '@/components/admin/UserActions'

export const metadata: Metadata = {
  title: 'Përdoruesit — Admin Parkimi',
}

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrator',
  supervisor: 'Supervisor',
  employee:   'Punonjës',
}

export default async function UsersPage() {
  const profiles = await getAllProfiles()

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Përdoruesit ({profiles.length})</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">Emri</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Roli</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Statusi</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Regjistruar</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{p.full_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.role === 'admin' ? 'default' : 'secondary'}>
                        {ROLE_LABELS[p.role] ?? p.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.is_active ? 'success' : 'destructive'}>
                        {p.is_active ? 'Aktiv' : 'Joaktiv'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatLocal(p.created_at, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-2.5">
                      <UserActions profile={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

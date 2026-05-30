import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { getActiveZones } from '@/lib/db/queries'
import EmployeeNav from '@/components/shared/EmployeeNav'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login')
  const zones = await getActiveZones()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <EmployeeNav profile={profile} zones={zones} />
      <main className="min-h-0 flex-1 pb-24 md:pb-0">
        {children}
      </main>
    </div>
  )
}

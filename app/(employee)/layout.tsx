import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import EmployeeNav from '@/components/shared/EmployeeNav'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login')

  return (
    <div className="map-page">
      <EmployeeNav profile={profile} />
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
}

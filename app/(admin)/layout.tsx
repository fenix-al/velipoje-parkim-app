import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  // Double-check role server-side (middleware also checks)
  const allowed = profile?.role === 'admin' || profile?.role === 'supervisor'
  if (!profile || !allowed || !profile.is_active) {
    redirect('/zones')
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AdminNav role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto px-3 pb-28 pt-4 sm:px-4 md:p-6 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

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
  if (!profile || profile.role !== 'admin' || !profile.is_active) {
    redirect('/zones')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminNav />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

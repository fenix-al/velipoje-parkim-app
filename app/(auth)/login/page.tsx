import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Hyr — Parkimi Velipojë',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-blue-600/20">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Parkimi Velipojë
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistemi i menaxhimit të parkimit — Bashkia Velipojë
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

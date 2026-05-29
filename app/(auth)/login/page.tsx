import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Hyr — Parkimi Velipojë',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl mb-4">
            🅿
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Parkimi Velipojë</h1>
          <p className="text-gray-500 text-sm mt-1">Sistemi i menaxhimit të parkimit</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

'use client'

import { useRef, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserByAdmin } from '@/lib/actions/admin'

export default function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createUserByAdmin(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success('Përdoruesi u krijua.')
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="flex flex-col gap-1 lg:col-span-1">
        <Label htmlFor="full_name" className="text-xs">Emri</Label>
        <Input id="full_name" name="full_name" placeholder="Emri i plote" className="h-9" />
      </div>

      <div className="flex flex-col gap-1 lg:col-span-1">
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@email.com"
          required
          className="h-9"
        />
      </div>

      <div className="flex flex-col gap-1 lg:col-span-1">
        <Label htmlFor="password" className="text-xs">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="min. 6 karaktere"
          required
          minLength={6}
          className="h-9"
        />
      </div>

      <div className="flex flex-col gap-1 lg:col-span-1">
        <Label htmlFor="role" className="text-xs">Roli</Label>
        <select
          id="role"
          name="role"
          defaultValue="employee"
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="employee">Punonjës</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div className="flex items-end lg:col-span-1">
        <Button type="submit" disabled={pending} className="h-9 w-full">
          <UserPlus className="h-4 w-4" />
          {pending ? 'Duke shtuar...' : 'Shto'}
        </Button>
      </div>
    </form>
  )
}

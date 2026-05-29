'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, UserCheck, UserX, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { updateUserRole, toggleUserActive } from '@/lib/actions/admin'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  profile: Profile
}

export default function UserActions({ profile }: Props) {
  const [pending, startTransition] = useTransition()

  function handleRoleChange(role: 'admin' | 'supervisor' | 'employee') {
    startTransition(async () => {
      const result = await updateUserRole(profile.id, role)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Roli u ndryshua.`)
      }
    })
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await toggleUserActive(profile.id, !profile.is_active)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(profile.is_active ? 'Llogaria u çaktivizua.' : 'Llogaria u aktivizua.')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Ndrysho rolin</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
          <Shield className="h-4 w-4 mr-2" />
          Administrator
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('supervisor')}>
          Supervisor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('employee')}>
          Punonjës
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleActive}>
          {profile.is_active ? (
            <>
              <UserX className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-red-600">Çaktivizo</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-green-600">Aktivizo</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

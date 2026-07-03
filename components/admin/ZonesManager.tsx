'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  LayoutGrid,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Zone } from '@/lib/supabase/types'
import { deleteZone, toggleZoneActive } from '@/lib/actions/zones'
import { cn } from '@/lib/utils/cn'
import EmptyState from '@/components/shared/EmptyState'
import PageHeader from '@/components/shared/PageHeader'
import ZoneFormDialog from './ZoneFormDialog'

interface Props {
  zones: Zone[]
}

export default function ZonesManager({ zones }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [editZone, setEditZone] = useState<Zone | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null)
  const [mobileTab, setMobileTab] = useState<'all' | 'active' | 'inactive'>('all')
  const visibleZones = zones.filter((zone) => {
    if (mobileTab === 'active') return zone.is_active
    if (mobileTab === 'inactive') return !zone.is_active
    return true
  })

  function handleToggle(zone: Zone) {
    startTransition(async () => {
      const result = await toggleZoneActive(zone.id, !zone.is_active)
      if (result?.error) toast.error(result.error)
      else {
        toast.success(zone.is_active ? 'Zona u çaktivizua.' : 'Zona u aktivizua.')
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteZone(deleteTarget.id)
      if (result?.error) toast.error(result.error)
      else {
        toast.success('Zona u fshi.')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Zonat e parkimit (${zones.length})`}
        description="Krijo, ndrysho dhe menaxho layout-in e zonave."
      >
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Shto zonë
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 md:hidden">
        {[
          { key: 'all', label: 'Te gjitha', count: zones.length },
          { key: 'active', label: 'Aktive', count: zones.filter((z) => z.is_active).length },
          { key: 'inactive', label: 'Joaktive', count: zones.filter((z) => !z.is_active).length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileTab(tab.key as typeof mobileTab)}
            className={cn(
              'rounded-md px-2 py-2 text-xs font-semibold transition-colors',
              mobileTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600',
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Zone grid */}
      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nuk ka zona ende"
          description="Krijo zonën e parë të parkimit për të filluar menaxhimin e vendeve."
        >
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Shto zonën e parë
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleZones.map((zone) => (
            <Card key={zone.id} className={zone.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-tight">{zone.name}</CardTitle>
                    {zone.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{zone.address}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={zone.is_active ? 'success' : 'secondary'}>
                      {zone.is_active ? 'Aktive' : 'Joaktive'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setEditZone(zone)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Ndrysho
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(zone)}>
                          {zone.is_active ? (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Çaktivizo
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              Aktivizo
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(zone)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Fshi zonën
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 text-sm pt-0">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kodi</span>
                  <span className="font-mono font-medium">{zone.code}</span>
                </div>
                {zone.latitude != null && zone.longitude != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Koordinatat</span>
                    <span className="font-mono text-xs">
                      {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                    </span>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={!zone.is_active}
                    onClick={() => router.push(`/zones/${zone.code}`)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Shiko
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/admin/zones/${zone.id}/layout`)}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1.5" />
                    Layout
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <ZoneFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); router.refresh() }}
      />

      {/* Edit dialog */}
      {editZone && (
        <ZoneFormDialog
          open={!!editZone}
          zone={editZone}
          onClose={() => setEditZone(null)}
          onSuccess={() => { setEditZone(null); router.refresh() }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Fshi zonën</DialogTitle>
            <DialogDescription>
              A jeni i sigurt që doni të fshini <strong>{deleteTarget?.name}</strong>? Kjo do të
              fshijë gjithashtu të gjitha vendet dhe historikun e parkimit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Anulo
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Duke fshirë...' : 'Fshi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

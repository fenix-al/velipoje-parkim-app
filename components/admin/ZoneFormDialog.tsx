'use client'

import { useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createZone, updateZoneDetails } from '@/lib/actions/zones'
import type { Zone } from '@/lib/supabase/types'

interface Props {
  open: boolean
  zone?: Zone
  onClose: () => void
  onSuccess: () => void
}

export default function ZoneFormDialog({ open, zone, onClose, onSuccess }: Props) {
  const isEdit = !!zone
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateZoneDetails(zone!.id, formData)
        : await createZone(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? 'Zona u përditësua.' : 'Zona u shtua.')
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ndrysho zonën' : 'Shto zonë të re'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zf-name">Emri <span className="text-red-500">*</span></Label>
              <Input
                id="zf-name"
                name="name"
                defaultValue={zone?.name}
                placeholder="Zona 1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zf-code">Kodi <span className="text-red-500">*</span></Label>
              <Input
                id="zf-code"
                name="code"
                defaultValue={zone?.code}
                placeholder="Z1"
                required
                className="uppercase"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="zf-address">Adresa / Vendndodhja</Label>
            <Input
              id="zf-address"
              name="address"
              defaultValue={zone?.address ?? ''}
              placeholder="p.sh. Rruga e Detit, Velipojë"
            />
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zf-lat">Gjerësia (Lat)</Label>
              <Input
                id="zf-lat"
                name="latitude"
                type="number"
                step="any"
                defaultValue={zone?.latitude ?? ''}
                placeholder="41.7654"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zf-lng">Gjatësia (Lng)</Label>
              <Input
                id="zf-lng"
                name="longitude"
                type="number"
                step="any"
                defaultValue={zone?.longitude ?? ''}
                placeholder="19.4432"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Vendet e parkimit menaxhohen te <strong>Layout i vendeve</strong> pas krijimit të zonës.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Anulo
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Duke ruajtur...' : isEdit ? 'Ruaj ndryshimet' : 'Shto zonën'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

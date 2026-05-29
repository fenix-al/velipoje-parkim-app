'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionsToCSV, downloadCSV } from '@/lib/utils/csv'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  from?: string
  to?: string
  zoneCode?: string
}

export default function CSVExportButton({ from, to, zoneCode }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('v_completed_sessions')
        .select('*')
        .order('occupied_at', { ascending: false })
        .limit(10000)

      if (zoneCode) query = query.eq('zone_code', zoneCode)
      if (from)     query = query.gte('occupied_at', from)
      if (to)       query = query.lte('occupied_at', to)

      const { data, error } = await query
      if (error) throw error

      const csv = sessionsToCSV(data ?? [])
      const ts  = format(new Date(), 'yyyyMMdd_HHmm')
      downloadCSV(csv, `parkimi_sesionet_${ts}.csv`)
      toast.success(`${(data ?? []).length} rreshta u eksportuan.`)
    } catch (err) {
      toast.error('Gabim gjatë eksportimit.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Duke eksportuar…
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 mr-1" />
          Eksporto CSV
        </>
      )}
    </Button>
  )
}

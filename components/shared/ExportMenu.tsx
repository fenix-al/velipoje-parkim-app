'use client'

import { useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ExportPayload } from '@/lib/export/types'

interface Props {
  /** Server action i lidhur me filtrat aktualë — kthen të dhënat e plota. */
  fetchPayload: () => Promise<ExportPayload>
}

const BRAND_BLUE = { r: 37, g: 99, b: 235 } // blue-600, njësoj me token-in primary
const ZEBRA = 'FFF8FAFC' // slate-50

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

async function buildExcel(payload: ExportPayload) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Parkimi Velipojë'
  workbook.created = new Date()

  if (payload.summary?.length) {
    const sheet = workbook.addWorksheet('Përmbledhja')
    sheet.columns = [{ width: 34 }, { width: 26 }]

    const titleRow = sheet.addRow([payload.title])
    titleRow.font = { bold: true, size: 14 }
    if (payload.subtitle) {
      const subtitleRow = sheet.addRow([payload.subtitle])
      subtitleRow.font = { size: 10, color: { argb: 'FF64748B' } }
    }
    sheet.addRow([])

    for (const item of payload.summary) {
      const row = sheet.addRow([item.label, item.value])
      row.getCell(1).font = { bold: true }
    }
  }

  for (const table of payload.tables) {
    const sheet = workbook.addWorksheet(table.name.slice(0, 31))
    sheet.columns = table.columns.map((col) => ({
      key: col.key,
      width: col.width ?? 18,
    }))

    const headerRow = sheet.addRow(table.columns.map((col) => col.header))
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      cell.alignment = { vertical: 'middle' }
    })

    table.rows.forEach((rowData, index) => {
      const row = sheet.addRow(table.columns.map((col) => rowData[col.key] ?? ''))
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } }
        })
      }
    })

    sheet.views = [{ state: 'frozen', ySplit: 1 }]
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: table.columns.length },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${payload.fileName}.xlsx`,
  )
}

async function buildPdf(payload: ExportPayload) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({
    orientation: payload.orientation ?? 'portrait',
    unit: 'pt',
    format: 'a4',
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(payload.title, margin, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  if (payload.subtitle) doc.text(payload.subtitle, margin, 66)
  doc.text(
    `Gjeneruar: ${new Date().toLocaleString('sq-AL', { hour12: false })}`,
    pageWidth - margin,
    66,
    { align: 'right' },
  )

  let cursorY = 84

  if (payload.summary?.length) {
    autoTable(doc, {
      startY: cursorY,
      theme: 'plain',
      body: payload.summary.map((item) => [item.label, item.value]),
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 220 },
      },
      margin: { left: margin, right: margin },
    })
    cursorY = (doc as any).lastAutoTable.finalY + 20
  }

  for (const table of payload.tables) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text(table.name, margin, cursorY)

    autoTable(doc, {
      startY: cursorY + 8,
      head: [table.columns.map((col) => col.header)],
      body: table.rows.map((row) =>
        table.columns.map((col) => String(row[col.key] ?? '')),
      ),
      theme: 'striped',
      headStyles: {
        fillColor: [BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    })
    cursorY = (doc as any).lastAutoTable.finalY + 24
  }

  // Numrat e faqeve + emërtimi në fund të çdo faqeje
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Parkimi Velipojë — Bashkia Velipojë', margin, pageHeight - 20)
    doc.text(`Faqja ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 20, {
      align: 'right',
    })
  }

  doc.save(`${payload.fileName}.pdf`)
}

export default function ExportMenu({ fetchPayload }: Props) {
  const [pending, setPending] = useState(false)

  async function handleExport(format: 'excel' | 'pdf') {
    setPending(true)
    try {
      const payload = await fetchPayload()
      if (format === 'excel') await buildExcel(payload)
      else await buildPdf(payload)
      toast.success(format === 'excel' ? 'Excel u shkarkua.' : 'PDF u shkarkua.')
    } catch (err) {
      console.error(err)
      toast.error('Gabim gjatë shkarkimit. Provo përsëri.')
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Shkarko
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={pending}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={pending}>
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

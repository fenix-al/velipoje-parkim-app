/** Strukturat e përbashkëta për eksportin Excel/PDF — të serializueshme. */

export interface ExportColumn {
  header: string
  key: string
  /** Gjerësia e kolonës në Excel (karaktere). */
  width?: number
}

export interface ExportTable {
  /** Emri i fletës në Excel / titulli i seksionit në PDF (max 31 karaktere). */
  name: string
  columns: ExportColumn[]
  rows: Record<string, string | number>[]
}

export interface ExportPayload {
  title: string
  /** Periudha ose sqarim tjetër nën titull. */
  subtitle?: string
  /** Çifte etiketë/vlerë të shfaqura si përmbledhje para tabelave. */
  summary?: { label: string; value: string }[]
  tables: ExportTable[]
  /** Orientimi i faqes PDF — landscape për tabela të gjera. */
  orientation?: 'portrait' | 'landscape'
  /** Emri bazë i skedarit, pa prapashtesë. */
  fileName: string
}

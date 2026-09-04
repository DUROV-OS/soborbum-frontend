import * as XLSX from 'xlsx'

const HEADERS = ['Инвентарный номер', 'Название материала', 'Количество']

export function downloadSupplyTemplate(): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ['INV-0142', 'Брус клеёный 200×200×6000', 100],
  ])
  sheet['!cols'] = [{ wch: 20 }, { wch: 36 }, { wch: 14 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Поставка')
  XLSX.writeFile(workbook, 'soborbum_shablon_postavki.xlsx')
}

export interface ParsedSupplyRow {
  inventoryNumber: string
  title: string
  qty: number
}

export function parseSupplyWorkbook(file: File): Promise<ParsedSupplyRow[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    return rows
      .map((row) => {
        const inventoryNumber = String(row['Инвентарный номер'] ?? '').trim()
        const title = String(row['Название материала'] ?? '').trim()
        const qty = Number(row['Количество'] ?? 0)
        return { inventoryNumber, title, qty }
      })
      .filter((row) => row.inventoryNumber && row.qty > 0)
  })
}

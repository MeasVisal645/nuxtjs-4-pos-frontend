<script setup lang="ts">
import { ref } from 'vue'

type Row = Record<string, unknown>

type ExportMode = 'range' | 'all'

interface DateRange {
  start?: Date | null
  end?: Date | null
}

const props = defineProps<{
  headers: string[]
  fetchData: (mode: ExportMode) => Promise<Row[]>
  filename?: string
  range?: DateRange
}>()

const exporting = ref(false)
const toast = useToast()

function toCSV(headers: string[], rows: Row[]): string {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csvRows = rows.map(row =>
    Object.values(row).map(escape).join(',')
  )
  return [headers.join(','), ...csvRows].join('\n')
}

function buildFilename(mode: ExportMode): string {
  const base = props.filename ?? 'export'
  if (mode === 'range' && props.range?.start && props.range?.end) {
    const from = props.range.start.toISOString().slice(0, 10)
    const to = props.range.end.toISOString().slice(0, 10)
    return `${base}_${from}_to_${to}.csv`
  }
  return `${base}_all.csv`
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function exportCsv(mode: ExportMode) {
  try {
    exporting.value = true
    const rows = await props.fetchData(mode)

    if (rows.length === 0) {
      toast.add({ title: 'No data', description: 'Nothing to export', color: 'warning' })
      return
    }

    const csv = toCSV(props.headers, rows)
    download(csv, buildFilename(mode))
    toast.add({ title: 'Exported', description: `${rows.length} record(s) exported`, color: 'success' })
  } catch (e: any) {
    toast.add({
      title: 'Export failed',
      description: e?.data?.message || e?.message || 'Unknown error',
      color: 'error'
    })
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      label="Export Range"
      icon="i-lucide-calendar"
      color="neutral"
      variant="outline"
      :loading="exporting"
      :disabled="exporting"
      @click="exportCsv('range')"
    />
    <UButton
      label="Export All"
      icon="i-lucide-download"
      color="neutral"
      variant="outline"
      :loading="exporting"
      :disabled="exporting"
      @click="exportCsv('all')"
    />
  </div>
</template>
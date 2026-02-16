<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)

const props = defineProps<{
  period: Period
  range: Range
}>()

type ApiRow = { totalSale: number; saleDate: string }

type DataRecord = {
  date: Date
  amount: number
}

const data = ref<DataRecord[]>([])
const pending = ref(false)

const formatNumber = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'KHR',
  maximumFractionDigits: 0
}).format

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyyy')
  })[props.period]
}

function bucketKey(date: Date, period: Period) {
  if (period === 'daily') return format(date, 'yyyy-MM-dd')
  if (period === 'weekly') return format(date, "yyyy-'W'II")
  return format(date, 'yyyy-MM')
}

function bucketStart(date: Date, period: Period) {
  if (period === 'daily') return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (period === 'weekly') {
    return date
  }
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

async function loadRevenue() {
  try {
    pending.value = true

    const start = props.range.start.toISOString()
    const end = props.range.end.toISOString()

    const rows = await useApi<ApiRow[]>('/order/date', {
      params: { startDate: start, endDate: end }
    })

    const list = (rows ?? []).map(r => ({
      amount: Number(r.totalSale ?? 0),
      date: new Date(r.saleDate)
    }))

    // 1) Create all buckets for the range
    const datesFn = ({
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period]

    const buckets = datesFn(props.range).map(d => bucketStart(d, props.period))

    // 2) Sum API rows into buckets
    const sums = new Map<string, number>()
    for (const item of list) {
      const key = bucketKey(item.date, props.period)
      sums.set(key, (sums.get(key) ?? 0) + item.amount)
    }

    // 3) Output chart data
    data.value = buckets.map(d => ({
      date: d,
      amount: sums.get(bucketKey(d, props.period)) ?? 0
    }))
  } catch (e) {
    console.error('Failed to load revenue:', e)
    data.value = []
  } finally {
    pending.value = false
  }
}

watch(
  () => [props.period, props.range.start.getTime(), props.range.end.getTime()],
  loadRevenue,
  { immediate: true }
)

// --- Unovis accessors ---
const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.amount

const total = computed(() => data.value.reduce((acc, d) => acc + d.amount, 0))

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${formatNumber(d.amount)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">Revenue</p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatNumber(total) }}
        </p>
      </div>
    </template>

    <div class="relative">
      <VisXYContainer
        :data="data"
        :padding="{ top: 40 }"
        class="h-96"
        :width="width"
      >
        <VisLine :x="x" :y="y" color="var(--ui-primary)" />
        <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />

        <VisAxis type="x" :x="x" :tick-format="xTicks" />

        <VisCrosshair color="var(--ui-primary)" :template="template" />
        <VisTooltip />
      </VisXYContainer>

      <UProgress
        v-if="pending"
        indeterminate
        size="xs"
        class="absolute top-0 inset-x-0 z-1"
        :ui="{ base: 'bg-default' }"
      />
    </div>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>

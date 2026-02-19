<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format
} from 'date-fns'

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

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'KHR',
    maximumFractionDigits: 0
  })
}

// ---- bucket helpers ----
function bucketKey(date: Date, period: Period) {
  if (period === 'daily') return format(date, 'yyyy-MM-dd')
  if (period === 'weekly') return format(date, "yyyy-'W'II")
  return format(date, 'yyyy-MM')
}

function bucketStart(date: Date, period: Period) {
  if (period === 'daily') return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (period === 'weekly') return date
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// ---- revenue loader ----
async function loadRevenue() {
  try {
    pending.value = true

    // ✅ backend range params (LocalDate)
    const startDate = format(props.range.start, 'yyyy-MM-dd')
    const endDate = format(props.range.end, 'yyyy-MM-dd')

    const rows = await useApi<ApiRow[]>('/order/date', {
      params: { startDate, endDate }
    })

    const list = (rows ?? []).map(r => ({
      amount: Number(r.totalSale ?? 0),
      date: new Date(r.saleDate)
    }))

    const datesFn = ({
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period]

    const buckets = datesFn(props.range).map(d => bucketStart(d, props.period))

    const sums = new Map<string, number>()
    for (const item of list) {
      const key = bucketKey(item.date, props.period)
      sums.set(key, (sums.get(key) ?? 0) + item.amount)
    }

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

// ---- dashboard stats ----
type DashboardAll = {
  totalCustomers: number
  totalSales: number
  totalOrders: number
  totalProducts: number
}

type StatKey = keyof DashboardAll

type StatDef = {
  key: StatKey
  title: string
  icon: string
  to: string
  formatter?: (v: number) => string
}

const statDefs: StatDef[] = [
  { key: 'totalCustomers', title: 'Customers', icon: 'i-lucide-users', to: '/customer' },
  { key: 'totalProducts', title: 'Products', icon: 'i-lucide-chart-pie', to: '/product' },
  { key: 'totalSales', title: 'Revenue', icon: 'i-lucide-circle-dollar-sign', to: '/report', formatter: formatCurrency },
  { key: 'totalOrders', title: 'Orders', icon: 'i-lucide-shopping-cart', to: '/order' }
]

// ✅ make key depend on range so it refreshes properly
const statsKey = computed(() => {
  const s = props.range.start.getTime()
  const e = props.range.end.getTime()
  return `stats:${s}:${e}`
})

const { data: stats } = await useAsyncData<(Stat & { to: string })[]>(
  statsKey,
  async () => {
    const startDate = format(props.range.start, 'yyyy-MM-dd')
    const endDate = format(props.range.end, 'yyyy-MM-dd')

    // ✅ pass params (backend expects range)
    const d = await useApi<DashboardAll>('/dashboard/all', {
      params: { startDate, endDate }
    })

    return statDefs.map((def) => {
      const num = Number(d?.[def.key] ?? 0)
      return {
        title: def.title,
        icon: def.icon,
        value: def.formatter ? def.formatter(num) : num,
        variation: 0,
        to: def.to
      }
    })
  },
  {
    watch: [() => props.range.start.getTime(), () => props.range.end.getTime()],
    default: () => []
  }
)
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

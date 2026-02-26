<script setup lang="ts">
import { h, resolveComponent, ref, computed, watch, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { OrderItemDetails, Period, Range } from '~/types'
import toArray from '~/utils/helper'
import { sub } from 'date-fns'

type Product = { id: number; name: string; code: string; price: number }
type User = { id: number; username: string }

const range = ref<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')

const {
  loadError,
  orderItems,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
  modalOpen,
  selected,
  openModal,
  search: reportSearch,
} = useSaleReport(period, range)

// ---------- SEARCH ----------
const search = computed({
  get: () => reportSearch.value,
  set: (v: string) => {
    reportSearch.value = v
    pageNumber.value = 1
  }
})

// Reset page when range changes
watch(range, () => {
  pageNumber.value = 1
}, { deep: true })

// ---------- LOOKUPS ----------
const users = ref<User[]>([])
const products = ref<Product[]>([])

async function loadLookups() {
  const [userRes, productRes] = await Promise.all([
    useApi('/user/all'),
    useApi('/product/all'),
  ])
  users.value = toArray<User>(userRes)
  products.value = toArray<Product>(productRes)
}

const productById = computed<Record<number, Product>>(() =>
  Object.fromEntries(products.value.map(p => [Number(p.id), p]))
)

onMounted(loadLookups)

const userNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(users.value.map(u => [Number(u.id), u.username]))
)

// ---------- TABLE ----------
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<OrderItemDetails>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => {
      return (pageNumber.value - 1) * pageSize.value + row.index + 1
    }
  },
  {
    id: 'orderNo',
    header: 'Order No',
    accessorFn: (r) => r.orderItems.orderNo
  },
  {
    id: 'user',
    header: 'Sale By',
    cell: ({ row }) => {
      const id = row.original.orderItems.userId
      return userNameById.value[id] ?? `#${id}`
    }
  },
  {
    accessorKey: 'paid',
    header: 'Paid',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.orderItems.paid ? 'success' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full' }
        },
        () => (row.original.orderItems.paid ? 'Paid' : 'Unpaid')
      )
  },
  {
    accessorKey: 'createdDate',
    header: 'Date (dd/mm/yyyy)',
    cell: ({ row }) => {
      const d = new Date(row.original.orderItems.createdDate)
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) =>
      h(UButton, {
        label: 'View',
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        onClick: () => openModal(row.original)
      })
  }
]

// ---------- FETCH DATA FOR EXPORT ----------
async function fetchExportData(mode: 'range' | 'all') {
  const query = new URLSearchParams({
    pageNumber: '1',
    pageSize: '999999',
  })

  if (mode === 'range') {
    const startDate = range.value?.start
    const endDate = range.value?.end
    if (startDate) query.append('startDate', startDate.toISOString().slice(0, 10))
    if (endDate) query.append('endDate', endDate.toISOString().slice(0, 10))
  }

  if (search.value?.trim()) {
    query.append('search', search.value.trim())
  }

  const res = await useApi<{ content: OrderItemDetails[] }>(`/order?${query.toString()}`)
  const rows = res?.content ?? []

  // ---------- FLATTEN DATA FOR EXPORT ----------
  const flattened: Record<string, unknown>[] = []

  rows.forEach((item, orderIndex) => {
    const d = new Date(item.orderItems.createdDate)
    const date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    const orderBase = {
      no: orderIndex + 1,
      orderNo: item.orderItems.orderNo,
      saleBy: userNameById.value[item.orderItems.userId] ?? `#${item.orderItems.userId}`,
      paid: item.orderItems.paid ? 'Paid' : 'Unpaid',
      date,
    }

    if (item.orderDetails.length > 0) {
      item.orderDetails.forEach((detail) => {
        const product = productById.value[detail.productId]
        flattened.push({
          ...orderBase,
          productCode: product?.code ?? `#${detail.productId}`,
          productName: product?.name ?? `#${detail.productId}`,
          quantity: detail.quantity,
          paymentMethod: detail.paymentMethod,
          total: detail.total,
        })
      })
    } else {
      flattened.push({
        ...orderBase,
        productCode: '',
        productName: '',
        quantity: '',
        paymentMethod: '',
        total: '',
      })
    }
  })

  return flattened
}
</script>

<template>
  <UDashboardPanel id="sale-report">
    <template #header>
      <UDashboardNavbar title="List Sale Report">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ERROR -->
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load sale report"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <!-- FILTERS -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search order number..."
          />

          <!-- DATE RANGE PICKER -->
          <HomeDateRangePicker 
            v-model="range"
          />
        </div>

        <ExportCsvButton
          filename="sale-report"
          :range="range"
          :headers="['No', 'Order No', 'Sale By', 'Paid', 'Date', 'Product Code', 'Product Name', 'Quantity', 'Payment Method', 'Total']"
          :fetch-data="fetchExportData"
        />
      </div>

      <!-- TABLE -->
      <UTable
        class="shrink-0"
        :data="orderItems"
        :columns="columns"
        :loading="pending"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r text-black dark:text-white',
          td: 'border-b border-default text-black dark:text-white',
          separator: 'h-0'
        }"
      />

      <!-- MODAL -->
      <SalesViewModal
        v-model:open="modalOpen"
        :data="selected"
      />

      <!-- PAGINATION -->
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ totalRecords }} total record(s)
        </div>

        <UPagination
          :page="pageNumber"
          :items-per-page="pageSize"
          :total="totalRecords"
          @update:page="(p: number) => (pageNumber = p)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
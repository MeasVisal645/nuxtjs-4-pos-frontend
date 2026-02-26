<script setup lang="ts">
import { h, resolveComponent, ref, computed, watch, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { OrderItemDetails, Period, Range } from '~/types'
import toArray from '~/utils/helper'
import { sub } from 'date-fns'

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
  openModal
} = useSaleReport(period, range)

const users = ref<User[]>([])

async function loadLookups() {
  const userRes = await useApi('/user/all')
  users.value = toArray<User>(userRes)
}

onMounted(loadLookups)

const userNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(users.value.map(u => [Number(u.id), u.username]))
)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const table = useTemplateRef('table')

const columnFilters = ref<any[]>([])

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

watch(range, () => {
  pagination.value.pageIndex = 0
})

const columns: TableColumn<OrderItemDetails>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex
      const pageSize = table.getState().pagination.pageSize
      return pageIndex * pageSize + row.index + 1
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

const search = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('orderNo')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('orderNo')?.setFilterValue(value || undefined)
  }
})
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

          <!--  DATE RANGE PICKER -->
          <HomeDateRangePicker v-model="range" />

        </div>
      </div>

      <!-- TABLE -->
      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
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
          @update:page="(p:number) => (pageNumber = p)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
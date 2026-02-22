<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { OrderItems, OrderItemDetails } from '~/types'
import toArray from '~/utils/helper'

type User = { id: number; username: string }

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
} = useSaleReport()

const users = ref<User[]>([])

async function loadLookups() {
  const [userRes] = await Promise.all([
    useApi('/user/all')
  ])

  users.value = toArray<User>(userRes)
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (err) {
    console.error('Failed to load users:', err)
  }
})

const userNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(users.value.map(u => [Number(u.id), u.username]))
)

const toast = useToast()

const selectedOrderItem = ref<OrderItems | null>(null)
const viewModalOpen = ref(false)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const table = useTemplateRef('table')

const columnFilters = ref<any[]>([])

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

function getRowItems(row: Row<OrderItemDetails>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'View Order Details',
      icon: 'i-lucide-list',
      onSelect() {
        selectedOrderItem.value = row.original.orderItems
        viewModalOpen.value = true
      }
    },
    {
      label: 'Delete Order',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Order deleted',
          description: 'The order has been deleted.'
        })
      }
    }
  ]
}

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
  { id: 'orderNo', header: 'Order No', accessorFn: (r) => r.orderItems.orderNo },
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
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const count = row.original.orderDetails
      return h(UButton, {
        label: `View`,
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        onClick: () => openModal(row.original)
      })
    }
  }

]

// Search
const search = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('orderNo')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('orderNo')?.setFilterValue(value || undefined)
  }
})

// ---------- Date Range Filter ----------
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'

const df = new DateFormatter('en-US', { dateStyle: 'medium' })

const dateRange = shallowRef<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})

function clearDateFilter() {
  dateRange.value = { start: undefined, end: undefined }
  pagination.value.pageIndex = 0
}

const filteredOrderItems = computed(() => {
  const { start, end } = dateRange.value
  if (!start && !end) return orderItems.value

  return orderItems.value.filter((item: OrderItemDetails) => {
    const d = new Date(item.orderItems.createdDate)
    if (start) {
      const from = start.toDate(getLocalTimeZone())
      if (d < from) return false
    }
    if (end) {
      const to = end.toDate(getLocalTimeZone())
      to.setHours(23, 59, 59, 999)
      if (d > to) return false
    }
    return true
  })
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
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load suppliers"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <UInput
            v-model="search"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter Order No..."
          />
          <!-- Date range picker -->
          <UPopover>
            <UButton color="neutral" variant="outline" icon="i-lucide-calendar">
              <template v-if="dateRange.start">
                <template v-if="dateRange.end">
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} - {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                </template>
                <template v-else>
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                </template>
              </template>
              <template v-else>
                Date Range
              </template>
            </UButton>
            <template #content>
              <UCalendar v-model="dateRange" class="p-2" :number-of-months="2" range />
            </template>
          </UPopover>

          <UButton
            v-if="dateRange.start || dateRange.end"
            icon="i-lucide-x"
            color="neutral"
            variant="outline"
            size="sm"
            @click="clearDateFilter"
          />
        </div>

        <div class="gap-2 flex">
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton label="Display" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
          </UDropdownMenu>
        </div>
      </div>

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

      <SalesViewModal
        v-model:open="modalOpen"
        :data="selected"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ totalRecords }} row(s) selected.
        </div>

      <UPagination
        :default-page="pageNumber"
        :items-per-page="pageSize"
        :total="totalRecords"
        @update:page="(p:number) => (pageNumber = p)"
      />
      </div>
    </template>
  </UDashboardPanel>
</template>

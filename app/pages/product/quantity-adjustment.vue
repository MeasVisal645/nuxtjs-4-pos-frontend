<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { QuantityAdjustment } from '~/types'

const {
  loadError,
  quantityAdjustment,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
} = useQuantityAdjustment()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const table = useTemplateRef('table')

const columnFilters = ref<any[]>([])
const columnVisibility = ref<Record<string, boolean>>({
  complete: false
})
const rowSelection = ref<Record<string, boolean>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const columns: TableColumn<QuantityAdjustment>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        ariaLabel: 'Select row'
      })
  },
  {
    id: 'no',
    header: 'No',
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex
      const pageSize = table.getState().pagination.pageSize
      return pageIndex * pageSize + row.index + 1
    }
  },
  { accessorKey: 'productName', header: 'Product' },
  { accessorKey: 'userId', header: 'User Id' },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.method === 'ADD' ? 'info' : row.original.method === 'SUBTRACT' ? 'error' : 'warning',
          variant: 'soft',
          ui: { rounded: 'rounded-full', font: 'font-medium' }
        },
        () => (row.original.method)
      )
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.quantity >= 10 ? 'info' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full', font: 'font-medium' }
        },
        () => (row.original.quantity)
      )
   },
  {
    accessorKey: 'complete',
    header: 'Complete',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.complete ? 'info' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full' }
        },
        () => (row.original.complete ? 'Yes' : 'No')
      )
  },
  {
    accessorKey: 'createdDate',
    header: 'Created Date',
    cell: ({ row }) => {
      const d = new Date(row.original.createdDate)
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    }
  },
]

// Search Filter
const globalFilter = ref('')
const globalFilterFn = (row: any, _columnId: string, filterValue: string) => {
  const q = String(filterValue ?? '').toLowerCase().trim()
  if (!q) return true

  const createdDate = String(row.original.createdDate ?? '').toLowerCase()
  const productName = String(row.original.name ?? '').toLowerCase()

  return productName.includes(q) || createdDate.includes(q)
}

watch(globalFilter, (value) => {
  table.value?.tableApi?.setGlobalFilter(value)
})
</script>

<template>
  <UDashboardPanel id="quantityAdjustment">
    <template #header>
      <UDashboardNavbar title="Quantity Adjustment">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load audit logs"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search..."
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
        v-model:global-filter="globalFilter"
        :global-filter-fn="globalFilterFn"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="quantityAdjustment"
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

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ totalRecords }} row(s) selected.
        </div>

        <UPagination
          :default-page="pageNumber"
          :items-per-page="pageSize"
          :total="totalRecords"
          @update:page="(p:number) => pageNumber = p"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

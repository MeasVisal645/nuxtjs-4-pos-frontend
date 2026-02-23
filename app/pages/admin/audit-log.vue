<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { AuditLog } from '~/types'

const {
  loadError,
  auditLog,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
} = useAuditLog()

const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')

const table = useTemplateRef('table')

const columnFilters = ref<any[]>([])
const columnVisibility = ref<Record<string, boolean>>({
  userAgent: false
})
const rowSelection = ref<Record<string, boolean>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const columns: TableColumn<AuditLog>[] = [
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
  { accessorKey: 'userId', header: 'User' },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: ({ row }) => {
      const colorMap: Record<string, string> = {
        GET: 'success',
        POST: 'warning',
        PUT: 'secondary',
        DELETE: 'error'
      }

      return h(
        UBadge,
        {
          color: colorMap[row.original.method] || 'neutral',
          variant: 'soft',
          ui: {
            rounded: 'rounded-full',
            font: 'font-medium'
          }
        },
        () => row.original.method
      )
    }
  },
  { accessorKey: 'path', header: 'Path' },
  { accessorKey: 'param', header: 'Param' },
  { accessorKey: 'ipAddress', header: 'Ip Address' },
  { accessorKey: 'userAgent', header: 'User Agent' },
  {
    accessorKey: 'timestamp',
    header: 'Date (dd/mm/yyyy)',
    cell: ({ row }) => {
      const d = new Date(row.original.timestamp)
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    }
  }

]
</script>

<template>
  <UDashboardPanel id="auditLog">
    <template #header>
      <UDashboardNavbar title="List AuditLog">
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
      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="auditLog"
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

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Product } from '~/types'

const {
  fetch,
  loadError,
  products,
  pending,
  showModal,
} = useProduct()

const toast = useToast()


const selectedProduct = ref<Product | null>(null)
const viewModalOpen = ref(false)
const editModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const table = useTemplateRef('table')

const columnFilters = ref<any[]>([])
const columnVisibility = ref<Record<string, boolean>>({
  active: false
})
const rowSelection = ref<Record<string, boolean>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

function getRowItems(row: Row<Product>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      type: 'separator'
    },
    {
      label: 'View Product Details',
      icon: 'i-lucide-list',
      onSelect() {
        selectedProduct.value = row.original
        viewModalOpen.value = true     
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit Product',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.id
        editModalOpen.value = true
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete Product',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Product deleted',
          description: 'The product has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Product>[] = [
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
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'cost', header: 'Cost' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'quantity', header: 'Quantity' },
  { accessorKey: 'unit', header: 'Unit' },
  {
    accessorKey: 'active',
    header: 'Active',
    filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
    enableHiding: true
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const filter = ref< 'true' | 'false' | 'all'>('true')

watch(
  () => table.value?.tableApi,
  (api) => {
    if (!api) return
    api.getColumn('active')?.setFilterValue(true)
  },
  { immediate: true }
)

watch(filter, (newVal) => {
  const api = table.value?.tableApi
  if (!api) return

  const col = api.getColumn('active')
  if (!col) return

  if (newVal === 'all') col.setFilterValue(undefined)
  else col.setFilterValue(newVal === 'true')
})

const code = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('code')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('code')?.setFilterValue(value || undefined)
  }
})

</script>

<template>
  <UDashboardPanel id="product">
    <template #header>
      <UDashboardNavbar title="List Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <EmployeeAddModal @submitted="fetch" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load products"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <UInput
            v-model="code"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter Email..."
          />
        </div>
        <div class="gap-2 flex">
          <USelect
            v-model="filter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter status"
            class="min-w-28"
          />
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
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :data="products"
        :columns="columns"
        :loading="pending"
      />

      <EmployeeEditModal
        v-model:open="editModalOpen"
        :id="selectedId"
        @submitted="fetch"
      />


      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

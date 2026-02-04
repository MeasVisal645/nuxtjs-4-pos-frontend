<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Supplier, SupplierWithContacts, SupplierContact } from '~/types'

const {
  fetchPagination,
  loadError,
  suppliers,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
  totalPages,
  modalOpen,
  selected,
  openModal
} = useSupplier()

const toast = useToast()

const selectedSupplier = ref<Supplier | null>(null)
const viewModalOpen = ref(false)
const editModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)

const UBadge = resolveComponent('UBadge')
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

function getRowItems(row: Row<SupplierWithContacts>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'View Contacts',
      icon: 'i-lucide-users',
      onSelect() {
        openModal(row.original)
      }
    },
    { type: 'separator' },
    {
      label: 'View Supplier Details',
      icon: 'i-lucide-list',
      onSelect() {
        selectedSupplier.value = row.original.supplier
        viewModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Edit Supplier',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.supplier.id
        editModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Delete Supplier',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Supplier deleted',
          description: 'The supplier has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<SupplierWithContacts>[] = [
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
  { id: 'name', header: 'Name', accessorFn: (r) => r.supplier.name },
  { id: 'contact', header: 'Contact', accessorFn: (r) => r.supplier.contact ?? '' },
  { id: 'phone', header: 'Phone', accessorFn: (r) => r.supplier.phone ?? '' },
  { id: 'address', header: 'Address', accessorFn: (r) => r.supplier.address ?? '' },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const count = row.original.supplierContacts
      return h(UButton, {
        label: `View`,
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        onClick: () => openModal(row.original)
      })
    }
  },
  {
    id: 'active',
    header: 'Active',
    accessorFn: (r) => r.supplier.active,
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.supplier.active ? 'success' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full' }
        },
        () => (row.original.supplier.active ? 'Active' : 'Inactive')
      )
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
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
]

const filter = ref<'true' | 'false' | 'all'>('true')

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

// Search by supplier name
const search = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('name')?.setFilterValue(value || undefined)
  }
})
</script>

<template>
  <UDashboardPanel id="supplier">
    <template #header>
      <UDashboardNavbar title="List Supplier">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <SupplierAddModal @submitted="fetchPagination"/>
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
            placeholder="Filter Supplier Name..."
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
        :data="suppliers"
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

      <SupplierEditModal 
        v-model:open="editModalOpen"
        :id="selectedId"
        @submitted="fetchPagination"
      />

      <SupplierViewModal
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

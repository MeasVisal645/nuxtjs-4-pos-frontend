<script setup lang="ts">
import { h, resolveComponent, ref, computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Customer } from '~/types'

const {
  fetchPagination,
  loadError,
  customers,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
  search: customerSearch,
  deleteById
} = useCustomer()

const search = computed({
  get: () => customerSearch.value,
  set: (v: string) => {
    customerSearch.value = v
    pageNumber.value = 1
  }
})

const editModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

function getRowItems(row: Row<Customer>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'Edit Customer',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.id
        editModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Delete Customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        deleteById(Number(row.original.id))
      }
    }
  ]
}

const columns: TableColumn<Customer>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => {
      return (pageNumber.value - 1) * pageSize.value + row.index + 1
    }
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'address', header: 'Address' },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right' },
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: getRowItems(row)
        }, () =>
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
</script>

<template>
  <UDashboardPanel id="customer">
    <template #header>
      <UDashboardNavbar title="List Customer">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <CustomerAddModal @submitted="fetchPagination" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ERROR -->
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load customers"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <!-- FILTERS -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search..."
        />
      </div>

      <!-- TABLE -->
      <UTable
        class="shrink-0"
        :data="customers"
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

      <!-- EDIT MODAL -->
      <CustomerEditModal
        v-model:open="editModalOpen"
        :id="selectedId"
        @submitted="fetchPagination"
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
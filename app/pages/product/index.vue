<script setup lang="ts">
import { h, ref, computed, watch, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Product } from '~/types'

const {
  fetchPagination,
  loadError,
  products,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
  search,
  isActive,
  deleteById
} = useProduct()

const editModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)
const defaultValues = ref<Record<string, any>>({})

const toast = useToast()

const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// ---------- FILTER ----------
const filter = ref<'all' | 'true' | 'false'>('true')

watch(filter, (val) => {
  isActive.value = val === 'all' ? null : val === 'true'
  pageNumber.value = 1
})

// ---------- SEARCH ----------
const searchInput = computed({
  get: () => search.value,
  set: (v: string) => {
    search.value = v
    pageNumber.value = 1
  }
})

// ---------- ROW ACTIONS ----------
function getRowItems(row: Row<Product>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'Edit Product',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.id
        editModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Delete Product',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        deleteById(row.original.id)
        toast.add({
          title: 'Product deleted',
          description: 'The product has been deleted.'
        })
      }
    }
  ]
}

// ---------- COLUMNS ----------
const columns: TableColumn<Product>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (pageNumber.value - 1) * pageSize.value + row.index + 1
  },
  {
    id: 'image',
    header: 'Image',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.imageUrl || undefined,
          alt: row.original.name || 'Image',
          size: '2xl'
        })
      ])
  },
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price' },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.quantity >= 10 ? 'success' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full', font: 'font-medium' }
        },
        () => row.original.quantity
      )
  },
  { accessorKey: 'unit', header: 'Unit' },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.active ? 'success' : 'error',
          variant: 'soft',
          ui: { rounded: 'rounded-full' }
        },
        () => (row.original.active ? 'Active' : 'Inactive')
      )
  },
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
  <UDashboardPanel id="product">
    <template #header>
      <UDashboardNavbar title="List Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ProductAddModal
            @submitted="fetchPagination"
            :default-values="defaultValues"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ERROR -->
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load products"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <!-- FILTERS -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="searchInput"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search..."
        />

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
      </div>

      <!-- TABLE -->
      <UTable
        class="shrink-0"
        :data="products"
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
      <ProductEditModal
        v-model:open="editModalOpen"
        :id="selectedId"
        @submitted="fetchPagination"
        :default-values="defaultValues"
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
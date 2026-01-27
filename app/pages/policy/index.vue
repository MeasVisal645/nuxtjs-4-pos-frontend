<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Policy } from '~/types'
import { usePolicy } from '~/composables/usePolicy'

const {
  selectedPolicyId,
  fetchPolicy,
  showModal,
} = usePolicy()
const config = useRuntimeConfig()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([])
const columnVisibility = ref()
const rowSelection = ref<Record<number, boolean>>({})

const viewModalOpen = ref(false)
const editModalOpen = ref(false)
const selectedPolicy = ref<Policy | null>(null)

const { data, status } = await useFetch<Policy[]>(`${config.public.apiBaseUrl}/api/v1/policy/all`, {
  lazy: true
})

function getRowItems(row: Row<Policy>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy policy No',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.policyNo.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'Policy No copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View policy details',
      icon: 'i-lucide-list',
      onSelect() {
        selectedPolicy.value = row.original
        viewModalOpen.value = true     
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit policy',
      icon: 'i-lucide-pencil',
        onSelect() {
          selectedPolicyId.value = String(row.original.id)
          editModalOpen.value = true
        }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete policy',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Policy deleted',
          description: 'The policy has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Policy>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'policyNo',
    header: 'Policy No',
    cell: ({ row }) => row.original.policyNo
  },
  {
    accessorKey: 'policyHolder',
    header: 'Holder',
    cell: ({ row }) => row.original.policyHolder
  },
  {
    accessorKey: 'premium',
    header: 'Premium',
    cell: ({ row }) => row.original.premium
  },
  {
    accessorKey: 'sumInsured',
    header: 'Sum Insured',
    cell: ({ row }) => row.original.sumInsured
  },
  {
    accessorKey: 'inceptionDate',
    header: 'Inception',
    cell: ({ row }) => row.original.inceptionDate
  },
  {
    accessorKey: 'expiredDate',
    header: 'expiry',
    cell: ({ row }) => row.original.expiredDate
  },
  {
    accessorKey: 'issueDate',
    header: 'issue',
    cell: ({ row }) => row.original.issueDate
  },
    {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => row.original.address
  },
    {
    accessorKey: 'province',
    header: 'Province',
    cell: ({ row }) => row.original.province
  },
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => row.original.product
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

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('product')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
})

const policyNo = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('policyNo')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('policyNo')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>
  <UDashboardPanel id="policies">
    <template #header>
      <UDashboardNavbar title="Policy">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <PolicyAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="policyNo"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter Policy No..."
        />

        <!-- Top right function -->
        <div class="flex flex-wrap items-center gap-1.5">
          <PolicyDeleteModal 
            :ids="table?.tableApi?.getFilteredSelectedRowModel().rows.map((r: any) => r.original.id) ?? []"
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
          >
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </PolicyDeleteModal>
          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'PA', value: 'PA' },
              { label: 'Health', value: 'Health' },
              { label: 'PA & Health', value: 'PA & Health' }
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
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />
      <PolicyEditModal
        :selectedPolicyId="selectedPolicyId"
        :open="showModal"
        @update:open="value => showModal = value"
        @updated="fetchPolicy"
      />

      <PolicyViewModal
        v-model:open="viewModalOpen"
        :policy="selectedPolicy"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
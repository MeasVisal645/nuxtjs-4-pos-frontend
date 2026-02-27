<script setup lang="ts">
import { h, resolveComponent, ref, computed, watch, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Expenses, Period, Range } from '~/types'
import type { Row } from '@tanstack/table-core'
import toArray from '~/utils/helper'
import { sub } from 'date-fns'
import { useExpense } from '~/composables/useExpense'

type User = { id: number; username: string }

const range = ref<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')

const {
  loadError,
  expenses,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
  fetchPagination,
  search: reportSearch,
} = useExpense(period, range)

const editModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)

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

async function loadLookups() {
  const [userRes] = await Promise.all([
    useApi('/user/all'),
  ])
  users.value = toArray<User>(userRes)
}

onMounted(loadLookups)

const userNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(users.value.map(u => [Number(u.id), u.username]))
)

// ---------- RESOLVE COMPONENT ----------
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')

// ---------- ROW ACTIONS ----------
function getRowItems(row: Row<Expenses>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'Edit Expense',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.id
        editModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Delete Expense',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
      }
    }
  ]
}

// ---------- TABLE COLUMNS ----------
const columns: TableColumn<Expenses>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => {
      return (pageNumber.value - 1) * pageSize.value + row.index + 1
    }
  },
  {
    id: 'reference',
    header: 'Reference',
    accessorFn: (r) => r.reference
  },
  {
    id: 'category',
    header: 'Category',
    accessorFn: (r) => r.category
  },
  {
    id: 'note',
    header: 'Note',
    accessorFn: (r) => r.note
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorFn: (r) => r.amount
  },
  {
    id: 'userId',
    header: 'Created By',
    cell: ({ row }) => {
      const id = row.original.userId
      return userNameById.value[id] ?? `#${id}`
    }
  },
  {
    accessorKey: 'createdDate',
    header: 'Date (dd/mm/yyyy)',
    cell: ({ row }) => {
      const d = new Date(row.original.createdDate)
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
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

  const res = await useApi<{ content: Expenses[] }>(`/expense?${query.toString()}`)
  const rows = res?.content ?? []

  return rows.map((item, index) => {
    const d = new Date(item.createdDate)
    const date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    return {
      no: index + 1,
      reference: item.reference,
      category: item.category,
      note: item.note ?? '',
      amount: item.amount,
      createdBy: userNameById.value[item.userId] ?? `#${item.userId}`,
      date,
    }
  })
}
</script>

<template>
  <UDashboardPanel id="expense">
    <template #header>
      <UDashboardNavbar title="List Expense">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ExpenseAddModal @submitted="fetchPagination" />
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
            placeholder="Search..."
          />

          <!-- DATE RANGE PICKER -->
          <HomeDateRangePicker 
            v-model="range"
          />
        </div>

        <ExportCsvButton
          filename="expenses"
          :range="range"
          :headers="['No', 'Reference', 'Category', 'Note', 'Amount', 'Created By', 'Date']"
          :fetch-data="fetchExportData"
        />
      </div>

      <!-- TABLE -->
      <UTable
        class="shrink-0"
        :data="expenses"
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

      <ExpenseEditModal 
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
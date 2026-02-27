<script setup lang="ts">
import { h, resolveComponent, toRef, ref, computed, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { OrderItemDetails, Period, Range } from '~/types'
import toArray from '~/utils/helper'

type User = { id: number; username: string }

const props = defineProps<{
  period: Period
  range: Range
}>()

const UBadge = resolveComponent('UBadge')

const periodRef = toRef(props, 'period')
const rangeRef = toRef(props, 'range')

const {
  orderItems,
  pending,
} = useSaleReport(periodRef, rangeRef)

// ---------- LOOKUPS ----------
const users = ref<User[]>([])

async function loadLookups() {
  const userRes = await useApi('/user/all')
  users.value = toArray<User>(userRes)
}

onMounted(loadLookups)

const userNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(users.value.map(u => [Number(u.id), u.username]))
)

// ---------- PAGINATION ----------
const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

// ---------- COLUMNS ----------
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
    accessorFn: r => r.orderItems.orderNo
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
  }
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTable
      class="w-full shrink-0"
      v-model:pagination="pagination"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
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
  </div>
</template>
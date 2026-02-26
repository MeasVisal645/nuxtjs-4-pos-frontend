<script setup lang="ts">
import { h, resolveComponent, ref, computed, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AuditLog } from '~/types'
import toArray from '~/utils/helper'

type User = { id: number; username: string }

const {
  loadError,
  auditLog,
  pending,
  pageNumber,
  pageSize,
  totalRecords,
} = useAuditLog()

const UBadge = resolveComponent('UBadge')

const columnVisibility = ref<Record<string, boolean>>({
  userAgent: false
})

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

// ---------- COLUMNS ----------
const columns: TableColumn<AuditLog>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => {
      return (pageNumber.value - 1) * pageSize.value + row.index + 1
    }
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => {
      const id = row.original.userId
      return userNameById.value[id] ?? `#${id}`
    }
  },
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
          color: colorMap[row.original.method] ?? 'neutral',
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
        <template #right />
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- ERROR -->
      <div v-if="loadError" class="mb-3">
        <UAlert
          color="error"
          title="Failed to load audit logs"
          :description="loadError?.data?.message || loadError?.message || 'Unknown error'"
        />
      </div>

      <!-- TABLE -->
      <UTable
        v-model:column-visibility="columnVisibility"
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
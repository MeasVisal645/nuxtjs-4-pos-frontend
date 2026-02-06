<script setup lang="ts">
import type { User, EmployeeUser } from '~/types'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import EditUser from './EditUser.vue';

const {
  fetchPagination
} = useEmployee()

const props = defineProps<{
  open: boolean
  data: EmployeeUser | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  submitted: []  
}>()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const editModalOpen = ref(false)
const addModalOpen = ref(false)
const selectedId = ref<string | number | null>(null)

function openAddUser() {
  selectedId.value = props.data?.employee?.id ?? null
  addModalOpen.value = true
}

async function refresh() {
  await fetchPagination()
}

const firstName = computed(() => props.data?.employee?.firstName ?? '')
const lastName = computed(() => props.data?.employee?.lastName ?? '')

const users = computed<User[]>(() => props.data?.user ?? [])


function getRowItem(row: Row<User>) {
  return [
    { type: 'label', label: 'Actions' },
    { type: 'separator' },
    {
      label: 'Edit User',
      icon: 'i-lucide-pencil',
      onSelect() {
        selectedId.value = row.original.id
        editModalOpen.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Delete User',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        // row.original is User
      }
    }
  ]
}

const columns: TableColumn<User>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1
  },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'role', header: 'Role' },
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
            items: getRowItem(row)
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
</script>

<template>
  <UModal
    scrollable
    :open="open"
    :ui="{ content: 'w-full sm:max-w-7xl' }"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <div class="font-semibold">Employee Details</div>
          <div class="text-sm text-muted" v-if="firstName || lastName">
            {{ firstName }} {{ lastName }} • {{ users.length }}
          </div>
        </div>


        <EmployeeAddUser
          v-model:open="addModalOpen"
          :id="props.data?.employee?.id ?? null"
          @submitted="refresh"
        />
        <!-- <EmployeeAddUser
          v-model:open="addModalOpen"
          :id="props.data?.employee?.id ?? null"
          @submitted="() => emit('submitted')"
        /> -->
      </div>
    </template>

    <template #body>
      <div v-if="!data" class="text-sm text-muted">
        No employee selected.
      </div>

      <div v-else>
        <UTable
          :data="users"
          :columns="columns"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r text-black dark:text-white',
            td: 'border-b border-default text-black dark:text-white',
            separator: 'h-0'
          }"
        />

        <EditUser 
          v-model:open="editModalOpen"
          :id="selectedId"
          @submitted="() => emit('submitted')"
        />

        <div v-if="users.length === 0" class="text-sm text-muted mt-3">
          This employee has no user.
        </div>
      </div>
    </template>
  </UModal>
</template>

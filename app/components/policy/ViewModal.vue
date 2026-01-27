<script setup lang="ts">
import type { items, Policy } from '~/types'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'

const props = defineProps<{
  open: boolean
  policy: Policy | null
}>()

const emit = defineEmits(['update:open'])
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UBadge')
const UButton = resolveComponent('UBadge')

const addModalOpen = ref(true)
const selectedItems = ref<items | null>(null)

const itemColumns: TableColumn<any>[] = [
  { accessorKey: 'policyNo', header: 'Policy No' },
  { accessorKey: 'insuredName', header: 'Insured Name' },
  { accessorKey: 'sex', header: 'Sex' },
  { accessorKey: 'dob', header: 'DOB' },
  { accessorKey: 'cardNo', header: 'Card No' },
  { accessorKey: 'inceptionDate', header: 'Inception' },
  { accessorKey: 'expiredDate', header: 'Expiry' },
  { accessorKey: 'issueDate', header: 'Issued' },

  {
    accessorKey: 'remark',
    header: 'Remark',
    cell: ({ row }) => {
      const remark = row.original.remark as string;

      const colorMap: Record<string, string> = {
        "New Policy": "success",
        "Renew Policy": "warning",
        "Cancelled": "error"
      };

      const color = colorMap[remark] ?? "neutral";

      return h(
        UBadge,
        { class: "capitalize", variant: "subtle", color },
        () => remark
      );
    }
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

];

function getRowItems(row: Row<Policy>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy name',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.policyNo.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'Name copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Edit item',
      icon: 'i-lucide-pencil',
      color: 'success',
      onSelect() {
        toast.add({
          title: 'Item Edited',
          description: 'The item has been edited.'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete item',
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
</script>

<template>
  <UModal
    :open="open"
    @update:open="value => emit('update:open', value)"
    :ui="{
      content: 'max-w-[1300px] w-full'
    }"
  >
    <template #header>
      <div class="flex justify-between w-full">
        <h3 class="text-lg font-semibold">
          {{ policy ? `Policy Items for ${policy.policyNo}` : 'Policy Items' }}
        </h3>

        <div class="flex">
          <ItemAddModal
            v-if="policy"
            :policyNo="policy.policyNo"
            :policyId="policy.id"
            :inceptionDate="policy.inceptionDate"
            :expiredDate="policy.expiredDate"
            :issueDate="policy.issueDate"
            v-model:open="addModalOpen"
          />

        </div>
      </div>
    </template>

    <template #body>
      <div v-if="policy?.items?.length">
        <UTable
          :columns="itemColumns"
          :data="policy.items"
          class="shrink-0"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }"
        />
      </div>
    </template>
  </UModal>
</template>

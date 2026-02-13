<script setup lang="ts">
import type { OrderItemDetails, OrderDetails } from '~/types'
import type { TableColumn } from '@nuxt/ui'
import toArray from '~/utils/helper'

type Customer = { id: number; name: string }
type Product = { id: number; name: string }

const products = ref<Product[]>([])
const customers = ref<Customer[]>([])

async function loadLookups() {
  const [prodRes, custRes] = await Promise.all([
    useApi('/product/all'),
    useApi('/customer/all')
  ])

  products.value = toArray<Product>(prodRes)
  customers.value = toArray<Customer>(custRes)
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (err) {
    console.error('Failed to load lookups:', err)
  }
})

const productNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(products.value.map(p => [p.id, p.name]))
)

const customerNameById = computed<Record<number, string>>(() =>
  Object.fromEntries(customers.value.map(c => [c.id, c.name]))
)

const props = defineProps<{
  open: boolean
  data: OrderItemDetails | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  submitted: []
}>()

// ---- derived from props ----
const details = computed<OrderDetails[]>(() => props.data?.orderDetails ?? [])

const orderNo = computed(() => props.data?.orderItems?.orderNo ?? '')
const createdDate = computed(() => props.data?.orderItems?.createdDate ?? '')

// take from first detail row (assuming all details share same customer/payment)
const firstDetail = computed(() => details.value[0] ?? null)

const customerId = computed(() => firstDetail.value?.customerId ?? null)
const paymentMethod = computed(() => firstDetail.value?.paymentMethod ?? '')

const customerName = computed(() => {
  const id = customerId.value
  if (id == null) return ''
  return customerNameById.value[id] ?? `#${id}`
})

const columns: TableColumn<OrderDetails>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => row.index + 1
  },
  {
    id: 'product',
    header: 'Product',
    accessorFn: (r) => productNameById.value[r.productId] ?? `#${r.productId}`
  },
  { accessorKey: 'quantity', header: 'Quantity' },
  { accessorKey: 'total', header: 'Total' }
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
          <div class="font-semibold text-lg">Order Details</div>

          <div class="text-md" v-if="orderNo">
            Order No: {{ orderNo }}
          </div>

          <div class="text-md" v-if="createdDate">
            Created Date: {{ formatDateTime(createdDate) }}
          </div>

          <div class="text-md" v-if="customerName">
            Customer: {{ customerName }}
          </div>

          <div class="text-md" v-if="paymentMethod">
            Payment Method: {{ paymentMethod }}
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="!data" class="text-sm text-muted">
        No order selected.
      </div>

      <div v-else>
        <UTable
          :data="details"
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
      </div>
    </template>

    <template #footer>
      <div class="text-sm text-muted" v-if="orderNo">
        Total Records: {{ details.length }}
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import toArray from '~/utils/helper'

definePageMeta({ layout: 'blank' })

type Customer = { id: number; name: string }
type Category = { id: number; name: string }



// ---------- State ----------
const products = ref<any[]>([])
const categories = ref<Category[]>([])
const searchQuery = ref('')
const categoryNames = ref<string[]>(['All'])
const selectedCategory = ref('All')
const cart = ref<{ product: any; quantity: number }[]>([])
const isPaymentModalOpen = ref(false)

const customers = ref<Customer[]>([])
const customerItems = ref<{ label: string; value: number }[]>([])
const selectedCustomerId = ref<number | undefined>(undefined)

// ---------- Loaders ----------
async function loadCustomers() {
  const res = await useApi('/customer/all')
  const list = toArray<Customer>(res)

  customers.value = list
  customerItems.value = list.map(c => ({ label: c.name, value: c.id }))

  const first = list.at(0) // Customer | undefined
  if (selectedCustomerId.value === undefined && first) {
    selectedCustomerId.value = first.id
  }
}


async function loadProductsAndCategories() {
  const [prodRes, catRes] = await Promise.all([
    useApi('/product/all'),
    useApi('/category/all')
  ])

  const prodList = toArray<any>(prodRes)
  const catList = toArray<any>(catRes)

  products.value = prodList
  categories.value = catList as Category[]
  categoryNames.value = ['All', ...catList.map((c: any) => c.name).filter(Boolean)]


}

onMounted(async () => {
  try {
    await Promise.all([loadProductsAndCategories(), loadCustomers()])
  } catch (err) {
    console.error('Failed to sync POS data:', err)
  }
})

// ---------- Derived ----------
const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  const selectedCat = categories.value.find(
    c => c.name === selectedCategory.value
  )

  return products.value.filter((p) => {
    const name = String(p?.name ?? '').toLowerCase()
    const code = String(p?.code ?? '').toLowerCase()

    const matchesSearch = !query || name.includes(query) || code.includes(query)

    const matchesCategory =
      selectedCategory.value === 'All' ||
      p.categoryId === selectedCat?.id

    return matchesSearch && matchesCategory
  })
})


const subtotalCents = computed(() =>
  cart.value.reduce((sum, item) => sum + Math.round(Number(item.product.price ?? 0) * 100) * item.quantity, 0)
)
const taxCents = computed(() => Math.round(subtotalCents.value * 0.08))
const totalCents = computed(() => subtotalCents.value + taxCents.value)

const subtotal = computed(() => subtotalCents.value / 100)
const tax = computed(() => taxCents.value / 100)
const total = computed(() => totalCents.value / 100)

const totalItems = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0))

const selectedCustomer = computed(() => {
  const id = selectedCustomerId.value
  if (id === undefined) return null
  return customers.value.find(c => c.id === id) ?? null
})

const selectedCustomerName = computed(() => selectedCustomer.value?.name ?? 'Walk-in')

// ---------- Cart Actions ----------
function addToCart(product: any) {
  const existing = cart.value.find(i => i.product.id === product.id)
  if (existing) existing.quantity++
  else cart.value.push({ product, quantity: 1 })
}

function updateQuantity(index: number, delta: number) {
  const item = cart.value[index]
  if (!item) return
  item.quantity += delta
  if (item.quantity <= 0) cart.value.splice(index, 1)
}

function handleCheckout() {
  if (cart.value.length > 0) isPaymentModalOpen.value = true
  else alert('Cart is empty!')
}

// ---------- Payment ----------
async function confirmPayment(method: 'KHQR' | 'CASH' = 'KHQR') {
  try {
    if (cart.value.length === 0) return

    const customerId = selectedCustomerId.value
    if (customerId === undefined) {
      alert('Please select customer')
      return
    }

    const receiptData = {
      customerId,
      customerName: selectedCustomerName.value,
      items: cart.value.map(i => ({
        name: i.product.name,
        price: Number(i.product.price ?? 0),
        quantity: i.quantity
      })),
      total: total.value,
      date: new Date().toISOString(),
      paymentMethod: method
    }

    const body = cart.value.map(i => ({
      code: i.product.code,
      quantity: i.quantity,
      customerId,
      paymentMethod: method
    }))

    await useApi('/order/create', { method: 'POST', body })

    isPaymentModalOpen.value = false
    cart.value = []

    await navigateTo({
      path: '/receipt',
      query: { data: JSON.stringify(receiptData) }
    })
  } catch (err) {
    console.error('Payment failed:', err)
    alert('Payment failed')
  }
}
</script>

<template>
  <div class="flex h-screen gap-4 p-4 bg-gray-50 dark:bg-gray-950 overflow-hidden">
    <!-- Product Section -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Filters Header -->
      <div class="flex justify-between items-center mb-4 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm">
        <div class="flex items-center gap-4">
          <NuxtLink to="/">
            <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" label="Back" />
          </NuxtLink>
          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div class="flex items-center gap-1 overflow-x-auto">
            <UButton
              v-for="cat in categoryNames"
              :key="cat"
              :label="cat"
              :variant="selectedCategory === cat ? 'solid' : 'ghost'"
              :color="selectedCategory === cat ? 'info' : 'neutral'"
              size="sm"
              @click="selectedCategory = cat"
            />
          </div>
        </div>

        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Search items..." class="w-72">
          <template #trailing v-if="searchQuery">
            <UButton icon="i-lucide-x" variant="ghost" size="xs" @click="searchQuery=''" />
          </template>
        </UInput>
      </div>

      <!-- Products Grid -->
      <div class="flex-1 overflow-y-auto p-2">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
          <UCard
            v-for="product in filteredProducts"
            :key="product.id"
            class="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all active:scale-95"
            :ui="{ body: 'p-3' }"
            @click="addToCart(product)"
          >
            <div class="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              <img
                v-if="product.imageUrl"
                :src="product.imageUrl"
                :alt="product.name"
                class="w-full h-full object-contain p-2"
                loading="lazy"
              />
              <UIcon
                v-else
                name="i-lucide-package"
                class="w-12 h-12 text-gray-400"
              />
            </div>

            <div class="font-semibold truncate text-sm">{{ product.name }}</div>
            <div class="text-info-600 dark:text-info-400 font-bold text-sm mt-1">
              ${{ Number(product.price ?? 0).toFixed(2) }}
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Cart Section -->
    <UCard
      class="w-96 flex flex-col h-full shadow-xl overflow-hidden"
      :ui="{
        body: 'flex-1 flex flex-col p-0 overflow-hidden',
        header: 'p-4 shrink-0',
        footer: 'p-4 border-t dark:border-gray-800 shrink-0'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-lg">Current Order</h2>
          <UBadge color="info" variant="subtle" size="lg">{{ totalItems }} items</UBadge>
        </div>

        <div class="mt-3">
          <USelect
            v-model="selectedCustomerId"
            :items="customerItems"
            placeholder="Select customer"
            class="w-full"
          />
        </div>
      </template>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto space-y-4">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
          <UIcon name="i-lucide-shopping-cart" class="w-16 h-16" />
          <p class="font-medium">No items added</p>
        </div>

        <div
          v-else
          v-for="(item, idx) in cart"
          :key="item.product.id"
          class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg"
        >
          <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img
              v-if="item.product.imageUrl"
              :src="item.product.imageUrl"
              :alt="item.product.name"
              class="w-full h-full object-contain p-2"
              loading="lazy"
            />
            <UIcon
              v-else
              name="i-lucide-package"
              class="w-6 h-6 text-gray-400"
            />
          </div>


          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate text-sm">{{ item.product.name }}</div>
            <div class="text-xs text-gray-500">${{ Number(item.product.price ?? 0).toFixed(2) }}</div>
          </div>
          <div class="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-md p-1 shadow-sm">
            <UButton icon="i-lucide-minus" color="info" variant="ghost" size="xs" @click.stop="updateQuantity(idx, -1)" />
            <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
            <UButton icon="i-lucide-plus" color="info" variant="ghost" size="xs" @click.stop="updateQuantity(idx, 1)" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="space-y-3">
          <div class="space-y-1 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-500 border-b dark:border-gray-800 pb-2">
              <span>Tax (8%)</span>
              <span>${{ tax.toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex justify-between font-black text-2xl mb-2">
            <span>Total</span>
            <span class="text-info-600">${{ total.toFixed(2) }}</span>
          </div>

          <UButton
            block
            size="xl"
            color="primary"
            class="font-bold"
            :disabled="cart.length === 0"
            @click="handleCheckout"
          >
            Check out ${{ total.toFixed(2) }}
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Payment Modal -->
    <UModal v-model:open="isPaymentModalOpen" title="Payment">
      <template #body>
        <div class="p-6">
          <div class="text-center mb-8">
            <div class="text-gray-500 uppercase text-xs font-bold tracking-widest">Total Amount</div>
            <div class="text-5xl font-black text-primary-600 mt-1">${{ total.toFixed(2) }}</div>
            <div class="text-sm text-gray-500 mt-2">
              Customer: <span class="font-semibold">{{ selectedCustomerName }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <UButton
              block size="xl" color="info" variant="outline"
              icon="i-lucide-banknote" label="Cash"
              class="h-20 flex-col gap-2"
              @click="confirmPayment('CASH')"
            />
            <UButton
              block size="xl" color="info" variant="outline"
              icon="i-lucide-qr-code" label="QR Code"
              class="h-20 flex-col gap-2"
              @click="confirmPayment('KHQR')"
            />
          </div>

          <div class="flex gap-2">
            <UButton label="Cancel" color="info" variant="ghost" class="flex-1" @click="isPaymentModalOpen = false" />
            <UButton label="Confirm (Cash)" color="primary" class="flex-1 font-bold" @click="confirmPayment('CASH')" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
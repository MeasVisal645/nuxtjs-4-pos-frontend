<script setup lang="ts">
definePageMeta({
  layout: "blank"
})

// Mock Data
const categories = ['All', 'Coffee', 'Tea', 'Bakery', 'Food']
const products = [
  { id: 1, name: 'Espresso', price: 3.50, category: 'Coffee', image: 'i-lucide-coffee' },
  { id: 2, name: 'Cappuccino', price: 4.50, category: 'Coffee', image: 'i-lucide-coffee' },
  { id: 3, name: 'Latte', price: 4.50, category: 'Coffee', image: 'i-lucide-coffee' },
  { id: 4, name: 'Green Tea', price: 3.00, category: 'Tea', image: 'i-lucide-cup-soda' },
  { id: 5, name: 'Croissant', price: 3.50, category: 'Bakery', image: 'i-lucide-croissant' },
  { id: 6, name: 'Bagel', price: 3.00, category: 'Bakery', image: 'i-lucide-circle-dot' },
  { id: 7, name: 'Sandwich', price: 7.50, category: 'Food', image: 'i-lucide-sandwich' },
  { id: 8, name: 'Salad', price: 8.00, category: 'Food', image: 'i-lucide-salad' },
]

const searchQuery = ref('')
const selectedCategory = ref('All')
const cart = ref<{ product: typeof products[0], quantity: number }[]>([])
const isPaymentModalOpen = ref(false)

const filteredProducts = computed(() => {
  return products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const subtotal = computed(() => cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))
const tax = computed(() => subtotal.value * 0.08)
const total = computed(() => subtotal.value + tax.value)

function addToCart(product: typeof products[0]) {
  const existing = cart.value.find(i => i.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

// function updateQuantity(index: number, delta: number) {
//   const item = cart.value[index]
//   item.quantity += delta
//   if (item.quantity <= 0) {
//     cart.value.splice(index, 1)
//   }
// }

function handleCheckout() {
  isPaymentModalOpen.value = true
}

async function confirmPayment() {
  // Store the current total/cart before clearing
  const orderData = {
    items: cart.value.map(i => ({ name: i.product.name, price: i.product.price, quantity: i.quantity })),
    total: total.value,
    date: new Date().toISOString()
  }

  // Clear cart
  cart.value = []
  isPaymentModalOpen.value = false

  // Redirect to receipt page with order data
  await navigateTo({
    path: '/receipt',
    query: {
      data: JSON.stringify(orderData)
    }
  })
}

</script>

<template>
  <div class="flex h-screen gap-4">
    <!-- Product Section -->
    <div class="flex-1 flex flex-col gap-4 min-w-0">
      <!-- Filters -->
      <div class="flex gap-4 p-4 items-center justify-between">
        <div class="flex gap-2">
          <UButton 
            v-for="cat in categories" 
            :key="cat"
            :label="cat"
            :variant="selectedCategory === cat ? 'solid' : 'ghost'"
            color="info"
            icon="i-lucide-check"
            size="md"
            @click="selectedCategory = cat"
          />
        </div>
        <UInput 
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Search items..."
          class="w-64"
          size="lg"
        />
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 p-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-4">
        <UCard
          v-for="product in filteredProducts"
          :key="product.id"
          class="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
          @click="addToCart(product)"
        >
          <div class="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
            <UIcon :name="product.image" class="w-12 h-12 text-gray-400" />
          </div>
          <div class="font-semibold truncate">{{ product.name }}</div>
          <div class="text-gray-500 text-sm">${{ product.price.toFixed(2) }}</div>
        </UCard>
      </div>
    </div>

    <!-- Cart Section -->
    <!-- 1. Add h-full to the card and use the :ui prop to make the body flexible -->
    <UCard 
      class="w-96 flex flex-col h-full overflow-hidden" 
      :ui="{ 
        body: 'flex-1 overflow-y-auto p-0', 
        header: 'p-4', 
        footer: 'p-4' 
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-lg">Current Order</h2>
          <UBadge color="info" variant="subtle">{{ cart.length }} items</UBadge>
        </div>
      </template>

      <!-- 2. This DIV now takes all available space and scrolls -->
      <div class="flex-1 overflow-y-auto space-y-4">
        <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-400 space-y-2">
          <UIcon name="i-lucide-shopping-cart" class="w-12 h-12" />
          <p>No items added</p>
        </div>
        
        <div v-else v-for="(item, idx) in cart" :key="item.product.id" class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center shrink-0">
            <UIcon :name="item.product.image" class="w-6 h-6 text-gray-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate text-sm">{{ item.product.name }}</div>
            <div class="text-xs text-gray-500">${{ item.product.price.toFixed(2) }}</div>
          </div>
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <UButton 
              icon="i-lucide-minus" 
              color="info" 
              variant="ghost" 
              size="xs" 
            />
            <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
            <UButton 
              icon="i-lucide-plus" 
              color="info" 
              variant="ghost" 
              size="xs" 
            />
          </div>
        </div>
      </div>

      <template #footer>
        <!-- 3. This remains fixed at the bottom -->
        <div class="space-y-3">
          <div class="space-y-1 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Tax (8%)</span>
              <span>${{ tax.toFixed(2) }}</span>
            </div>
          </div>
          <div class="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>${{ total.toFixed(2) }}</span>
          </div>
          <UButton 
            block 
            size="lg" 
            color="primary" 
            :disabled="cart.length === 0"
            @click="handleCheckout"
          >
            Charge ${{ total.toFixed(2) }}
          </UButton>
        </div>
      </template>
    </UCard>


    <UModal v-model:open="isPaymentModalOpen" title="Complete Payment">
      <template #body>
        <div class="space-y-6">
          <div class="text-center space-y-1">
            <div class="text-4xl font-bold">${{ total.toFixed(2) }}</div>
            <div class="text-gray-500">Total Amount</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UButton block size="lg" color="info" variant="outline" icon="i-lucide-banknote" label="Cash" />
            <UButton block size="lg" color="info" variant="outline" icon="i-lucide-credit-card" label="Card" />
          </div>
        </div>
      </template>
      <template #footer>
        <UButton block size="lg" color="primary" label="Confirm Payment" @click="confirmPayment" />
      </template>
    </UModal>
  </div>
</template>
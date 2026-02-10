<script setup lang="ts">
definePageMeta({
  layout: "blank"
})

const route = useRoute()
const order = computed(() => {
  try {
    return JSON.parse(route.query.data as string)
  } catch (e) {
    return null
  }
})

// Trigger print once the component is mounted
onMounted(() => {
  if (order.value) {
    setTimeout(() => {
      window.print()
      // Optional: Navigate back to POS after printing/cancelling
      // window.onafterprint = () => navigateTo('/')
    }, 500)
  }
})
</script>

<template>
  <div class="max-w-75 mx-auto p-4 font-mono text-sm bg-white min-h-screen">
    <div v-if="order">
      <div class="text-center mb-4">
        <h1 class="font-bold text-lg uppercase">Store Receipt</h1>
        <p>{{ new Date(order.date).toLocaleString() }}</p>
      </div>

      <div class="border-t border-dashed border-gray-400 py-2 space-y-1">
        <div v-for="item in order.items" :key="item.name" class="flex justify-between">
          <span>{{ item.quantity }}x {{ item.name }}</span>
          <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
        </div>
      </div>

      <div class="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
        <div class="flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>${{ order.total.toFixed(2) }}</span>
        </div>
      </div>

      <div class="text-center mt-8">
        <p>Thank you for your visit!</p>
      </div>
    </div>
    
    <div v-else class="text-center py-10">
      <p>No order data found.</p>
      <UButton to="/" variant="ghost">Return to POS</UButton>
    </div>
  </div>
</template>

<style scoped>
/* Ensure only the receipt prints, no extra browser margins */
@media print {
  @page {
    margin: 0;
  }
  body {
    margin: 1cm;
  }
}
</style>

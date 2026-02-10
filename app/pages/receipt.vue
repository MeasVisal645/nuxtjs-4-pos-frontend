<script setup lang="ts">
definePageMeta({
  layout: "blank"
})

const route = useRoute()
const order = computed(() => {
  const raw = route.query.data
  const str = Array.isArray(raw) ? raw[0] : raw
  return str ? JSON.parse(str) : null
})

onMounted(() => {
  if (order.value) {
    setTimeout(() => {
      window.print()
    }, 500)
  }
})
</script>

<template>
  <div class="max-w-75 mx-auto p-4 text-black font-mono text-sm bg-white min-h-screen">
    <div v-if="order">
      <div class="text-center mb-4">
        <h1 class="font-bold text-lg uppercase text-black">Store Receipt</h1>
        <p class="text-black">{{ new Date(order.date).toLocaleString() }}</p>
      </div>

      <div class="border-t border-dashed  border-gray-400 py-2 space-y-1">
        <div v-for="item in order.items" :key="item.name" class="flex justify-between">
          <span class="text-black">{{ item.quantity }}x {{ item.name }}</span>
          <span class="text-black">${{ (item.price * item.quantity).toFixed(2) }}</span>
        </div>
      </div>

      <div class="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
        <div class="flex justify-between font-bold text-lg">
          <span class="text-black">TOTAL</span>
          <span class="text-black">${{ order.total.toFixed(2) }}</span>
        </div>
      </div>

      <div class="text-center mt-8">
        <p class="text-black">Thank you for your visit!</p>
      </div>
      <div class="flex justify-center gap-2 print:hidden">
        <UButton to="/pos" variant="outline" icon="i-heroicons-arrow-left" class="text-blue-800">
          Back
        </UButton>
      </div>
    </div>
    
    <div v-else class="text-center py-10">
      <p>No order data found.</p>
        <UButton to="/pos" variant="outline" class="text-blue-800">Return to POS</UButton>
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

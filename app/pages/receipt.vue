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
  console.log('receipt data:', order.value)
  if (order.value) {
    setTimeout(() => {
      window.print()
    }, 500)
  }
})

const print = () => {
  window.print()
}
</script>

<template>
  <div class="max-w-75 mx-auto p-4 text-black font-mono text-sm bg-white min-h-screen">
    <div v-if="order">
      <div class="text-center mb-4">
        <div class="flex justify-center gap-2 print:hidden">
          <UButton variant="outline" color="success" icon="i-heroicons-printer" @click="print">
            Print
          </UButton>
          <UButton to="/pos" variant="outline" icon="i-heroicons-arrow-left" color="info">
            Back
          </UButton>
        </div>
        <NuxtImg
          src="https://cdn.my-pos-sys.store/Logo.png"
          width="150px"
          class="mx-auto mb-2 object-contain"
        />

        <h1 class="font-bold text-lg uppercase text-black">Coffee Receipt</h1>
        <p class="text-black">{{ new Date(order.date).toLocaleString() }}</p>
      </div>

      <div>
        <!-- <p class="text-black">Order No: {{ order.orderNo }}</p> -->
        <p class="text-black">Customer: {{ order.customerName }}</p>
        <p class="text-black">Payment Method: {{ order.paymentMethod }}</p>
        <p class="text-black">Sale By: {{ order.username }}</p>
      </div>

      <div class="py-2 space-y-1">
        <div class="flex justify-between font-bold text-lg pb-1">
          <span class="text-black">Name</span>
          <span class="text-black">Quantity</span>
          <span class="text-black">Price</span>
        </div>

        <div v-for="item in order.items" :key="item.name" class="flex justify-between border-t border-dashed py-2 border-gray-400">
          <span class="text-black">{{ item.name }} {{ item.quantity }} </span>
          <span class="text-black">{{ (item.price * item.quantity) }}៛</span>
        </div>
      </div>

      <div class=" pt-2 mt-2 space-y-1">
        <!-- <div class="flex justify-between font-bold text-lg">
          <span class="text-black">Tax(10%)</span>
          <span class="text-black">{{ KHR(order.taxKHR) }} <span class="text-black text-xs">({{ USD(order.taxUSD) }})</span></span>
        </div> -->
        <div class="flex justify-between font-bold text-md border-t border-gray-400 pt-2">
          <span class="text-black">TOTAL</span>
          <span class="text-black">{{ KHR(order.totalKHR) }} <span class="text-black text-xs">({{ USD(order.totalUSD) }})</span></span>
        </div>
      </div>

      <div class="text-center mt-8">
        <p class="text-black">Thank you for your visit!</p>
      </div>
    </div>
    
    <div v-else class="text-center py-10">
      <p>No order data found.</p>
        <UButton to="/pos" variant="outline" icon="i-heroicons-arrow-left" color="info">
          Back
        </UButton>
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
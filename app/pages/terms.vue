<script setup lang="ts">
definePageMeta({ layout: "blank" })
</script>

<template>
  <UContainer class="py-12 max-w-3xl">
    <UButton to="/signin" variant="ghost" icon="i-heroicons-arrow-left" class="mb-8">Back to Login</UButton>
    
    <h1 class="text-3xl font-bold mb-6">Terms of Service</h1>
    <p class="text-gray-500 mb-8 italic">Last Updated: February 9, 2026</p>

    <section class="space-y-6 text-gray-700 dark:text-gray-300">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
        <p>By accessing this application, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. User Accounts</h2>
        <p>You are responsible for maintaining the security of your account and password. The service cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. Prohibited Use</h2>
        <p>You may not use the service for any illegal or unauthorized purpose. You must not, in the use of the service, violate any laws in your jurisdiction.</p>
      </div>
    </section>
  </UContainer>
</template>

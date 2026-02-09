<script setup lang="ts">
definePageMeta(
  {
    layout: "blank" 
  }
)
</script>

<template>
  <UContainer class="py-12 max-w-3xl">
    <UButton to="/signin" variant="ghost" icon="i-heroicons-arrow-left" class="mb-8">Back to Login</UButton>

    <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>
    <p class="text-gray-500 mb-8 italic">Effective Date: February 9, 2026</p>

    <section class="space-y-6 text-gray-700 dark:text-gray-300">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Data Collection</h2>
        <p>We collect your username and encrypted password for authentication. We do not sell your personal data to third parties.</p>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security Measures</h2>
        <p>We use industry-standard [JWT (JSON Web Tokens)](https://jwt.io) and encryption to protect your session data and credentials.</p>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Rights</h2>
        <p>Under [GDPR and CCPA guidelines](https://gdpr.eu), you have the right to request the deletion of your account and all associated data at any time.</p>
      </div>
    </section>
  </UContainer>
</template>

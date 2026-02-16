<script setup lang="ts">
const expiredModalOpen = useState<boolean>('auth:expiredModalOpen', () => false)
const expiredReason = useState<string>('auth:expiredReason', () => 'Your session has expired. Please login again.')

const token = useCookie<string | null>('token', {
  default: () => null,
  sameSite: 'lax'
})

const goLogin = async () => {
  token.value = null
  expiredModalOpen.value = false
  await navigateTo('/signin', { replace: true })
}
</script>

<template>
  <UModal v-model:open="expiredModalOpen" :prevent-close="true">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="font-semibold">Session expired</div>
      </div>
    </template>

    <template #body>
      <div class="text-sm text-muted">
        {{ expiredReason }}
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton color="primary" @click="goLogin">Login</UButton>
      </div>
    </template>
  </UModal>
</template>

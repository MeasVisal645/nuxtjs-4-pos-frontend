<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  title?: string
  message?: string
}>()
</script>

<template>
  <UModal v-model:open="open">
    <UCard>
      <template #header>
        <div class="font-semibold">{{ props.title ?? 'Access denied' }}</div>
      </template>

      <div class="text-sm text-muted">
        {{ props.message ?? 'You do not have permission to access this page.' }}
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="open = false">
            OK
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

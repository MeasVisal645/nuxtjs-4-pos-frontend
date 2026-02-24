<script setup lang="ts">
type ButtonColor =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'

const props = defineProps<{
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  color?: ButtonColor
}>()

const emit = defineEmits<{
  (e: 'close', value: boolean): void
}>()

function confirm() {
  emit('close', true)
}

function cancel() {
  emit('close', false)
}
</script>

<template>
  <UModal>
    <UCard>
      <template #header>
        <h3 class="font-semibold">{{ title }}</h3>
      </template>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ description }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            :label="cancelText ?? 'Cancel'"
            color="neutral"
            variant="ghost"
            @click="cancel"
          />
          <UButton
            :label="confirmText ?? 'Confirm'"
            :color="color ?? 'primary'"
            @click="confirm"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
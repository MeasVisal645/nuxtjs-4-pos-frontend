<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const schema = z.object({
  name: z.string().min(1, { message: 'Required' }),
  contact: z.string().min(1, { message: 'Required' }),
  phone: z.string().min(1, { message: 'Required' }),
  address: z.string().min(1, { message: 'Required' }),
})

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'contact', label: 'Contact', type: 'text' as const, required: true },
  { name: 'phone', label: 'Phone', type: 'text' as const, required: true },
  { name: 'address', label: 'Address', type: 'text' as const, required: true },
]
</script>

<template>
  <FormModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Supplier"
    buttonLabel="New Supplier"
    :schema="schema"
    :fields="fields"
    createUrl="/supplier/create"
    @submitted="emit('submitted')"
  />
</template>

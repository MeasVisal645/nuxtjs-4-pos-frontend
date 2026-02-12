<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const schema = z.object({
    name: z.string().min(1, { message: 'Required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().min(1, { message: 'Required' }),
    address: z.string().min(1, { message: 'Required' }),
})

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'text' as const, required: true },
  { name: 'phone', label: 'Phone', type: 'text' as const, required: true },
  { name: 'address', label: 'Address', type: 'text' as const, required: true },
]
</script>

<template>
  <FormModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Customer"
    buttonLabel="New Customer"
    :schema="schema"
    :fields="fields"
    createUrl="/customer/create"
    @submitted="emit('submitted')"
  />
</template>

<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const schema = z.object({
    name: z.string({ message: 'Required' }).min(1, { message: 'Name is required' }).optional(),
    email: z.email({ message: 'Invalid email address' }).optional().nullable(),
    phone: z.string().min(8, { message: 'Phone number is required' }).optional(),
    address: z.string().optional().nullable(),
})

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'text' as const, required: false },
  { name: 'phone', label: 'Phone', type: 'text' as const, required: true },
  { name: 'address', label: 'Address', type: 'text' as const, required: false },
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

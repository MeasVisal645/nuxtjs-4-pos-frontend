<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const schema = z.object({
  firstName: z.string({ message: 'Required' }).min(1, { message: 'First name is required' }),
  lastName: z.string({ message: 'Required' }).min(1, { message: 'Last name is required' }),
  email: z.email({ message: 'Invalid email' }),
  phone: z.string().min(6, { message: 'Required' }),
  natId: z.string().min(6, { message: 'Required' }),
  nssfId: z.string().min(6, { message: 'Required' }),
})

const fields = [
  { name: 'firstName', label: 'First name', type: 'text' as const, required: true },
  { name: 'lastName', label: 'Last name', type: 'text' as const, required: true },
  { name: 'phone', label: 'Phone', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'text' as const, required: true },
  { name: 'natId', label: 'National Id', type: 'text' as const, required: true },
  { name: 'nssfId', label: 'NSSF Id', type: 'text' as const, required: true },
  { 
    name: 'image', 
    label: 'Image', 
    type: 'file' as const, 
    placeholder: 'Select profile picture (Max 1MB)' 
  }
]
</script>

<template>
  <FormImageModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Employee"
    buttonLabel="New Employee"
    :schema="schema"
    :fields="fields"
    enctype="multipart/form-data"
    createUrl="/employee/create"
    @submitted="emit('submitted')"
  />
</template>

<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const employeeSchema = z.object({
  firstName: z.string().min(1, { message: 'Required' }),
  lastName: z.string().min(1, { message: 'Required' }),
  email: z.string().email({ message: 'Invalid email' }),
  phone: z.string().optional(),
  dob: z.string().optional()
})

const employeeFields = [
  { name: 'firstName', label: 'First name', type: 'text' as const, required: true },
  { name: 'lastName', label: 'Last name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'text' as const, required: true }
]
</script>

<template>
  <FormModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Employee"
    buttonLabel="New Employee"
    :schema="employeeSchema"
    :fields="employeeFields"
    createUrl="/employee/create"
    @submitted="emit('submitted')"
  />
</template>

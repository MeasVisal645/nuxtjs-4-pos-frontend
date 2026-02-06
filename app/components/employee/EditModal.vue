<script setup lang="ts">
import * as z from 'zod'

const props = defineProps<{
  open: boolean
  id: string | number | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submitted'): void
}>()

const schema = z.object({
  firstName: z.string().min(1, { message: 'Required' }),
  lastName: z.string().min(1, { message: 'Required' }),
  email: z.string().email({ message: 'Invalid email' }),
  phone: z.string().optional(),
  natId: z.string().optional(),
  nssfId: z.string().optional(),
  active: z.boolean({ message: 'Required' })

})

const fields = [
  { name: 'id', label: "Id", type: 'number' as const, require: true, hidden: true},
  { name: 'firstName', label: 'First name', type: 'text' as const, required: true },
  { name: 'lastName', label: 'Last name', type: 'text' as const, required: true },
  { name: 'phone', label: 'Phone', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'text' as const, required: true },
  { name: 'natId', label: 'National Id', type: 'text' as const, required: true },
  { name: 'nssfId', label: 'NSSF Id', type: 'text' as const, required: true },
  {
    name: 'active', label: 'Active', type: 'select' as const, require: true,
    items: [{ label: 'Active', value: true }, { label: 'Inactive', value: false }]
  }
]
</script>

<template>
  <FormModal
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    mode="update"
    :id="id"
    title="Edit Employee"
    description="Update employee information"
    buttonLabel=""
    :schema="schema"
    :fields="fields"
    findByIdUrl="/employee"   
    updateUrl="/employee"      
    @submitted="emit('submitted')"
  >
    <template #default>

      
    </template>
  </FormModal>
</template>

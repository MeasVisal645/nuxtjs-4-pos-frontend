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
    name: z.string().min(1, { message: 'Required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().min(1, { message: 'Required' }),
    address: z.string().min(1, { message: 'Required' }),
})

const fields = [
  { name: 'id', label: "Id", type: 'number' as const, require: true, hidden: true},
  { name: 'name', label: 'Customer Name', type: 'text' as const, required: true },
  { name: 'email', label: 'Customer Email', type: 'text' as const, required: true },
  { name: 'phone', label: 'Customer Phone', type: 'text' as const, required: true },
  { name: 'address', label: 'Customer Address', type: 'text' as const, required: true },
  {
    name: 'active', label: 'Active', type: 'select' as const, require: true,
    items: [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false }
    ]
  }
]
</script>

<template>
  <FormModal
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    mode="update"
    :id="id"
    title="Edit Customer"
    description="Update customer information"
    buttonLabel=""
    :schema="schema"
    :fields="fields"
    findByIdUrl="/customer"   
    updateUrl="/customer"      
    @submitted="emit('submitted')"
  >
    <template #default></template>
  </FormModal>
</template>

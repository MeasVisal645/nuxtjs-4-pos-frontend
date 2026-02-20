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
  username: z.string().min(1, { message: 'Required' }).optional(),
  password: z.string().min(1, { message: 'Required' }).optional(),
  role: z.string().min(1, { message: 'Required' }).optional(),
  active: z.boolean({ message: 'Required' }).optional()

})

const fields = [
  { name: 'id', label: "Id", type: 'number' as const, require: true, hidden: true},
  { name: 'username', label: 'Username', type: 'text' as const, required: true },
  { name: 'password', label: 'Password', type: 'text' as const, required: true },
  {
    name: 'role', label: 'Role', type: 'select' as const, required: true,
    items: [{ label: 'User', value: "ROLE_USER" }, { label: 'Admin', value: "ROLE_ADMIN" }]
  },
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
    title="Edit User"
    description="Update user information"
    buttonLabel=""
    :schema="schema"
    :fields="fields"
    findByIdUrl="/user"   
    updateUrl="/user"      
    @submitted="emit('submitted')"
  >
  </FormModal>
</template>

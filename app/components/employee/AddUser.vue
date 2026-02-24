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
  username: z.string().min(1, { message: 'Required' }),
  password: z.string().min(8, { message: 'Must be at least 8 characters long' })
})

const fields = [
  { name: 'username', label: 'Username', type: 'text' as const, required: true },
  { name: 'password', label: 'Password', type: 'text' as const, required: true }
]

const transform = (data: Record<string, any>) => ({
  ...data,
  employeeId: props.id == null ? undefined : Number(props.id)
})
</script>

<template>
  <FormModal
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    mode="create"
    title="Create User"
    description="create user login"
    buttonLabel="Create"
    :schema="schema"
    :fields="fields"
    createUrl="/auth/signup"
    :transform="transform"
    @submitted="emit('submitted')"
  />
</template>

<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ (e: 'submitted'): void }>()

const createModalOpen = ref(false)

const category = [
  { label: 'Water Bill', value: 'water bill' },
  { label: 'Electricity Bill', value: 'electricity bill' },
  { label: 'Rent', value: 'rent' },
  { label: 'Daily Expense', value: 'daily expense' },
  { label: 'Salary', value: 'salary' },
  { label: 'Miscellaneous', value: 'miscellaneous' }
]

const schema = z.object({
  reference: z.string().min(1, { message: 'Required' }).optional(),
  category: z.string().min(1, { message: 'Required' }).optional(),
  note: z.string().optional().nullable(),
  amount: z.coerce.number().optional(),
})

const fields = [
  { name: 'reference', label: 'Reference', type: 'text' as const, required: true,},
  { name: 'category', label: 'Category', type: 'select' as const, required: true, items: category},
  { name: 'note', label: 'Note', type: 'text' as const, required: false },
  { name: 'amount', label: 'Amount', type: 'number' as const, required: true },
]
</script>

<template>
  <FormModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Expense"
    buttonLabel="New Expense"
    :schema="schema"
    :fields="fields"
    createUrl="/expense/create"
    @submitted="emit('submitted')"
  />
</template>

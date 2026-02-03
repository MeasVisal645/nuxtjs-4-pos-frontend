<script setup lang="ts">
import * as z from 'zod'

type Option = { label: string; value: string | number }
type Category = { id: number; name: string }
type Brand = { id: number; name: string }

const categoryItems = ref<Option[]>([])
const brandItems = ref<Option[]>([])

const props = defineProps<{
  open: boolean
  id: string | number | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submitted'): void
}>()

const schema = z.object({
  code: z.string().min(1, { message: 'Required' }),
  name: z.string().min(1, { message: 'Required' }),
  cost: z.coerce.number(),
  price: z.coerce.number(),
  quantity: z.coerce.number(),
  unit: z.enum(['PCS', 'SET', 'CASE', 'KG', 'BOTTLE', 'BOX']),
  categoryId: z.coerce.number(), 
  brandId: z.coerce.number().optional(),
  active:z.boolean()
})

async function loadSelects() {
  const [cats, brands] = await Promise.all([
    useApi<Category[]>('/category/all'),
    useApi<Brand[]>('/brand/all')
  ])

  categoryItems.value = (cats ?? []).map(c => ({ label: c.name, value: c.id }))
  brandItems.value = (brands ?? []).map(b => ({ label: b.name, value: b.id }))
}

onMounted(() => {
  loadSelects().catch(console.error)
})

const fields = computed(() => [
  { name: 'id', label: 'Id', type: 'text' as const, required: true, hidden: true },
  { name: 'code', label: 'Product Code', type: 'text' as const, required: true },
  { name: 'name', label: 'Product Name', type: 'text' as const, required: true },
  { name: 'cost', label: 'Cost', type: 'number' as const, required: true },
  { name: 'price', label: 'Price', type: 'number' as const, required: true },
  { name: 'quantity', label: 'Quantity', type: 'number' as const, required: true },
  { name: 'unit', label: 'Unit', type: 'select' as const, required: true , items: unit},
  { name: 'categoryId', label: 'Category', type: 'select' as const, required: true, items: categoryItems.value },
  { name: 'brandId', label: 'Brand', type: 'select' as const, required: false, items: brandItems.value },
  {
    name: 'active', label: 'Active', type: 'select' as const, require: true,
    items: [{ label: 'Active', value: true }, { label: 'Inactive', value: false }]
  }
])

const unit = [
  { label: 'PCS', value: 'PCS' },
  { label: 'SET', value: 'SET' },
  { label: 'CASE', value: 'CASE' },
  { label: 'KG', value: 'KG' },
  { label: 'BOTTLE', value: 'BOTTLE' },
  { label: 'BOX', value: 'BOX' }
]
</script>

<template>
  <FormModal
    :open="open"
    @update:open="(v) => emit('update:open', v)"
    mode="update"
    :id="id"
    title="Edit Product"
    description="Update product information"
    buttonLabel=""
    :schema="schema"
    :fields="fields"
    findByIdUrl="/product"   
    updateUrl="/product"      
    @submitted="emit('submitted')"
  >
    <template #default></template>
  </FormModal>
</template>

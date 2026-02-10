<script setup lang="ts">
import * as z from 'zod'

type Option = { label: string; value: string | number }
type Category = { id: number; name: string }
type Brand = { id: number; name: string }

const emit = defineEmits<{ (e: 'submitted'): void }>()
const createModalOpen = ref(false)

const schema = z.object({
  code: z.string().min(1, { message: 'Required' }),
  name: z.string().min(1, { message: 'Required' }),
  cost: z.coerce.number(),
  price: z.coerce.number(),
  quantity: z.coerce.number(),
  unit: z.enum(['PCS', 'SET', 'CASE', 'KG', 'BOTTLE', 'BOX']),
  categoryId: z.coerce.number(), 
  brandId: z.coerce.number().optional()
})

const categoryItems = ref<Option[]>([])
const brandItems = ref<Option[]>([])

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

function generateCode(length = 10): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

async function isCodeExists(code: string): Promise<boolean> {
  return await useApi<boolean>(`/product/check-code/${code}`)
}

async function generateUniqueCode(): Promise<string> {
  let code = generateCode()

  for (let i = 0; i < 10; i++) {
    const exists = await isCodeExists(code)

    if (!exists) return code

    code = generateCode()
  }

  throw new Error('Unable to generate unique product code')
}


const fields = computed(() => [
  {
    name: 'code',
    label: 'Product Code',
    type: 'text' as const,
    required: true,
    trailingIcon: 'i-lucide-refresh-ccw',
    onTrailingClick: async ({ state }: { state: Record<string, any> }) => {
      state.code = await generateUniqueCode()
    }
  },
  { name: 'name', label: 'Product Name', type: 'text' as const, required: true },
  { name: 'cost', label: 'Cost', type: 'number' as const, required: true },
  { name: 'price', label: 'Price', type: 'number' as const, required: true },
  { name: 'quantity', label: 'Quantity', type: 'number' as const, required: true },
  { name: 'unit', label: 'Unit', type: 'select' as const, required: true , items: unit},
  { name: 'categoryId', label: 'Category', type: 'select' as const, required: true, items: categoryItems.value },
  { name: 'brandId', label: 'Brand', type: 'select' as const, required: false, items: brandItems.value },
  { 
    name: 'image', 
    label: 'Image', 
    type: 'file' as const, 
    placeholder: 'Select product image (Max 1MB)' 
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
  <FormImageModal
    v-model:open="createModalOpen"
    mode="create"
    title="New Product"
    buttonLabel="New Product"
    :schema="schema"
    :fields="fields"
    enctype="multipart/form-data"
    createUrl="/product/create"
    @submitted="emit('submitted')"
  />
</template>

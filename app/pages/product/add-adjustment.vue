<script setup lang="ts">
type Product = {
  id: number
  code: string
  name: string
  price: number
  quantity: number
}

type Method = 'ADD' | 'SUBTRACT'

type AdjustmentItem = {
  id: number
  code: string
  name: string
  price: number
  method: Method
  qty: number
}

const toast = useToast()

// ---------- Load products once (for dropdown search) ----------
const products = ref<Product[]>([])
const loadingProducts = ref(false)

async function loadProducts() {
  try {
    loadingProducts.value = true
    // ✅ change if your endpoint differs
    const res = await useApi<Product[]>('/product/all', { method: 'GET' })
    products.value = res ?? []
  } catch (e: any) {
    toast.add({
      title: 'Failed to load products',
      description: e?.data?.message || e?.message || 'Unknown error',
      color: 'error'
    })
    products.value = []
  } finally {
    loadingProducts.value = false
  }
}

onMounted(() => loadProducts())

// ---------- Search dropdown ----------
const codeQuery = ref('')
const showDropdown = ref(false)

function scoreMatch(code: string, q: string) {
  // higher = better
  if (code === q) return 1000
  if (code.startsWith(q)) return 800
  if (code.includes(q)) return 400
  return 0
}

const suggestions = computed(() => {
  const q = codeQuery.value.trim().toLowerCase()
  if (!q) return []

  return products.value
    .map(p => ({
      p,
      score: scoreMatch(String(p.code).toLowerCase(), q)
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score) // best match first
    .slice(0, 5) // only 5 most match
    .map(x => x.p)
})

function openDropdown() {
  showDropdown.value = true
}

function closeDropdown() {
  showDropdown.value = false
}

// ---------- Table items ----------
const items = ref<AdjustmentItem[]>([])
const submitting = ref(false)

function addProduct(p: Product) {
  const exists = items.value.some(i => i.code === p.code)
  if (exists) {
    toast.add({ title: 'Already added', description: `${p.code} already exists`, color: 'warning' })
    codeQuery.value = ''
    closeDropdown()
    return
  }

  items.value.push({
    id: p.id,
    code: p.code,
    name: p.name,
    price: p.price,
    method: 'ADD',
    qty: 1
  })

  codeQuery.value = ''
  closeDropdown()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function searchByCode() {
  const q = codeQuery.value.trim()
  if (!q) return

  const list = suggestions.value

  if (list.length === 1) {
    const product = list[0]
    if (!product) return
    addProduct(product)
    return
  }

  if (list.length === 0) {
    toast.add({ title: 'Not found', description: 'Product not found', color: 'warning' })
    return
  }

  toast.add({ title: 'Multiple matches', description: 'Please select a product', color: 'info' })
}



// ---------- Validation ----------
function rowError(it: AdjustmentItem): string | null {
  const qty = Number(it.qty)

  if (!Number.isFinite(qty)) {
    return 'Quantity is invalid'
  }

  if (it.method === 'ADD') {
    if (qty <= 0) return 'Qty must be > 0'
  }

  if (it.method === 'SUBTRACT') {
    if (qty < 0) return 'Qty must be ≥ 0'
  }

  return null
}


const canSubmit = computed(() => {
  if (items.value.length === 0) return false
  return items.value.every(i => rowError(i) === null)
})

async function submitAdjustments() {
  if (!canSubmit.value) {
    toast.add({ title: 'Invalid', description: 'Fix quantity errors first.', color: 'warning' })
    return
  }

  try {
    submitting.value = true

    await Promise.all(
      items.value.map(item => {
        return useApi(`/product/add-quantity/${encodeURIComponent(item.id)}`, {
          method: 'PUT',
          body: { method: item.method, addQuantity: Number(item.qty) }
        })
      })
    )

    toast.add({ title: 'Success', description: 'Quantity adjusted successfully' })
    items.value = []
    codeQuery.value = ''
  } catch (e: any) {
    toast.add({
      title: 'Failed',
      description: e?.data?.message || e?.message || 'Error submitting adjustments',
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="add-adjustment">
    <template #header>
      <UDashboardNavbar title="Add Adjustment">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right />
      </UDashboardNavbar>
    </template>
      
    <template #body>
      <div class="relative justify-between">
        <div class="flex flex-row gap-2 w-full">
          <UInput
            v-model="codeQuery"
            icon="i-lucide-search"
            placeholder="Search product code"
            @focus="openDropdown"
            :loading="loadingProducts"
            :disabled="loadingProducts"
            @keydown.enter.prevent="searchByCode"
          />
          <UButton label="Search" :disabled="loadingProducts" @click="searchByCode" />
        </div>
        

        <!-- Suggestions now take space -->
        <div
          v-if="showDropdown && suggestions.length && codeQuery"
          class="rounded-md bg-white dark:bg-gray-900 shadow-sm max-h-64 overflow-y-auto"
        >
          <button
            v-for="p in suggestions"
            :key="p.code"
            class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="addProduct(p)"
          >
            <div class="text-sm font-medium text-black dark:text-white">
              {{ p.name }} <span class="font-semibold">{{ p.code }}</span>
            </div>
          </button>
        </div>
      </div>


      <!-- <div class="relative flex gap-2 overflow-visible">
        <UInput
          v-model="codeQuery"
          class="w-72"
          icon="i-lucide-search"
          placeholder="Search product code"
          :loading="loadingProducts"
          :disabled="loadingProducts"
          @focus="openDropdown"
          @keydown.enter.prevent="searchByCode"
        />
        <UButton label="Search" :disabled="loadingProducts" @click="searchByCode" />

        <div
          v-if="showDropdown && suggestions.length && codeQuery"
          class="absolute left-0 top-full mt-2 w-72 rounded-md border border-default bg-white dark:bg-gray-900 shadow-md max-h-64 overflow-y-auto z-9999"
        >
          <button
            v-for="p in suggestions"
            :key="p.code"
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            @mousedown.prevent="addProduct(p)"
          >
            <div class="text-sm font-medium text-black dark:text-white">
              {{ p.name }} <span class="font-semibold">{{ p.code }}</span>
            </div>
          </button>
        </div>
      </div> -->
      <!-- Body Content -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <div class="font-semibold">Adjustment Items</div>
              <div class="text-sm text-muted">
                Please fill in the information below. The field labels marked with * are required input fields.
              </div>
            </div>
            <UButton
              label="Submit"
              icon="i-lucide-send"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="submitAdjustments"
            />
          </div>
        </template>

        <div v-if="items.length === 0" class="text-center py-10 text-muted">
          No products added
        </div>

        <table v-else class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Name</th>
              <th class="text-left">Code</th>
              <th class="text-left w-40">Price</th>
              <th class="text-left w-40">Method</th>
              <th class="text-left w-40">Quantity</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(item, i) in items"
              :key="item.code"
              class="border-b"
            >
              <td class="py-2">{{ item.name }}</td>
              <td class="font-medium">{{ item.code }}</td>
              <td class="">{{ item.price }}</td>

              <td>
                <USelect
                  v-model="item.method"
                  :items="[
                    { label: 'Add', value: 'ADD' },
                    { label: 'Subtract', value: 'SUBTRACT' }
                  ]"
                  class="w-32"
                />
              </td>

              <td>
                <UInput
                  type="number"
                  v-model.number="item.qty"
                  min="1"
                  placeholder="Qty"
                />
                <div v-if="rowError(item)" class="text-xs text-red-600 mt-1">
                  {{ rowError(item) }}
                </div>
              </td>

              <td class="text-right">
                <UButton
                  icon="i-lucide-trash"
                  color="error"
                  variant="ghost"
                  @click="removeItem(i)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

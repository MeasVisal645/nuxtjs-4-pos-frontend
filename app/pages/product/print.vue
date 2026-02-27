<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import JsBarcode from 'jsbarcode'
import * as QRCode from 'qrcode'

type Product = {
  id: number
  code: string
  name: string
  price: number
  quantity: number
}

type PrintableItem = Product & {
  copies: number
}

type PrintType = 'BARCODE' | 'QRCODE'

const toast = useToast()

// Print Setting

const printType = ref<PrintType>('BARCODE')

const printSettings = reactive({
  pageSize: 'CUSTOM' as 'A4' | '58MM' | '80MM' | 'CUSTOM',
  customWidth: 25,    // mm
  customHeight: 15,   // mm
  barcodeWidth: 1.5,
  barcodeHeight: 20,
  showName: true,
  showPrice: true,
  showCode: false,
  fontSize: 14,
})

// Load Product

const products = ref<Product[]>([])
const loadingProducts = ref(false)

async function loadProducts() {
  try {
    loadingProducts.value = true
    const res = await useApi<Product[]>('/product/all', { method: 'GET' })
    products.value = res ?? []
  } catch (e: any) {
    toast.add({
      title: 'Failed to load products',
      description: e?.data?.message || e?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    loadingProducts.value = false
  }
}

onMounted(loadProducts)

// Search
const searchQuery = ref('')
const showDropdown = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openDropdown() {
  if (closeTimer) clearTimeout(closeTimer)
  showDropdown.value = true
}

function scheduleCloseDropdown() {
  closeTimer = setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return products.value
  return products.value.filter(
    p => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
  )
})

const suggestions = computed(() => filteredProducts.value.slice(0, 5))

// Item
const items = ref<PrintableItem[]>([])

const selectedProduct = ref<PrintableItem | null>(null)

function addProduct(p: Product) {
  const exists = items.value.some(i => i.code === p.code)
  if (exists) {
    toast.add({
      title: 'Already added',
      description: `${p.code} is already in the list`,
      color: 'warning',
    })
    searchQuery.value = ''
    showDropdown.value = false
    return
  }

  const item: PrintableItem = { ...p, copies: 1 }
  items.value.push(item)
  selectProduct(item)

  searchQuery.value = ''
  showDropdown.value = false
}

function removeProduct(code: string) {
  items.value = items.value.filter(i => i.code !== code)
  if (selectedProduct.value?.code === code) {
    selectedProduct.value = items.value[0] ?? null
  }
}

function selectProduct(item: PrintableItem) {
  selectedProduct.value = item
  regenerate()
}

function searchByCode() {
  const list = suggestions.value
  if (list.length === 1) {
    addProduct(list[0]!)
  } else if (list.length === 0) {
    toast.add({ title: 'Not found', description: 'No product matches that query', color: 'warning' })
  } else {
    toast.add({ title: 'Multiple matches', description: 'Please select a product from the list', color: 'info' })
  }
}

// Barcode and QR
const barcodeRef = ref<SVGSVGElement | null>(null)
const qrRef = ref<HTMLCanvasElement | null>(null)

function generateBarcode() {
  if (!barcodeRef.value || !selectedProduct.value) return
  JsBarcode(barcodeRef.value, selectedProduct.value.code, {
    format: 'CODE128',
    width: printSettings.barcodeWidth,
    height: printSettings.barcodeHeight,
    displayValue: printSettings.showCode,
    background:'transparent'
  })
}

async function generateQRCode() {
  if (!qrRef.value || !selectedProduct.value) return
  await QRCode.toCanvas(qrRef.value, selectedProduct.value.code, {
    width: printSettings.barcodeHeight * 3,
    color: {
      dark: '#000000',
      light: '#00000000', 
    },
  })
}

function regenerate() {
  nextTick(() => {
    if (!selectedProduct.value) return
    if (printType.value === 'BARCODE') {
      generateBarcode()
    } else {
      generateQRCode()
    }
  })
}

watch(
  () => [
    printType.value,
    printSettings.barcodeWidth,
    printSettings.barcodeHeight,
    printSettings.showCode,
    printSettings.fontSize,
    selectedProduct.value?.code,
  ],
  regenerate
)

// Print
function printCode() {
  window.print()
}

// Label Style
const labelStyle = computed(() => ({
  width: `${printSettings.customWidth}mm`,
  minHeight: `${printSettings.customHeight}mm`,
}))
</script>

<template>
  <UDashboardPanel id="print-barcode">
    <template #header>
      <UDashboardNavbar title="Print Barcode & QR Code">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6">

        <!-- Search -->
        <div class="relative">
          <div class="flex gap-2">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search..."
              :loading="loadingProducts"
              @focus="openDropdown"
              @blur="scheduleCloseDropdown"
              @keydown.enter.prevent="searchByCode"
            />
            <UButton label="Search" @click="searchByCode" />
          </div>

          <!-- Dropdown -->
          <div
            v-if="showDropdown && suggestions.length && searchQuery"
            class="absolute z-50 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-64 overflow-y-auto"
          >
            <button
              v-for="p in suggestions"
              :key="p.code"
              class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @mousedown.prevent="addProduct(p)"
            >
              <span class="text-sm font-medium">{{ p.name }}</span>
              <span class="ml-2 text-xs text-gray-500">{{ p.code }}</span>
            </button>
          </div>
        </div>

        <!-- Items -->
        <UCard v-if="items.length">
          <template #header>
            <span class="font-semibold">Added Products</span>
          </template>

          <div class="divide-y dark:divide-gray-700">
            <div
              v-for="item in items"
              :key="item.code"
              class="flex items-center justify-between py-2 gap-4 cursor-pointer"
              :class="selectedProduct?.code === item.code
                ? 'bg-primary-50 dark:bg-primary-900/20 rounded-md px-2'
                : 'px-2'"
              @click="selectProduct(item)"
            >
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ item.name }}</div>
                <div class="text-xs text-gray-500">{{ item.code }}</div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-gray-500">Copies:</span>
                <UInput
                  type="number"
                  v-model.number="item.copies"
                  class="w-16"
                  :min="1"
                  @click.stop
                />
              </div>

              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click.stop="removeProduct(item.code)"
              />
            </div>
          </div>
        </UCard>

        <!-- Print Settings -->
        <UCard>
          <template #header>
            <span class="font-semibold">Print Settings</span>
          </template>

          <div class="grid grid-cols-2 gap-4">
            <!-- Type -->
            <div class="flex flex-col gap-1">
              <span class="text-sm">Type</span>
              <USelect
                v-model="printType"
                :items="[
                  { label: 'Barcode', value: 'BARCODE' },
                  { label: 'QR Code', value: 'QRCODE' },
                ]"
              />
            </div>

            <!-- Paper type -->
            <div class="flex flex-col gap-1">
              <span class="text-sm">Paper Type</span>
              <USelect
                v-model="printSettings.pageSize"
                :items="[
                  { label: 'A4', value: 'A4' },
                  { label: '58 mm Receipt', value: '58MM' },
                  { label: '80 mm Receipt', value: '80MM' },
                  { label: 'Custom Label', value: 'CUSTOM' },
                ]"
              />
            </div>

            <!-- Paper size (custom only) -->
            <div v-if="printSettings.pageSize === 'CUSTOM'">
              <span class="text-sm">Label Size (mm)</span>
              <div class="grid grid-cols-2 gap-2 mt-1">
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">Width</span>
                  <UInput type="number" v-model.number="printSettings.customWidth" :min="10" />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">Height</span>
                  <UInput type="number" v-model.number="printSettings.customHeight" :min="5" />
                </div>
              </div>
            </div>

            <!-- Barcode size -->
            <div>
              <span class="text-sm">{{ printType === 'BARCODE' ? 'Barcode' : 'QR Code' }} Size</span>
              <div class="grid grid-cols-2 gap-2 mt-1">
                <div v-if="printType === 'BARCODE'" class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">Bar Width</span>
                  <UInput type="number" v-model.number="printSettings.barcodeWidth" :min="0.5" :step="0.5" />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">Height (px)</span>
                  <UInput type="number" v-model.number="printSettings.barcodeHeight" :min="10" />
                </div>
              </div>
            </div>

            <!-- Font size -->
            <div class="flex flex-col gap-1">
              <span class="text-sm">Font Size (px)</span>
              <UInput type="number" v-model.number="printSettings.fontSize" :min="8" :max="48" />
            </div>

            <!-- Visibility -->
            <div class="col-span-2 flex flex-col gap-2">
              <span class="text-sm">Show on Label</span>
              <div class="flex flex-row gap-6">
                <UCheckbox v-model="printSettings.showName" label="Product Name" />
                <UCheckbox v-model="printSettings.showPrice" label="Price" />
                <UCheckbox v-model="printSettings.showCode" label="Code Text" />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Print Preview -->
        <UCard v-if="selectedProduct">
          <template #header>
            <div class="flex justify-between items-center no-print">
              <div>
                <div class="font-bold">Name: {{ selectedProduct.name }}</div>
                <div class="font-bold">Code: {{ selectedProduct.code }}</div>
              </div>
              <UButton label="Print" icon="i-lucide-printer" @click="printCode" />
            </div>
          </template>

          <!-- Label preview -->
          <div class="flex items-center justify-center py-4">
            <div
              class="print-label border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 p-2 bg-white text-black"
              :style="labelStyle"
            >
              <div
                v-if="printSettings.showName"
                class="font-semibold text-center leading-tight"
                :style="{ fontSize: printSettings.fontSize + 'px' }"
              >
                {{ selectedProduct.name }}
              </div>

              <div
                v-if="printSettings.showPrice"
                class="font-semibold text-center"
                :style="{ fontSize: printSettings.fontSize + 'px' }"
              >
                Price: {{ selectedProduct.price.toLocaleString() }}
              </div>

              <!-- Barcode or QR -->
              <svg v-if="printType === 'BARCODE'" ref="barcodeRef" />
              <canvas v-else ref="qrRef" />
            </div>
          </div>
        </UCard>

        <div v-else class="text-center text-gray-400 py-8">
          Search and select a product to preview the label.
        </div>

      </div>
    </template>
  </UDashboardPanel>
</template>

<style>
/* ── Print Styles ─────────────────────────────── */
@media print {
  @page { margin: 0; }

  body * { visibility: hidden; }

  .print-label,
  .print-label * { visibility: visible !important; }

  .no-print { display: none !important; }

  .print-label {
    position: fixed;
    inset: 0;
    margin: auto;
    border: none !important;
  }
}
</style>
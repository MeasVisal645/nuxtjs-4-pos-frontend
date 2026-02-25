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

type PrintType = 'BARCODE' | 'QRCODE'

const toast = useToast()

// ---------------- PRINT SETTINGS ----------------
const printType = ref<PrintType>('BARCODE')

const printSettings = reactive({
  pageSize: 'CUSTOM',
  customWidth: 25,      // mm
  customHeight: 15,     // mm
  barcodeWidth: 1.5,
  barcodeHeight: 20,
  showName: true,
  showPrice: true,
  showCode: false,
  fontSize: 14,     
})

// ---------------- LOAD PRODUCTS ----------------
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
      color: 'error'
    })
  } finally {
    loadingProducts.value = false
  }
}

onMounted(loadProducts)

// ---------------- SEARCH ----------------
const codeQuery = ref('')
const showDropdown = ref(false)
const selectedProduct = ref<Product | null>(null)

function scoreMatch(code: string, q: string) {
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
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.p)
})

function addProduct(p: Product) {
  selectedProduct.value = p
  codeQuery.value = ''
  showDropdown.value = false

  nextTick(() => regenerate())
}

function searchByCode() {
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

// ---------------- BARCODE & QR ----------------
const barcodeRef = ref<SVGSVGElement | null>(null)
const qrRef = ref<HTMLCanvasElement | null>(null)

function generateBarcode() {
  if (!barcodeRef.value || !selectedProduct.value) return

  JsBarcode(barcodeRef.value, selectedProduct.value.code, {
    format: 'CODE128',
    width: printSettings.barcodeWidth,
    height: printSettings.barcodeHeight,
    displayValue: printSettings.showCode,
  })
}

async function generateQRCode() {
  if (!qrRef.value || !selectedProduct.value) return

  await QRCode.toCanvas(qrRef.value, selectedProduct.value.code, {
    width: printSettings.barcodeHeight
  })
}

function regenerate() {
  if (!selectedProduct.value) return

  nextTick(() => {
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
  ],
  regenerate
)

function printCode() {
  window.print()
}
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
      <!-- SEARCH -->
      <div class="relative">
        <div class="flex gap-2">
          <UInput
            v-model="codeQuery"
            icon="i-lucide-search"
            placeholder="Search product code"
            :loading="loadingProducts"
            @focus="showDropdown = true"
            @keydown.enter.prevent="searchByCode"
          />
          <UButton label="Search" @click="searchByCode" />
        </div>

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
            <div class="text-sm font-medium">
              {{ p.name }} <span class="font-semibold">{{ p.code }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- SETTINGS -->
      <UCard>
        <template #header>
          <div class="font-semibold">Print Settings</div>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <span>Type: </span>
            <USelect
              v-model="printType"
              :items="[
                { label: 'Barcode', value: 'BARCODE' },
                { label: 'QR Code', value: 'QRCODE' }
              ]"
            />
          </div>

          <div class="flex flex-col gap-2">
            <span>Paper Type: </span>
            <USelect
              v-model="printSettings.pageSize"
              :items="[
                { label: 'A4', value: 'A4' },
                { label: '58mm Receipt', value: '58MM' },
                { label: '80mm Receipt', value: '80MM' },
                { label: 'Custom Label', value: 'CUSTOM' }
              ]"
            />
          </div>

          <div>
            <span>Paper Size: </span>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex w-full flex-col">
                <span class="text-xs">width</span>
                <UInput
                  type="number"
                  v-model.number="printSettings.customWidth"
                  placeholder="Label Width (mm)"
                />
                
              </div>
              <div class="flex w-full flex-col">
                <span class="text-xs">Height</span>
                <UInput
                  type="number"
                  v-model.number="printSettings.customHeight"
                  placeholder="Label Height (mm)"
                />
              </div>
            </div>
          </div>

          <div>
            <span>Barcode Size: </span>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex w-full flex-col">
                <span class="text-xs">width</span>
                <UInput
                  type="number"
                  v-model.number="printSettings.barcodeWidth"
                  placeholder="Barcode Width"
                />
              </div>
              <div class="flex w-full flex-col">
                <span class="text-xs">Height</span>
                <UInput
                  type="number"
                  v-model.number="printSettings.barcodeHeight"
                  placeholder="Barcode Height"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span>Font Size:</span>
            <UInput type="number" v-model.number="printSettings.fontSize" />
          </div>

          <div class="flex flex-col col-span-2 w-full gap-4">
            <span>Visibility:</span>
            <div class="flex flex-row gap-4">
              <UCheckbox v-model="printSettings.showName" label="Product Name" />
              <UCheckbox v-model="printSettings.showPrice" label="Price" />
              <UCheckbox v-model="printSettings.showCode" label="Code" />
            </div>
          </div>
          
        </div>
      </UCard>

      <!-- PRINT AREA -->
      <UCard
        v-if="selectedProduct"
        :class="['print-area', `print-${printSettings.pageSize}`]"
      >
        <template #header>
          <div class="flex justify-between items-center no-print">
            <div>
              <div class="font-bold">Name: {{ selectedProduct.name }}</div>
              <div class="text-bold">Code: {{ selectedProduct.code }}</div>
            </div>
            <UButton
              label="Print"
              icon="i-lucide-printer"
              @click="printCode"
            />
          </div>
        </template>

        <div class="items-center justify-center flex">
          <div class="text-center items-center justify-center flex flex-col bg-white text-black">
            <div
              v-if="printSettings.showName"
              class="font-semibold"
              :style="{ fontSize: printSettings.fontSize + 'px' }"
            >
              {{ selectedProduct.name }}
            </div>

            <div
              v-if="printSettings.showPrice"
              class="font-semibold -mb-1"
              :style="{ fontSize: printSettings.fontSize + 'px' }"
            >
              Price: {{ selectedProduct.price }}
            </div>

            <div>
              <svg v-if="printType === 'BARCODE'" ref="barcodeRef"></svg>
              <canvas v-else ref="qrRef"></canvas>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

<style>
@media print {
  @page { margin: 0; }

  body * { visibility: hidden; }

  .print-area,
  .print-area * { visibility: visible; }

  .no-print { display: none !important; }

  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    text-align: center;
  }

  .print-58MM { width: 58mm; }
  .print-80MM { width: 80mm; }
}
</style>
<script setup lang="ts">
import type { ZodType } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

type FieldType = 'text' | 'number' | 'select' | 'date' | 'file'

type FieldConfig = {
  name: string
  label: string
  placeholder?: string
  type: FieldType
  items?: { label: string; value: any }[]
  required?: boolean
  disabled?: boolean
  hidden?: boolean
}

const props = defineProps<{
  open: boolean
  title: string
  description?: string
  buttonLabel: string
  buttonIcon?: string
  schema: ZodType<any>
  fields: FieldConfig[]
  mode: 'create' | 'update'
  id?: string | number | null
  createUrl?: string
  updateUrl?: string
  findByIdUrl?: string
  mapFromApi?: (apiData: any) => Record<string, any>
  transform?: (data: Record<string, any>) => Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'submitted'): void
  (e: 'update:open', v: boolean): void
}>()

const toast = useToast()
const isLoading = ref(false)

// ---- file state ----
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// ---- modal model ----
const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

// ---- date helpers ----
const df = new DateFormatter('en-US', { dateStyle: 'medium' })

const state = reactive<Record<string, any>>({})
const dateModels = reactive<Record<string, any>>({})
const dateStrings = reactive<Record<string, string>>({})

function ensureDate(name: string) {
  if (!dateModels[name]) dateModels[name] = shallowRef(new CalendarDate(2022, 1, 10))
  if (!dateStrings[name]) dateStrings[name] = ''
}

function setDate(name: string, d: any) {
  if (d && 'year' in d && 'month' in d && 'day' in d) {
    // store as ISO-ish string (datetime-local format)
    dateStrings[name] = d.toDate(getLocalTimeZone()).toISOString().slice(0, 16)
  } else {
    dateStrings[name] = ''
  }
}

// ---- file handler ----
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null

  // Optional validations
  if (file && file.size > 1024 * 1024) {
    toast.add({
      title: 'Validation Error',
      description: 'Image must be less than 1MB',
      color: 'warning'
    })
    input.value = ''
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

// ---- reset ----
function resetForm() {
  for (const k of Object.keys(state)) delete state[k]
  for (const k of Object.keys(dateStrings)) delete dateStrings[k]
  for (const k of Object.keys(dateModels)) delete dateModels[k]
  selectedFile.value = null

  // clear native input value
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ---- load for update ----
async function loadForUpdate() {
  if (props.mode !== 'update' || !props.id || !props.findByIdUrl) return

  try {
    isLoading.value = true
    const apiData = await useApi(`${props.findByIdUrl}/${props.id}`, { method: 'GET' })
    const mapped = props.mapFromApi ? props.mapFromApi(apiData) : apiData

    for (const f of props.fields) {
      if (f.type === 'file') continue

      // set normal field value
      state[f.name] = mapped?.[f.name] ?? ''

      // set date string if present
      if (f.type === 'date' && mapped?.[f.name]) {
        dateStrings[f.name] = String(mapped[f.name]).slice(0, 16)
      }
    }
  } catch (e: any) {
    toast.add({ title: 'Error', description: 'Failed to load data', color: 'warning' })
  } finally {
    isLoading.value = false
  }
}

// open watcher
watch(isOpen, async (v) => {
  if (v) {
    resetForm()
    if (props.mode === 'update') await loadForUpdate()
  }
})

// ---- submit ----
async function onSubmit(event: FormSubmitEvent<any>) {
  try {
    isLoading.value = true

    // build payload base (zod validated values are in event.data)
    const payloadBase: Record<string, any> = { ...state, ...event.data }

    // map dates into payload
    props.fields.forEach((f) => {
      if (f.type === 'date') {
        payloadBase[f.name] = dateStrings[f.name] || payloadBase[f.name] || ''
      }
    })

    const finalJson = props.transform ? props.transform(payloadBase) : payloadBase

    // ---- multipart ----
    // IMPORTANT: part names must match backend @RequestPart names!
    // @RequestPart("data") + @RequestPart("image")
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(finalJson)], { type: 'application/json' }))

    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    // decide URL + method
    const url =
      props.mode === 'create'
        ? props.createUrl
        : props.updateUrl
          ? `${props.updateUrl}/${props.id}` // recommended REST style: PUT /employees/{id}
          : undefined

    if (!url) throw new Error('Missing URL configuration')

    await useApi(url, {
      method: props.mode === 'create' ? 'POST' : 'PUT',
      body: formData
      // DO NOT set Content-Type manually
    })

    toast.add({
      title: 'Success',
      description: props.mode === 'create' ? 'Created' : 'Updated',
      color: 'success'
    })

    isOpen.value = false
    emit('submitted')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.data?.message || error?.message || 'Request failed',
      color: 'warning'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="title" :description="description">
    <slot>
      <UButton
        v-if="mode === 'create'"
        :label="buttonLabel"
        :icon="buttonIcon || 'i-lucide-plus'"
      />
    </slot>

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <template v-for="f in fields.filter(f => !f.hidden)" :key="f.name">
          <UFormField :label="f.label" :name="f.name">
            <!-- Text & Number -->
            <UInput
              v-if="f.type === 'text' || f.type === 'number'"
              v-model="state[f.name]"
              :type="f.type"
              class="w-full"
              :disabled="isLoading || f.disabled"
              :placeholder="f.placeholder"
            />

            <!-- Select -->
            <USelect
              v-else-if="f.type === 'select'"
              v-model="state[f.name]"
              :items="f.items || []"
              class="w-full"
              :disabled="isLoading || f.disabled"
            />

            <!-- File Upload -->
            <UInput
              v-else-if="f.type === 'file'"
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="w-full block text-sm"
              :disabled="isLoading || f.disabled"
              @change="handleFileChange"
            />

            <!-- Date Picker -->
            <UPopover
              v-else-if="f.type === 'date'"
              class="w-full"
              @vue:mounted="ensureDate(f.name)"
            >
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-calendar"
                :disabled="isLoading || f.disabled"
                class="w-full justify-start"
              >
                {{ dateStrings[f.name]
                  ? df.format(new Date(dateStrings[f.name]!))
                  : (f.placeholder || 'Select a date') }}
              </UButton>

              <template #content>
                <UCalendar
                  v-model="dateModels[f.name]"
                  @update:modelValue="(d) => setDate(f.name, d)"
                  class="p-2"
                />
              </template>
            </UPopover>
          </UFormField>
        </template>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="isOpen = false" />
          <UButton
            :label="mode === 'create' ? 'Create' : 'Update'"
            color="primary"
            type="submit"
            :loading="isLoading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { ZodType } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

type FieldType = 'text' | 'number' | 'select' | 'date'

type FieldConfig = {
  name: string
  label: string
  placeholder?: string
  type: FieldType
  items?: { label: string; value: any }[]
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  trailingIcon?: string
  trailingText?: string
  onTrailingClick?: (ctx: { state: Record<string, any> }) => void | Promise<void>
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

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

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
    dateStrings[name] = d.toDate(getLocalTimeZone()).toISOString().slice(0, 16)
  }
}

function resetForm() {
  for (const k of Object.keys(state)) delete state[k]
  for (const k of Object.keys(dateStrings)) delete dateStrings[k]
  for (const k of Object.keys(dateModels)) delete dateModels[k]
}

async function loadForUpdate() {
  if (props.mode !== 'update') return
  if (!props.id || !props.findByIdUrl) return

  try {
    isLoading.value = true
    const apiData = await useApi(`${props.findByIdUrl}/${props.id}`, { method: 'GET' })
    const mapped = props.mapFromApi ? props.mapFromApi(apiData) : apiData

    for (const f of props.fields) state[f.name] = mapped?.[f.name] ?? ''

    for (const f of props.fields) {
      if (f.type === 'date' && mapped?.[f.name]) {
        dateStrings[f.name] = String(mapped[f.name]).slice(0, 16)
      }
    }
  } catch (e: any) {
    toast.add({
      title: 'Error',
      description: e?.data?.message || e?.message || 'Failed to load data',
      color: 'warning'
    })
  } finally {
    isLoading.value = false
  }
}

watch(isOpen, async (v) => {
  if (v) {
    resetForm()
    if (props.mode === 'update') await loadForUpdate()
  }
})

async function onSubmit(event: FormSubmitEvent<any>) {
  const payloadBase: Record<string, any> = { ...state, ...event.data }

  for (const f of props.fields) {
    if (f.type === 'date') payloadBase[f.name] = dateStrings[f.name] || payloadBase[f.name] || ''
  }

  for (const f of props.fields) {
    if (f.required && !payloadBase[f.name]) {
      toast.add({ title: 'Validation Error', description: `${f.label} is required`, color: 'warning' })
      return
    }
  }

  const finalPayload = props.transform ? props.transform(payloadBase) : payloadBase

  try {
    isLoading.value = true

    if (props.mode === 'create') {
      if (!props.createUrl) throw new Error('Missing createUrl')
      await useApi(props.createUrl, { method: 'POST', body: finalPayload })
    } else {
      if (!props.updateUrl) throw new Error('Missing updateUrl')
      if (!props.id) throw new Error('Missing id')
      await useApi(`${props.updateUrl}/update?id=${props.id}`, { method: 'PUT', body: finalPayload })
    }

    toast.add({ title: 'Success', description: props.mode === 'create' ? 'Created' : 'Updated', color: 'success' })
    isOpen.value = false
    emit('submitted')
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.data?.message || error?.message || 'Request failed', color: 'warning' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="title" :description="description">
    <!-- Only show trigger button for CREATE usage -->
    <slot>
      <UButton v-if="mode === 'create'" :label="buttonLabel" :icon="buttonIcon || 'i-lucide-plus'" />
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
            >
              <template #trailing v-if="f.onTrailingClick">
                <UButton
                  type="button"
                  :icon="f.trailingIcon || 'i-lucide-refresh-ccw'"
                  variant="ghost"
                  size="xs"
                  :disabled="isLoading || f.disabled"
                  @click="f.onTrailingClick({ state })"
                />
              </template>
            </UInput>


            <!-- Select -->
            <USelect
              v-else-if="f.type === 'select'"
              v-model="state[f.name]"
              :items="f.items || []"
              class="w-full"
              :disabled="isLoading || f.disabled"
            />
            <UPopover v-else-if="f.type === 'date'" class="w-full" @vue:mounted="ensureDate(f.name)">
              <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" :disabled="isLoading || f.disabled">
                {{
                  dateModels[f.name]?.value
                    ? df.format(dateModels[f.name].value.toDate(getLocalTimeZone()))
                    : (dateStrings[f.name] ? dateStrings[f.name] : 'Select a date')
                }}
              </UButton>
              <template #content>
                <UCalendar v-model="dateModels[f.name]" @update:modelValue="(d) => setDate(f.name, d)" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
        </template>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="isOpen = false" :disabled="isLoading" />
          <UButton :label="mode === 'create' ? 'Create' : 'Update'" color="primary" type="submit" :loading="isLoading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

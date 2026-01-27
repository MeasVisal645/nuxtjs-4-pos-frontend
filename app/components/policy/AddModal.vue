<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

const config = useRuntimeConfig()
const df = new DateFormatter('en-US', { dateStyle: 'medium' })

// Schema definition
const schema = z.object({
  policyNo: z.string().min(2, 'Too Short'),
  policyHolder: z.string().min(2, 'Required'),
  premium: z.coerce.number(),
  sumInsured: z.coerce.number(),
  address: z.string(),
  province: z.string(),
  product: z.string()
})


type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  policyNo: undefined,
  premium: undefined,
  sumInsured: undefined,
  address: undefined,
  province: undefined,
  product: undefined
})

// Toast and modal
const toast = useToast()
const open = ref(false)

// Calendar models
const inceptionModel = shallowRef(new CalendarDate(2022, 1, 10))
const expiryModel = shallowRef(new CalendarDate(2022, 1, 10))
const issueModel = shallowRef(new CalendarDate(2022, 1, 10))

// Date strings for backend
const inceptionDate = ref('')
const expiredDate = ref('')
const issueDate = ref('')

// Update date refs when calendar changes
const setInceptionDate = (d: any) => {
  if (d && 'year' in d && 'month' in d && 'day' in d) {
    inceptionDate.value = (d as CalendarDate).toDate(getLocalTimeZone()).toISOString().slice(0, 16)
  }
}

const setExpiredDate = (d: any) => {
  if (d && 'year' in d && 'month' in d && 'day' in d) {
    expiredDate.value = (d as CalendarDate).toDate(getLocalTimeZone()).toISOString().slice(0, 16)
  }
}

const setIssueDate = (d: any) => {
  if (d && 'year' in d && 'month' in d && 'day' in d) {
    issueDate.value = (d as CalendarDate).toDate(getLocalTimeZone()).toISOString().slice(0, 16)
  }
}


// Submit handler
async function onSubmit(event: FormSubmitEvent<Schema & { policyHolder: string }>) {
  // Combine form data + dates
  
  const payload = {
    ...event.data,
    inceptionDate: inceptionDate.value,
    expiredDate: expiredDate.value,
    issueDate: issueDate.value
  }

  console.log('Submitting payload:', payload) // debug

  // Check required fields
  const requiredFields: (keyof typeof payload)[] = [
    'policyNo',
    'policyHolder',
    'premium',
    'sumInsured',
    'address',
    'province',
    'product',
    'inceptionDate',
    'expiredDate',
    'issueDate'
  ]

  for (const field of requiredFields) {
    if (!payload[field]) {
      toast.add({
        title: 'Validation Error',
        description: `Field ${field} is required`,
        color: 'warning'
      })
      return
    }
  }


  try {
    await $fetch(`${config.public.apiBaseUrl}/api/v1/policy/create`, {
      method: 'POST',
      body: payload
    })
    await refreshNuxtData()
    toast.add({
      title: 'Success',
      description: `New Policy ${payload.policyNo} added`,
      color: 'success'
    })
    open.value = false

  } catch (error: any) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to create policy',
      color: 'warning'
    })
  }
}
</script>

<template>
  <UModal v-model:open="open" title="New Policy" description="Add new policy">
    <UButton label="New Policy" icon="i-lucide-plus"/>

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">

        <UFormField label="Policy No" placeholder="PP1234/112" name="policyNo">
          <UInput v-model="state.policyNo" class="w-full"/>
        </UFormField>

        <UFormField label="Policy Holder" placeholder="CAMINCO" name="policyHolder">
          <UInput v-model="state.policyHolder" class="w-full"/>
        </UFormField>


        <UFormField label="Premium" name="premium">
          <UInput v-model="state.premium" type="number" class="w-full"/>
        </UFormField>

        <UFormField label="Sum Insured" name="sumInsured">
          <UInput v-model="state.sumInsured" type="number" class="w-full"/>
        </UFormField>

        <UFormField label="Inception Date" name="inceptionDate">
          <UPopover class="w-full">
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              {{ inceptionModel ? df.format(inceptionModel.toDate(getLocalTimeZone())) : 'Select a date' }}
            </UButton>
            <template #content>
              <UCalendar v-model="inceptionModel" @update:modelValue="setInceptionDate" class="p-2"/>
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Expiry Date" name="expiredDate">
          <UPopover class="w-full">
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              {{ expiryModel ? df.format(expiryModel.toDate(getLocalTimeZone())) : 'Select a date' }}
            </UButton>
            <template #content>
              <UCalendar v-model="expiryModel" @update:modelValue="setExpiredDate" class="p-2"/>
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Issue Date" name="issueDate">
          <UPopover class="w-full">
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              {{ issueModel ? df.format(issueModel.toDate(getLocalTimeZone())) : 'Select a date' }}
            </UButton>
            <template #content>
              <UCalendar v-model="issueModel" @update:modelValue="setIssueDate" class="p-2"/>
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Address" name="address">
          <UInput v-model="state.address" class="w-full"/>
        </UFormField>

        <UFormField label="Province" name="province">
          <UInput v-model="state.province" class="w-full"/>
        </UFormField>

        <UFormField label="Product" name="product">
          <UInput v-model="state.product" class="w-full"/>
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false"/>
          <UButton label="Create" color="primary" variant="solid" type="submit"/>
        </div>

      </UForm>
    </template>
  </UModal>
</template>

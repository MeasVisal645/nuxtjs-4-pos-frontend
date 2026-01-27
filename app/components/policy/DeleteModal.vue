<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    ids: number[]
    count?: number
  }>(),
  {
    ids: () => [],
    count: 0
  }
)

const config = useRuntimeConfig()
const open = ref(false)
const toast = useToast()

async function onSubmit() {
  try {
    for (const id of props.ids) {
      await $fetch(`${config.public.apiBaseUrl}/api/v1/policy/delete?id=${id}`, {
        method: 'DELETE'
      })
    }
    await refreshNuxtData()
    toast.add({
      title: 'Success',
      description: `${props.ids.length} polic${props.ids.length > 1 ? 'ies' : 'y'} deleted`,
      color: 'success'
    })

    open.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: `Failed to delete policies`,
      color: 'error'
    })
  }
}

</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count} policy ${count > 1 ? 's' : ''}`"
    :description="`Are you sure, this action cannot be undone.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton 
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />

        <UButton 
          label="Delete"
          color="error"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
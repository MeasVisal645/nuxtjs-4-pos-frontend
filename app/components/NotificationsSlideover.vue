<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import type { Notification, Product } from '~/types'
const { lowStockThreshold } = useNotificationSettings()

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: notifications } = await useFetch<Notification[]>('/api/notifications')

const { data: products, pending, refresh } = await useFetch<Product[]>('/product/all')

const lowStock = computed(() => {
  const th = Number(lowStockThreshold.value) || 0
  return (products.value ?? [])
    .filter(p => Number(p.quantity) < th)
    .sort((a, b) => Number(a.quantity) - Number(b.quantity))
})

watch(isNotificationsSlideoverOpen, (open) => {
  if (open) refresh()
})
</script>

<template>
  <USlideover v-model:open="isNotificationsSlideoverOpen" title="Notifications">
    <template #body>
      <div v-if="pending" class="text-sm text-muted py-6">Loading…</div>

      <div v-else-if="lowStock.length === 0" class="text-sm text-muted py-6">
        No low stock products 🎉
      </div>

      <NuxtLink
        v-for="p in lowStock"
        :key="p.code"
        :to="`/product/${encodeURIComponent(p.code)}`"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3"
      >
        <UChip color="error" :show="true" inset>
          <div class="h-9 w-9 rounded-full bg-elevated/40 flex items-center justify-center text-sm font-semibold">
            {{ p.quantity }}
          </div>
        </UChip>

        <div class="text-sm flex-1">
          <p class="flex items-center justify-between">
            <span class="text-highlighted font-medium">{{ p.name }}</span>
            <span class="text-muted text-xs">{{ p.code }}</span>
          </p>

          <p class="text-dimmed">
            Quantity is <span class="font-semibold">{{ p.quantity }}</span> (below {{ lowStockThreshold }})
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
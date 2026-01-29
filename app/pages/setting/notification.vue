<script setup lang="ts">
  const { lowStockThreshold } = useNotificationSettings()
</script>

<template>
  <UDashboardPanel id="notification">
    <template #header>
      <UDashboardNavbar title="Notification">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right />
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <div class="font-semibold">Notification Settings</div>
          <div class="text-sm text-muted">Configure when to alert for low stock.</div>
        </template>

        <div class="space-y-2">
          <label class="text-sm font-medium">Low stock alert threshold</label>
          <UInput
            type="number"
            v-model.number="lowStockThreshold"
            min="0"
            placeholder="e.g. 10"
            class="max-w-xs"
          />
          <div class="text-xs text-muted">
            Products with quantity &lt; {{ lowStockThreshold }} will appear in Notifications.
          </div>
        </div>
      </UCard>

    </template>

  </UDashboardPanel>
</template>
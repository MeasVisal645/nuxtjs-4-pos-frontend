<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const colorMode = useColorMode()
const { logout } = useAuth()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
    label: 'Products',
    to: '/product',
    icon: 'i-lucide-box',
    defaultOpen: false,
    type: 'trigger',
    children: [{
      label: 'List Product',
      to: '/product/',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Add Product',
      to: '/product/add',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Import Product',
      to: '/product/import',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Promotion',
      to: '/product/promotion',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Print Label/Barcode',
      to: '/product/print',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Quantity Adjustment',
      to: '/product/quantity-adjustment',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Add Adjustment',
      to: '/product/add-adjustment',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Stock Counts',
      to: '/product/stock-count',
      onSelect: () => {
        open.value = false
      }
    }]
  }, {
  label: 'Policy',
  icon: 'i-lucide-inbox',
  to: '/policy',
  onSelect: () => {
      open.value = false
    }
  }, {
  label: 'Employee',
  icon: 'i-lucide-user',
  to: '/employee',
  onSelect: () => {
      open.value = false
    }
  },

]] satisfies NavigationMenuItem[][]

//Search Group
const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />

      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

      <slot />

    <NotificationsSlideover />

  </UDashboardGroup>
</template>
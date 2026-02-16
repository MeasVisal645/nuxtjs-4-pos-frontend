<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()
const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-gauge',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'POS',
  icon: 'i-lucide-house',
  defaultOpen: false,
  to: '/pos',
  onSelect: () => {
    open.value = false
  }
},  {
    label: 'Products',
    to: '/product',
    icon: 'i-lucide-package-open',
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
      label: 'Print Label/Barcode',
      to: '/product/print',
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
  label: 'Categories',
  icon: 'i-lucide-box',
  to: '/category',
  onSelect: () => {
      open.value = false
    }
  }, {
  label: 'Customers',
  icon: 'i-lucide-users-round',
  to: '/customer',
  onSelect: () => {
      open.value = false
    }
  }, {
  label: 'Suppliers',
  icon: 'i-lucide-contact',
  to: '/supplier',
  onSelect: () => {
      open.value = false
    }
  }, {
  label: 'Employees',
  icon: 'i-lucide-user',
  to: '/employee',
  onSelect: () => {
      open.value = false
    }
  },  {
    label: 'Reports',
    to: '/report',
    icon: 'i-lucide-book-text',
    defaultOpen: false,
    type: 'trigger',
  children: [
    {
      label: 'Sale Report',
      to: '/report/sale-report',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    },{
      label: 'Quantity Adjustment',
      to: '/product/quantity-adjustment',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }]
  }, {
    label: 'Settings',
    to: '/setting',
    icon: 'i-lucide-cog',
    defaultOpen: false,
    type: 'trigger',
  children: [
    {
      label: 'Notification',
      to: '/setting/notification',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }]
  }, {
    label: 'Admin',
    to: '/admin',
    icon: 'i-lucide-shield-user',
    defaultOpen: false,
    type: 'trigger',
    children: [{
      label: 'Audit Log',
      to: '/admin/audit-log',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    }]
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
    to: `https://github.com/MeasVisal645/nuxtjs-4-pos-frontend`,
    target: '_blank'
  }]
}])

// onMounted(async () => {
//   const cookie = useCookie('cookie-consent')
//   if (cookie.value === 'accepted') {
//     return
//   }

//   toast.add({
//     title: 'We use first-party cookies to enhance your experience on our website.',
//     duration: 0,
//     close: false,
//     actions: [{
//       label: 'Accept',
//       color: 'neutral',
//       variant: 'outline',
//       onClick: () => {
//         cookie.value = 'accepted'
//       }
//     }, {
//       label: 'Opt out',
//       color: 'neutral',
//       variant: 'ghost'
//     }]
//   })
// })

const expiredModalOpen = useState<boolean>('auth:expiredModalOpen', () => false)
const expiredReason = useState<string>('auth:expiredReason', () => 'Your session has expired. Please login again.')

const token = useCookie<string | null>('token', {
  default: () => null,
  sameSite: 'lax'
})

const goLogin = async () => {
  token.value = null
  expiredModalOpen.value = false
  await navigateTo('/signin', { replace: true })
}

// const onExpiredModalClose = async () => {
//   await goLogin()
// }



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

      <UModal v-model:open="expiredModalOpen" :prevent-close="true">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-semibold">Session expired</div>
          </div>
        </template>

        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ expiredReason }}
        </p>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="primary" @click="goLogin">Login</UButton>
          </div>
        </template>
      </UModal>


    <NotificationsSlideover />

  </UDashboardGroup>
</template>
<script setup lang="ts">

definePageMeta({
  layout: "blank"
})

const username = ref("")
const password = ref("")
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const router = useRouter()
const { login } = useAuth()

const onSubmit = async () => {
  errorMsg.value = null

  if (!username.value || !password.value) {
    errorMsg.value = "Username and password are required"
    return
  }

  loading.value = true
  try {
    await login({ username: username.value, password: password.value })
    await router.push("/")
    // console.log("token:", useCookie("token").value)

  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || "Login failed"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-lg font-semibold">Sign in</div>
        <div class="text-sm text-gray-500"></div>
      </template>

      <div v-if="errorMsg" class="mb-3">
        <UAlert :title="errorMsg" color="error" variant="soft" />
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Username" required>
          <UInput v-model="username" placeholder="Enter username" class="w-full"/>
        </UFormField>

        <UFormField label="Password" required>
          <UInput v-model="password" type="password" placeholder="Enter password" class="w-full"/>
        </UFormField>

        <UButton type="submit" :loading="loading" block>
          Login
        </UButton>
      </form>
    </UCard>
  </div>
</template>

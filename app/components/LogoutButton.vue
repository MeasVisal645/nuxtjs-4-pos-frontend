<script setup lang="ts">
const { logout } = useAuth()
</script>

<template>
  <UButton @click="logout">
    Logout
  </UButton>
</template>

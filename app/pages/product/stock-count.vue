<script setup lang="ts">
import type { NuxtError } from '#app'
import Error from '~/error.vue';

definePageMeta({
    layout: 'blank'
})

defineProps<{
  error: NuxtError
}>()

useSeoMeta({
  title: 'Page under development',
  description: 'We are sorry but this page is under development.'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <Error :error="error" />
  </UApp>
</template>
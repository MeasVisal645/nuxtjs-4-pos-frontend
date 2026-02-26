<script setup lang="ts">
import type { NuxtError } from '#app'

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
</template>
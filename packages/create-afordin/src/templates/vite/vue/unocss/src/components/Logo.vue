<script setup>
  defineProps({
    alt: String,
  })
</script>

<template>
  <img src='/logo.png' :alt="alt" />
</template>
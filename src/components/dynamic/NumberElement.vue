<script lang="ts" setup>
const props = defineProps(['value']);
</script>
<template>
  <span class="xl:text-sm text-[12px]">{{ Number(props.value) }}</span>
</template>

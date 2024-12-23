<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps(['value', 'description', 'copyValue']);
const hoverElement = ref(false);
</script>

<template>
  <div class="relative">
    <div v-if="hoverElement" class="absolute -top-14 -right-16 bg-base-300 p-2 rounded-md">
      <span class="text-white">{{ description }}</span>
    </div>
    <div>
      <span class="text-white" v-if="value" @mouseenter="hoverElement = true" @mouseleave="hoverElement = false">{{
        value }}</span>
      <span v-else>-</span>
    </div>
  </div>
</template>

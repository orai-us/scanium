<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps(['value', 'description', 'copyValue']);
const hoverElement = ref(false);
let resultCopy = ref();

const handleCopy = async (value: string) => {
  if (!value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    resultCopy.value = true;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  } catch (err) {
    resultCopy.value = false;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  }
};
</script>

<template>
  <div class="relative" @click="handleCopy(copyValue)">
    <div v-if="hoverElement" class="absolute -top-14 -left-10 bg-base-300 p-2 rounded-md">
      <span class="text-white">{{ description }}</span>
    </div>
    <div>
      <span class="text-white" v-if="value" @mouseenter="hoverElement = true" @mouseleave="hoverElement = false">{{
        value }}</span>
      <span v-else>-</span>
    </div>

    <div class="toast" v-show="resultCopy === true">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>Copy Success!</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="resultCopy === false">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>Copy Error!</span>
        </div>
      </div>
    </div>
  </div>
</template>

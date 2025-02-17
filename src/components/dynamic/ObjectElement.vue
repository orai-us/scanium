<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { select } from './index';

const props = defineProps(['value']);
</script>
<template>
  <div class="overflow-auto rounded-lg w-full p-2">
    <div v-for="(v, k) of value" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2 lg:max-w-full max-w-[300px]">
      <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
      <Component :is="select(v)" :value="v"></Component>
    </div>
  </div>
</template>
<style scoped>
::v-deep span {
  background-color: #18181A !important;
  color: white !important;
}
</style>

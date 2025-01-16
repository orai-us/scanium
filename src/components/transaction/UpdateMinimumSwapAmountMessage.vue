<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { formatNumber } from '@/utils';
import { computed } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { tokenMap } from '@/libs/amm-v3';

const props = defineProps(['action', 'params', 'events']);
const value = computed(() => {
  const tokenIn = tokenMap[props.params?.token_in?.token?.contract_addr];
  return {
    amount: tokenIn?.coinDecimals ? formatNumber(props.params?.amount / Math.pow(10, tokenIn.coinDecimals)) : formatNumber(props.params?.amount),
    tokenIn: tokenIn?.coinDenom,
  };
});

</script>
<template>
  <div v-for="(v, k) of value" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
    <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
    <div
      :class="{ 'border-gray-800 border rounded-md xl:w-[80%] w-full': typeof v === 'object' && !Array.isArray(v) && v }">
      <DynamicComponent :value="v" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { formatTitle } from '@/libs/utils';
import { displayListAssets, displayPoolName } from '@/libs/amm-v3';
import DynamicComponent from '../dynamic/DynamicComponent.vue';

const props = defineProps(['action', 'params', 'events']);

const value = computed(() => {
  const events = props.events?.filter(
    (e: Event) =>
      e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === 'action' &&
        attr.value === 'swap'
      )
  );
  const messages: any[] = [];
  if (Array.isArray(events)) {
    for (let event of events) {
      const result = event?.attributes.reduce((obj: { [key: string]: any; }, attr: EventAttribute) => {
        if (attr.key in obj) {
          obj[attr.key] = [obj[attr.key], attr.value];
          return obj;
        }
        obj[attr.key] = attr.value;
        return obj;
      }, {} as any) || {};
      messages.push(result);
    }
  }
  const data = [];
  for (let message of messages) {
    const token_x = message.offer_asset;
    const token_y = message.ask_asset;
    const amountIn = message.offer_amount;
    const amountOut = message.return_amount;

    const poolKey = {
      token_x,
      token_y,
      fee_tier: {
        fee: null,
        tick_spacing: null
      }
    };
    const result = {
      pool: displayPoolName(poolKey),
      tokenIn: displayListAssets([amountIn], [token_x]),
      tokenOut: displayListAssets([amountOut], [token_y]),
    }
    data.push(result)
  }
  const tokenIn = data[0].tokenIn;
  const tokenOut = data.slice(-1)[0].tokenOut;

  return {
    tokenIn,
    tokenOut,
    operations: data,
    maxSpread: props.params?.max_spread,
    beliefPrice: props.params?.belief_price
  }
})
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

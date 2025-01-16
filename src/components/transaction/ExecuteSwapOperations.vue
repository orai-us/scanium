<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { computed } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { displayListAssets, displayPoolName } from '@/libs/amm-v3';

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

  if (props.action === 'execute_swap_operations') {
    const data = [];
    let denomMinimumReceive;
    const operations = props.params?.operations?.map((item: any, index: number) => {
      const swapV3 = item.swap_v3;
      const event = messages[index]
      console.log({ event })
      console.log({ swapV3 })
      if (swapV3) {
        const poolKey = swapV3.pool_key;
        const xToY = swapV3.x_to_y;
        return {
          poolKey,
          xToY,
          amountIn: event.amount_in,
          amountOut: event.amount_out
        };
      }
      const swapV2 = item.orai_swap;
      if(swapV2) {
        const offerAssetInfo = swapV2.offer_asset_info;
        const askAssetInfo = swapV2.ask_asset_info;
        const token_x = offerAssetInfo?.native_token?.denom || offerAssetInfo?.token?.contract_addr;
        const token_y = askAssetInfo?.native_token?.denom || askAssetInfo?.token?.contract_addr;
        return {
          poolKey:{
            token_x,
            token_y,
            fee_tier:{
              fee: null
            }
          },
          xToY: true,
          amountIn: event.offer_amount,
          amountOut: event.return_amount
        }
      }
      return item
    })
   
    if (Array.isArray(operations)) {
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        const poolKey = operation.poolKey;
        const xToY = operation.xToY;
        const amountIn = operation.amountIn;
        const amountOut = operation.amountOut;
        denomMinimumReceive = xToY ? poolKey.token_y : poolKey.token_x;
        const result = {
          pool: displayPoolName(poolKey),
          tokenIn: displayListAssets([amountIn], [xToY ? poolKey.token_x : poolKey.token_y]),
          tokenOut: displayListAssets([amountOut], [xToY ? poolKey.token_y : poolKey.token_x]),
        };
        data.push(result);
      }
    }

    const tokenIn = data[0].tokenIn;
    const tokenOut = data.slice(-1)[0].tokenOut;
    return {
      tokenIn,
      tokenOut,
      operations: data,
      minimum_receive: displayListAssets([props.params.minimum_receive], [denomMinimumReceive]),
    };
  }

  return props.params;
});

</script>

<template>
  <div v-for="(v, k) of value" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
    <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
    <DynamicComponent :value="v" direct="horizontal" />
  </div>
</template>

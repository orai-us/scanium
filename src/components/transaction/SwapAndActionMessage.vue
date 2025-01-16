<script lang="ts" setup>
import { computed } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { displayListAssets, displayPoolName } from '@/libs/amm-v3';
import { formatTitle, getDeepestObject } from '@/libs/utils';
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
  const operations = props.params?.user_swap?.swap_exact_asset_in?.operations?.map((item: any, index: number) => {
    const poolKey = item.pool?.split('-');
    const event = messages[index];
    let fee, tick_spacing;
    if (Array.isArray(poolKey)) {
      fee = poolKey[2];
      tick_spacing = poolKey[3];
    }
    const token_x = item.denom_in;
    const token_y = item.denom_out;
    return {
      poolKey: {
        token_x,
        token_y,
        fee_tier: {
          fee,
          tick_spacing
        }
      },
      xToY: true,
      amountIn: event?.amount_in || event?.offer_amount,
      amountOut: event?.amount_out || event?.return_amount
    };
  });

  if (Array.isArray(operations)) {
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const poolKey = operation.poolKey;
      const xToY = operation.xToY;
      const amountIn = operation.amountIn;
      const amountOut = operation.amountOut;
      const result = {
        pool: displayPoolName(poolKey),
        tokenIn: (amountIn !== null && amountIn !== undefined) ? displayListAssets([amountIn], [xToY ? poolKey.token_x : poolKey.token_y]) : null,
        tokenOut: (amountOut !== null && amountOut !== undefined) ? displayListAssets([amountOut], [xToY ? poolKey.token_y : poolKey.token_x]) : null,
      };
      data.push(result);
    }
  }
  const tokenIn = data[0].tokenIn;
  const tokenOut = data.slice(-1)[0].tokenOut;
  let postSwapAction = getDeepestObject(props.params?.post_swap_action);
  if (postSwapAction?.memo !== undefined) {
    const snapShotPostSwapAction = { ...postSwapAction };
    delete snapShotPostSwapAction.memo
    postSwapAction = {
      ...snapShotPostSwapAction,
      memo: postSwapAction?.memo
    }
  }
  const nameAction = Object.keys(props.params?.post_swap_action)[0];
  const minAsset = props.params?.min_asset;
  let amountMinAsset, addressMinAsset;
  if(minAsset?.cw20){
    amountMinAsset = minAsset.cw20.amount;
    addressMinAsset = minAsset.cw20.address;
  }
  return {
    tokenIn,
    tokenOut,
    operations: data,
    [nameAction]: postSwapAction,
    minAsset: (amountMinAsset && addressMinAsset) ? displayListAssets([amountMinAsset], [addressMinAsset]) : null
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

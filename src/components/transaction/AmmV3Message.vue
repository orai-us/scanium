<script lang="ts" setup>
import { computed } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { formatTitle } from '@/libs/utils';
import DynamicComponent from '@/components/dynamic/DynamicComponent.vue';
import { contractAddress, displayFee, displayIncentives, displayListAssets, displayPoolName, displayTickPrice, displayTokenOut } from '@/libs/amm-v3';

const props = defineProps(['action', 'params', 'events']);

const value = computed(() => {
  const event = props.events?.find(
    (e: Event) => e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === '_contract_address' &&
        attr.value === contractAddress
      ) &&
      e.attributes.some((attr) =>
        attr.key === 'action' &&
        attr.value === props.action
      )
  )?.attributes.reduce((obj: { [key: string]: any }, attr: EventAttribute) => {
    if (attr.key in obj) {
      obj[attr.key] = [obj[attr.key], attr.value];
      return obj;
    }
    obj[attr.key] = attr.value;
    return obj;
  }, {} as any) || {};
  if (props.action === 'create_position') {
    return {
      pool: displayPoolName(props.params.pool_key),
      upperPrice: displayTickPrice(props.params.upper_tick, props.params.pool_key),
      lowerPrice: displayTickPrice(props.params.lower_tick, props.params.pool_key),
    };
  }
  if (props.action === 'remove_position') {
    return {
      pool: displayPoolName(event.pool_key),
      upperPrice: displayTickPrice(event.upper_tick, event.pool_key),
      lowerPrice: displayTickPrice(event.lower_tick, event.pool_key),
      fee: displayFee([event.fee_x, event.fee_y], event.pool_key),
      incentives: displayIncentives(event.incentives_amount, event.incentives_token_address),
      tokenOut: displayTokenOut([event.liquidity_x, event.liquidity_y], event.pool_key),
    };
  }
  if (props.action === 'swap') {
    return {
      pool: displayPoolName(props.params.pool_key),
      tokenIn: displayListAssets([event.amount_in], [event.x_to_y ? props.params.pool_key.token_x : props.params.pool_key.token_y]),
      tokenOut: displayListAssets([event.amount_out], [event.x_to_y ? props.params.pool_key.token_y : props.params.pool_key.token_x]),
    }
  }
  if (props.action === 'claim_fee') {
    return {
      pool: displayPoolName(event.pool_key),
      incentives: displayIncentives(event.incentives_amount, event.incentives_token_address),
      fee: displayFee([event.amount_x, event.amount_y], event.pool_key),
    }
  }
  return props.params;
});
</script>
<template>
  <div v-for="(v, k) of value" class="mb-4">
    <div>{{ formatTitle(k.toString()) }}:</div>
    <div>
      <DynamicComponent :value="v" direct="horizontal" />
    </div>
  </div>
</template>

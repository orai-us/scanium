<script lang="ts" setup>
import { computed, toRaw, watchEffect } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { formatTitle } from '@/libs/utils';
import { displayListAssets, tokenMap } from '@/libs/amm-v3';
const props = defineProps(['action', 'params', 'events', 'receiver', 'amount']);

const valueSend = computed(() => {
  const eventSends = props.events?.filter(
    (e: Event) =>
      e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === 'action' &&
        attr.value === 'send'
      )
  );
  const messages: any[] = [];
  if (Array.isArray(eventSends)) {
    for (let event of eventSends) {
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

  const receiver = messages.slice(-1)[0]?.to;
  const amount = messages[0]?.amount;

  return {
    receiver,
    amount: tokenMap[denom.value] ? displayListAssets([amount], [denom.value]) : `${amount} ${denom.value}`,
  };
});

const denom = computed(() => {
  const eventContracts = props.events?.filter(
    (e: Event) => e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === '_contract_address' &&
        attr.value === props.params?.contract
      )
  );
  const messageContracts: any[] = [];
  if (Array.isArray(eventContracts)) {
    for (let event of eventContracts) {
      console.log({ event: toRaw(event) })
      const result = event?.attributes.reduce((obj: { [key: string]: any; }, attr: EventAttribute) => {
        if (attr.key in obj) {
          obj[attr.key] = [obj[attr.key], attr.value];
          return obj;
        }
        obj[attr.key] = attr.value;
        return obj;
      }, {} as any) || {};
      messageContracts.push(result);
    }
  }

  console.log({ messageContracts })

  for (let message of messageContracts) {
    console.log({ event: toRaw(message) });
    let denom = message.denom_in || message.denom;
    if (denom) return denom;
  }

});
</script>
<template>
  <div v-for="(v, k) of valueSend" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
    <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k) }}:</div>
    <div
      :class="{ 'border-gray-800 border rounded-md xl:w-[80%] w-full': typeof v === 'object' && !Array.isArray(v) && v }">
      <DynamicComponent :value="v" />
    </div>
  </div>
</template>

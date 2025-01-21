<script lang="ts" setup>
import { computed, toRaw, watchEffect } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { formatTitle } from '@/libs/utils';
import { displayListAssets, tokenMap } from '@/libs/amm-v3';
import { TypeMessageSend } from '@/libs/send-msg';
const props = defineProps(['action', 'params', 'events', 'receiver']);

watchEffect(()=>{
  console.log({ params: toRaw(props.params) });
})

const valueSend = computed(() => {
  const eventSends = props.events?.filter(
    (e: Event) =>
      e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === 'action' &&
        Object.values(TypeMessageSend).includes(attr.value as TypeMessageSend)
      )
  );
  const messages: any[] = [];
  if (Array.isArray(eventSends)) {
    for (let event of eventSends) {
      const result = event?.attributes.reduce((obj: { [key: string]: any; }, attr: EventAttribute) => {
        if (attr.key in obj) {
          if (!obj[attr.key])
            obj[attr.key] = [obj[attr.key], attr.value];
          return obj;
        }
        if (!obj[attr.key])
          obj[attr.key] = attr.value;
        return obj;
      }, {} as any) || {};
      messages.push(result);
    }
  }

  const messageSend = messages.slice(-1)[0]
  const receiver = messageSend?.to || messageSend?.recipient;
  const amount = messages[0]?.amount;
  let amountDisplay = amount;
  if(denom.value){
    if(tokenMap[denom.value])
      amountDisplay = displayListAssets([amount], [denom.value]);
    else 
      amountDisplay = `${amount} ${denom.value}`
  }

  return {
    receiver: receiver || props.params?.contract,
    amount: amountDisplay || props.params?.amount,
  };
});

const denom = computed(() => {
  const eventContracts = props.events?.filter(
    (e: Event) => e.type === 'wasm' &&
      e.attributes.some((attr) =>
        attr.key === '_contract_address'
      )
  );
  
  const messageContracts: any[] = [];
  if (Array.isArray(eventContracts)) {
    for (let event of eventContracts) {
      const result = event?.attributes.reduce((obj: { [key: string]: any; }, attr: EventAttribute) => {
        if (attr.key in obj) {
          if (!obj[attr.key])
            obj[attr.key] = [obj[attr.key], attr.value];
          return obj;
        }
        if (!obj[attr.key])
          obj[attr.key] = attr.value;
        return obj;
      }, {} as any) || {};
      messageContracts.push(result);
    }
  }

  for (let message of messageContracts) {
    let denom = message.denom_in || message.denom || message.offer_asset || message.staking_token || message.currency || message._contract_address;
    if (!denom && message.pool_key) {
      const poolKey = message.pool_key;
      denom = poolKey.split("-")[0];
    }
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

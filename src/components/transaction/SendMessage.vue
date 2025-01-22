<script lang="ts" setup>
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import ContractMessage from './ContractMessage.vue';
import { computed } from 'vue';
import { formatTitle } from '@/libs/utils';
import { displayMessageSend } from '@/libs/send-msg';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';

const props = defineProps(['params', 'events', 'denom', 'sender', 'chain']);

const valueSwap = computed(() => {
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
  return messages;
});

const sendMessage = computed(() => {
  return displayMessageSend(props.params, valueSwap.value, props.denom, props.sender);
});

</script>
<template>
  <div>
    <div v-for="(v, k) of sendMessage" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
      <div
        :class="{ 'border-gray-800 border rounded-md xl:w-[80%] w-full': typeof v === 'object' && !Array.isArray(v) && v }">
        <DynamicComponent :value="v" />
      </div>
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">Contract :</div>
      <ContractMessage :contract="props.params?.contract" :chain="chain" />
    </div>
    <!-- <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">Msg :</div>
      <DynamicComponent :value="props.params?.msg" :direct="'messageTx'"/>
    </div> -->
  </div>
</template>

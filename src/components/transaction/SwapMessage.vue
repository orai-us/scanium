<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { formatTitle } from '@/libs/utils';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { displayMessageSwap } from '@/libs/swap-msg';

const props = defineProps(['action', 'params', 'events', 'sender']);
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
  return displayMessageSwap(props.action, messages, props.params, props.sender)
});

</script>

<template>
  <div v-for="(v, k) of value" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
    <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k) }}:</div>
    <div
      :class="{ 'border-gray-800 border rounded-md xl:w-[80%] w-full': typeof v === 'object' && !Array.isArray(v) && v }">
      <DynamicComponent :value="v" />
    </div>
  </div>
</template>

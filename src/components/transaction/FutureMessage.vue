<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { Event, EventAttribute } from 'cosmjs-types/tendermint/abci/types';
import { computed, ref, toRaw, watchEffect } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';

const props = defineProps(['params', 'events', 'sender', 'chain', 'type']);

const positionId = ref("");
const entryPrice = ref("");
const pnl = ref("");
const fundingPayment = ref("");
const isOpenPosition = ref(true)

watchEffect(() => {
  if (Array.isArray(props.events)) {
    props.events.forEach((item: Event) => {
      if (item.type === "wasm") {
        item.attributes.forEach((att) => {
          if (att.key === "action" && att.value === "open_position") isOpenPosition.value = true;
          if (att.key === "action" && att.value === "close_position") isOpenPosition.value = false;
          if (att.key === "position_id") positionId.value = att.value
          if (att.key === "entry_price") entryPrice.value = att.value
          if (att.key === "pnl") pnl.value = att.value
          if (att.key === "funding_payment") fundingPayment.value = att.value
        })
      }
    })
  }
})
</script>
<template>
  <div>
    <div v-for="(v, k) of params" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-1">
      <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
      <DynamicComponent :value="v" :direct="'messageTx'" />
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-1">
      <span class="w-40 xl:text-sm text-xs">Position ID: </span>
      <span class="xl:text-sm text-xs">{{ positionId }}</span>
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-1">
      <span class="w-40 xl:text-sm text-xs">Entry price: </span>
      <span class="xl:text-sm text-xs">{{ entryPrice }}</span>
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-1" v-if="!isOpenPosition">
      <span class="w-40 xl:text-sm text-xs">Pnl: </span>
      <span class="xl:text-sm text-xs">{{ pnl }}</span>
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-1" v-if="!isOpenPosition">
      <span class="w-40 xl:text-sm text-xs">Funding Payment: </span>
      <span class="xl:text-sm text-xs">{{ fundingPayment }}</span>
    </div>
  </div>
</template>

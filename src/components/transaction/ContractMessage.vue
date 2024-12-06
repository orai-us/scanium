<script lang="ts" setup>
import { computed, ref, toRaw, watchEffect } from 'vue';
import { select } from '../dynamic';

const props = defineProps(['value', 'type']);

const data = computed(() => {
  const value = props.value;
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  const parseData = JSON.parse(decoder.decode(value.msg));
  const msg = encoder.encode(JSON.stringify({ funds: value.funds, ...parseData }));
  return {
    sender: value.sender,
    contract: value.contract,
    messages: msg,
    recipients: {
      address: value.contract,
      amount: value.funds[0]
    }
  };
})

</script>

<template>
  <Component :is="select(value)" :value="data"></Component>
</template>

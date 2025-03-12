<script lang="ts" setup>
import DetailCosmosTx from '@/components/transaction/DetailCosmosTx.vue';
import DetailEvmTx from '@/components/transaction/DetailEvmTx.vue';

const props = defineProps(['hash', 'chain']);

</script>
<template>
  <div v-if="hash?.startsWith('0x')">
    <DetailEvmTx :hash="hash" :chain="chain" />
  </div>
  <div v-else>
    <DetailCosmosTx :hash="hash" :chain="chain" />
  </div>
</template>

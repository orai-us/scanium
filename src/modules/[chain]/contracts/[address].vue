<script lang="ts" setup>
import ContractDetail from '@/components/contracts/ContractDetail.vue';
import TransactionContract from '@/components/contracts/TransactionContract.vue';

const props = defineProps(['chain'])

</script>
<template>
  <ContractDetail :chain="chain"/>
  <TransactionContract :chain="chain"/>
</template>
<script lang="ts" setup>
import ContractDetail from '@/components/contracts/ContractDetail.vue';
import TransactionContract from '@/components/contracts/TransactionContract.vue';

const props = defineProps(['chain','address'])

</script>
<template>
  <ContractDetail :chain="chain" :address="address"/>
  <TransactionContract :chain="chain" :address="address"/>
</template>
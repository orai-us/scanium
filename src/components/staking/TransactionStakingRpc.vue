<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { toHex } from 'secretjs';
import { ref, toRaw, watch } from 'vue';
import TransactionTable from '../TransactionTable.vue';

const format = useFormatter();

const props = defineProps(['txs', 'chain'])
const transactions = ref([] as Array<any>)

watch([() => props.txs], () => {
  transactions.value = props.txs?.txs?.map((item: any) => ({
    txhash: toHex(item?.hash),
    result: "Success",
    message: format.messages(item.txRaw.body.messages),
    height: item?.height,
    fee: item?.fee || 0,
    timestamp: format.toDay(item?.timestamp, 'from')
  }));
})
</script>
<template>
  <div class="rounded overflow-auto">
    <TransactionTable :transactions="transactions" :chain="chain"/>
  </div>
</template>
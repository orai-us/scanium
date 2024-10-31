<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { toHex } from '@cosmjs/encoding';
import TransactionTable from '../TransactionTable.vue';
import { ref, watch } from 'vue';

const props = defineProps(['address', 'chain', 'txs']);
const format = useFormatter();
const transactions = ref([] as Array<any>)

watch([() => props.txs], () => {
  transactions.value = props.txs?.map((item: any) => ({
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
  <TransactionTable :transactions="transactions" :chain="chain" />
</template>
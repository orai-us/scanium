<script lang="ts" setup>
import type { Block } from '@cosmjs/tendermint-rpc';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { computed, type PropType } from 'vue';
import { hashTx } from '@/libs';
import { useFormatter } from '@/stores';
import type { DecodedTxRaw } from '@cosmjs/proto-signing';
import TransactionTable from '../TransactionTable.vue';
import { toHex } from '@cosmjs/encoding';

const format = useFormatter();

const props = defineProps({
  value: { type: Object as PropType<Block> },
  chain: { type: String },
  height: {type: String}
});

const txs = computed(() => {
  return (
    props.value?.txs?.map((x) => {
      const tx = {
        hash: hashTx(x),
        tx: {} as DecodedTxRaw,
      };
      try {
        // @ts-ignore
        tx.tx = decodeTxRaw(x);
      } catch { }

      return tx;
    }) || []
  );
});

const transactions = computed(() => {
  return txs.value?.map((item: any) => ({
    txhash: item?.hash,
    result: "Success",
    message: item.tx?.body ? format.messages(item.tx?.body.messages.map((x: any) => ({ '@type': x.typeUrl }))) : '',
    height: props.height,
    fee: `${item?.tx?.authInfo?.fee?.amount[0]?.amount} ${item?.tx?.authInfo?.fee?.amount[0]?.denom?.toUpperCase()}` ,
    timestamp: format.toLocaleDate(item?.timestamp)
  }));
})

</script>
<template>
  <TransactionTable :transactions="transactions" :chain="chain" />
</template>

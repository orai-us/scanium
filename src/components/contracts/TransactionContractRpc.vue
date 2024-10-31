<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { PageRequest } from '@/types';
import { useBlockchain, useFormatter } from '@/stores';
import type { ExtraTxSearchResponse } from '@/libs/client';
import TransactionTable from '../TransactionTable.vue';
import { shortenTxHash } from '@/utils';
import { toHex } from '@cosmjs/encoding';

const props = defineProps(['address','chain']);

const chainStore = useBlockchain();
const format = useFormatter();
const txs = ref<ExtraTxSearchResponse>({ txs: [], totalCount: 0 });
const page = ref(new PageRequest());

onMounted(() => {
  console.log("Running...")
  chainStore.rpc
    .getTxs(
      [
        {
          key: 'wasm._contract_address',
          value: props.address,
        },
      ],
      page.value
    )
    .then((res) => {
      txs.value = res;
    });
});

function pageload(pageNum: number) {
  page.value.setPage(pageNum);
  chainStore.rpc
    .getTxs(
      [
        {
          key: 'wasm._contract_address',
          value: props.address,
        },
      ],
      page.value
    )
    .then((res) => {
      txs.value = res;
    });
}

const transactions = computed(() => {
  return txs?.value?.txs?.map((item: any) => ({
    txhash: shortenTxHash(toHex(item?.hash)),
    result: "Success",
    message: format.messages(item?.txRaw.body.messages),
    height: item?.height,
    fee: item?.fee || 0,
    timestamp: format.toLocaleDate(item?.timestamp)
  }));
})
</script>

<template>
  <TransactionTable :transactions="transactions" :chain="chain" :txTotal="txs?.totalCount" :limit="page.limit"
    :handlePagination="pageload" />
</template>
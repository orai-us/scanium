<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';

import TransactionTable from "../TransactionTable.vue";
import { labelInOutTxs } from "@/utils";
import { countTxsByAccount, getListTxByTxHashes, getTxsByAccount, ParamsGetTx } from "@/service/transactionsService";
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(['txs', 'chain', 'address']);

const route = useRoute();
const router = useRouter();
const transactions = ref([]);
const txByTxHashes = ref([] as Array<any>);
const txsMerge = ref([] as Array<any>);
const totalCount = ref();
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsByAccount(props.address, pagination);
    if (res) {
      transactions.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountTxs() {
  try {
    const res = await countTxsByAccount(props.address);
    if (res) {
      totalCount.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}

onMounted(() => {
  fetchCountTxs();
});

watchEffect(() => {
  fetchTxs(pagination.value);
});

async function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page } });
}

// parse massage txs
const txHashes = computed(() => {
  return transactions.value?.map((tx: any) => tx.id);
});

async function fetchListTxByTxHashes (txHashes: Array<any>){
  try {
    const res = await getListTxByTxHashes(txHashes);
    if (Array.isArray(res?.data)) {
      txByTxHashes.value = res.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

watch(() => txHashes.value, () => {
  if (Array.isArray(txHashes.value))
    fetchListTxByTxHashes(txHashes.value)
})

watch([() => transactions.value, () => txByTxHashes.value], () => {
  if (Array.isArray(transactions.value) && Array.isArray(txByTxHashes.value)) {
    const data = transactions.value.map((txOptimal: any) => {
      const searchTx = txByTxHashes.value.find((txIndexer: any) => txIndexer.id === txOptimal.id);
      const nodes = searchTx?.transactionMessages?.map((item: any) => ({ subType: item.subType, type: item.type }));
      const messages = { nodes }
      const tokenTransfers = searchTx?.tokenTransfers;

        return {
          ...txOptimal,
          messages,
          tokenTransfers
        };
      });
      txsMerge.value = labelInOutTxs(data, props.address)
  }
})

</script>
<template>
  <div>
    <div>
      <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="totalCount" :pagination="pagination"
        :handlePagination="handlePagination" :displayStatus="true" :page="pagination.page" />
    </div>
  </div>
</template>

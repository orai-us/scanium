<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

import TransactionTable from "../TransactionTable.vue";
import { formatNumber } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { countTxsByDenom, getListTxByTxHashes, getTxsByDenom, mergeTxsOptimalAndIndexer, ParamsGetTx } from '@/service/transactionsService';

const props = defineProps(['denom', 'chain']);

const route = useRoute();
const router = useRouter();
const transactions = ref();
const totalCount = ref(0);
const txByTxHashes = ref([] as Array<any>);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});
const denom = computed(() => {
  if (props.denom?.includes("cw20:")) {
    return props.denom.split("cw20:")[1];
  }
  return props.denom;
})
const loadingCountTxs = ref(true);

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsByDenom(encodeURIComponent(denom.value), pagination);
    if (res) {
      transactions.value = res.data;
    }

  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountTxs() {
  try {
    loadingCountTxs.value = true;
    const res = await countTxsByDenom(encodeURIComponent(denom.value));
    if (res) {
      totalCount.value = res.data;
    }
    loadingCountTxs.value = false;
  } catch (error) {
    loadingCountTxs.value = false;
  }
}

onMounted(() => {
  fetchCountTxs();
});

watchEffect(() => {
  fetchTxs(pagination.value);
});

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page } });
}

//Get message txs
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

const txsMerge = computed(() => {
  const txsOptimal = transactions.value;
  const txsIndexer = txByTxHashes.value;

  return mergeTxsOptimalAndIndexer(txsOptimal, txsIndexer);
})

</script>

<template>
  <div>
    <div class="mb-3" v-if="!loadingCountTxs">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ formatNumber(totalCount || 0)
          }}</span>
        transactions</span>
    </div>
    <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="totalCount" :pagination="pagination"
      :handlePagination="handlePagination" :page="pagination.page" />
  </div>
</template>

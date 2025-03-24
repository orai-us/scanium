<script lang="ts" setup>
import { computed, ref, watch, watchEffect } from 'vue';
import TransactionTable from "../TransactionTable.vue";
import { countTxsOnContract, getListTxByTxHashes, getTxsOnContract, ParamsGetTx } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import { labelInOutTxs } from '@/utils';

const props = defineProps(['txs', 'chain', 'address']);
const route = useRoute();
const router = useRouter();

// Transaction in contract
const transactions = ref([]);
const txTotal = ref();
const currentPage = ref(1);
const txByTxHashes = ref([] as Array<any>);
const pagination = computed(() => {
  // const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page: currentPage.value,
    limit: 10,
  };
});

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsOnContract(props.address, pagination);
    if (res) {
      transactions.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}


async function fetchCountTxs() {
  try {
    const res = await countTxsOnContract(props.address);
    if (res) {
      txTotal.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}

// onMounted(() => {
//   fetchCountTxs();
// });

watchEffect(() => {
  fetchTxs(pagination.value);
});

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

  const data = txsOptimal?.map((txOptimal: any) => {
    const searchTx = txsIndexer?.find((txIndexer: any) => txIndexer.id === txOptimal.id);
    const transactionMessages = searchTx?.transactionMessages;

    return {
      ...txOptimal,
      messages:{
        nodes: transactionMessages
      },
    };
  });

  return labelInOutTxs(data, props.address);
});

async function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page } });
}

function handlePrevious() {
  let page = currentPage.value;
  if (page == 1) return;
  currentPage.value = page - 1;
}

function handleNext() {
  let page = currentPage.value;
  currentPage.value = page + 1;
}

</script>
<template>
  <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="txTotal" :limit="pagination.limit"
    :handlePagination="handlePagination" />
  <div class="flex items-center justify-center w-full mt-5">
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-s-lg w-20 border-r-2 border-[#383B40]" v-on:click="handlePrevious">Previous</button>
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-e-lg w-20" v-on:click="handleNext">Next</button>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';

import AssetTransferTable from "./AssetTransferTable.vue";

import { formatNumber } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { countTokenTransfersByDenom, getListTxByTxHashes, getTokenTransfersByDenom, mergeTxsOptimalAndIndexer, ParamsGetTx } from '@/service/transactionsService';

const props = defineProps(['denom', 'chain']);

const route = useRoute();
const router = useRouter();
const tokenTransfers = ref();
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

async function fetchTokenTransfers(pagination: ParamsGetTx) {
  try {
    const res = await getTokenTransfersByDenom(encodeURIComponent(denom.value), pagination);
    if (res) {
      tokenTransfers.value = res.data;
    }

  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountTxs() {
  try {
    loadingCountTxs.value = true;
    const res = await countTokenTransfersByDenom(encodeURIComponent(denom.value));
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
  fetchTokenTransfers(pagination.value);
});

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page } });
}

//Get message txs
const txHashes = computed(() => {
  return Array.from(new Set(tokenTransfers.value?.map((tx: any) => tx.transactionId)));
});

async function fetchListTxByTxHashes(txHashes: Array<any>) {
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
  return tokenTransfers.value.map((tokenTransfer: any) => {
    const tx = txByTxHashes.value.find((tx: any) => tx.id === tokenTransfer.transactionId);

    if (tx) {
      tokenTransfer.messages = tx.transactionMessages;
    }
    return tokenTransfer;
  });
})

</script>

<template>
  <div>
    <div class="mb-3" v-if="!loadingCountTxs">
      <span class="text-white font-bold">{{ $t('assets.total_assets') }} <span class="text-[#CBAEFF]">{{
        formatNumber(totalCount || 0)
          }}</span>
        {{ $t('assets.transfers') }}</span>
    </div>

    <AssetTransferTable :transfers="txsMerge" :chain="chain" :txTotal="totalCount" :pagination="pagination"
      :handlePagination="handlePagination" :page="pagination.page" :denom="denom" />
  </div>
</template>

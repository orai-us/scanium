<script lang="ts" setup>
import { useBlockchain } from '@/stores';
import { computed, reactive, ref, watchEffect } from 'vue';
import HolderAssetComponent from './HolderAssetComponent.vue';
import { getHolderAssetsCw20 } from '@/service/assetsService';

const props = defineProps(["denom", "chain", "currentPrice", "decimals"]);
const holders = ref([] as Array<any>);
const pagination = reactive({
  page: 0,
  limit: 10,
});
const totalHolder = ref(0 as any);
const loading = ref(true);
const searchQuery = ref("");

const cw20Address = computed(() => {
  return props.denom.split("cw20:")[1];
});
async function fetchHoldersAsset() {
  try {
    const res = await getHolderAssetsCw20({ ...pagination, cw20Address: cw20Address.value });
    const data = res.data;
    holders.value = data.map((item: any) => ({ address: item.address, amount: item.amount }));
    totalHolder.value = res.options.totalResults;
    loading.value = false;
  } catch (error) {
    console.log({ error })
  }
}

watchEffect(() => {
  fetchHoldersAsset();
});

function handlePagination(page: number) {
  pagination.page = page;
}
function handleSearch() {

}
</script>
<template>
  <HolderAssetComponent :owners="holders" :chain="chain" :loading="loading" :totalHolder="totalHolder"
    :currentPrice="currentPrice" :limit="pagination.limit" :handlePagination="handlePagination"
    :searchQuery="searchQuery" @search="handleSearch" />
</template>

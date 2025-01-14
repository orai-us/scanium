<script lang="ts" setup>
import { computed, reactive, ref, watchEffect } from 'vue';
import HolderAssetComponent from './HolderAssetComponent.vue';
import { getHolderAssetsCw20 } from '@/service/assetsService';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(["denom", "chain", "currentPrice", "decimals"]);
const route = useRoute();
const router = useRouter();
const holders = ref([] as Array<any>);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});
const totalHolder = ref(0 as any);
const loading = ref(true);
const searchQuery = ref();

const cw20Address = computed(() => {
  return props.denom.split("cw20:")[1];
});

async function fetchHoldersAsset() {
  try {
    const res = await getHolderAssetsCw20({ ...pagination.value, cw20Address: cw20Address.value, address: searchQuery.value });
    const data = res.data;
    holders.value = data.map((item: any) => ({ address: item.address, amount: item.amount }));
    totalHolder.value = res.options.totalResults;
    loading.value = false;
  } catch (error) {
    console.log({ error })
    loading.value = false;
  }
}

watchEffect(() => {
  fetchHoldersAsset();
});

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page } });
}

function handleSearch(keyword: string) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page: 1 } });
  searchQuery.value = keyword.length ? keyword : null;
}

</script>
<template>
  <HolderAssetComponent :owners="holders" :chain="chain" :loading="loading" :totalHolder="totalHolder"
    :currentPrice="currentPrice" :limit="pagination.limit" :handlePagination="handlePagination"
    :searchQuery="searchQuery" @search="handleSearch" :page="pagination.page" />
</template>

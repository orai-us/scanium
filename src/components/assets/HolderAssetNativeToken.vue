<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { getHolderAssetsNativeToken } from "@/service/assetsService";
import { useBlockchain } from '@/stores';
import HolderAssetComponent from './HolderAssetComponent.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const chainStore = useBlockchain();
const endpointAddress = chainStore.connErr || chainStore.endpoint.address;
const props = defineProps(["denom", "chain", "currentPrice", "decimals"]);
const ownersAll = ref([] as Array<any>);
const ownersSearch = ref([] as Array<any>);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  const offset = (page - 1) * 10;
  return {
    offset,
    limit: 10,
    page
  };
});
const totalHolder = ref(0 as any);
const loading = ref(true);
const searchQuery = ref("");

onMounted(async () => {
  try {
    const res = await getHolderAssetsNativeToken({ offset: 0, limit: 1 }, props.denom, endpointAddress);
    totalHolder.value = Number(res.pagination?.total);
    const assetsPromise = [];
    const denomOwners = [];
    for (let i = 0; i < totalHolder.value; i += 1000) {
      const res = getHolderAssetsNativeToken({ offset: i, limit: 1000 }, props.denom, endpointAddress).then((res) => res.denomOwners);
      assetsPromise.push(res);
    }
    const resDenomOwners = await Promise.all(assetsPromise);
    for (let denomOwner of resDenomOwners) {
      for (let item of denomOwner) {
        denomOwners.push(item);
      }
    }
    const denomOwnersSort = denomOwners.sort((itemA, itemB) => {
      if (Number(itemA.balance.amount) >= Number(itemB.balance.amount)) return -1;
      else return 1;
    });
    ownersSearch.value = denomOwnersSort;
    ownersAll.value = denomOwnersSort
  } catch (error) {
    console.log({ error });
  } finally {
    loading.value = false;
  }
});

const owners = computed(() => {
  const result =  ownersSearch.value.slice(pagination.value.offset, pagination.value.offset + pagination.value.limit);
  return result.map((item) => ({ address: item.address, amount: item.balance?.amount }));
});

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page } });
}

const handleSearch=(keyword: string)=>{
  handlePagination(1);
  searchQuery.value = keyword;
  const keywordSearch = keyword.toLowerCase();
  if (keywordSearch.length === 0) ownersSearch.value = ownersAll.value;
  const ownersFilter = ownersAll.value.filter((item) => item.address?.toLowerCase().includes(keywordSearch));
  totalHolder.value = ownersFilter.length;
  ownersSearch.value = ownersFilter;
}

</script>
<template>
  <HolderAssetComponent :owners="owners" :chain="chain" :loading="loading" :totalHolder="totalHolder"
    :currentPrice="currentPrice" :limit="pagination.limit" :handlePagination="handlePagination" :searchQuery="searchQuery" @search="handleSearch" :page="pagination.page" />
</template>

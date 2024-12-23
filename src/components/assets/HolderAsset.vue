<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue';
import Pagination from "@/components/pagination/Pagination.vue";
import { formatNumber } from "@/utils";
import { getListHolderAssets } from "@/service/assetsService";
import { useBlockchain } from '@/stores';

const chainStore = useBlockchain();
const endpointAddress = chainStore.connErr || chainStore.endpoint.address;
const props = defineProps(["denom", "chain", "currentPrice", "decimals"]);
const ownersAll = ref([] as Array<any>);
const ownersSearch = ref([] as Array<any>);
const pagination = reactive({
  offset: 0,
  limit: 10,
});
const totalHolder = ref(0 as any);
const loading = ref(true);
const searchQuery = ref("");

onMounted(async () => {
  try {
    const res = await getListHolderAssets({ offset: 0, limit: 1 }, props.denom, endpointAddress);
    totalHolder.value = Number(res.pagination?.total);
    const assetsPromise = [];
    const denomOwners = [];
    for (let i = 0; i < totalHolder.value; i += 1000) {
      const res = getListHolderAssets({ offset: i, limit: 1000 }, props.denom, endpointAddress).then((res) => res.denomOwners);
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
  return ownersSearch.value.slice(pagination.offset, pagination.offset + pagination.limit);
});

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}

watch(searchQuery, () => {
  handlePagination(1);
  const keyword = searchQuery.value.toLowerCase();
  if (keyword.length === 0) ownersSearch.value = ownersAll.value;
  const ownersFilter = ownersAll.value.filter((item) => item.address?.toLowerCase().includes(keyword));
  totalHolder.value = ownersFilter.length;
  ownersSearch.value = ownersFilter;
})

</script>
<template>
  <div>
    <div class="mb-3 flex flex-row justify-between items-center mt-2">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ formatNumber(totalHolder || 0)
          }}</span> holders</span>
        <input
        class="input w-[300px] !input-bordered bg-base text-[14px] font-normal h-[44px] focus:outline-none text-white"
        v-model="searchQuery" placeholder="Search by Address" />
    </div>
    <div v-if="!loading">
      <table class="table w-full text-sm" v-if="owners.length > 0">
        <thead>
          <tr>
            <th class="text-white font-bold text-sm">Address</th>
            <th class="text-white font-bold text-sm text-right">Amount</th>
            <th class="text-white font-bold text-sm text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(owner, index) in owners" :key="index">
            <td>
              <RouterLink :to="`/${chain}/account/${owner.address}`" class="text-primary dark:text-link">
                {{ owner.address }}
              </RouterLink>
            </td>
            <td class="text-right">
              <span v-if="owner.balance?.amount / Math.pow(10, 6) >= 0.00001">{{ (owner.balance?.amount / Math.pow(10,
                6)).toLocaleString("en-US", {}) }}</span>
              <span v-else>{{ `< 0.00001` }} </span>
            </td>
            <td class="text-right">
              <span v-if="owner.balance?.amount / Math.pow(10, 6) * currentPrice > 0.00001">$ {{
                formatNumber(owner.balance?.amount / Math.pow(10, 6) * currentPrice) }}</span>
              <span v-else>{{ `< 0.00001` }} </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 text-center" v-if="totalHolder">
        <Pagination :totalItems="totalHolder" :limit="pagination.limit" :onPagination="handlePagination" />
      </div>
    </div>
    <div v-else class="w-full h-[200px] flex items-center justify-center">
      <div class="loading loading-spinner loading-lg !text-gray-400"></div>
    </div>
  </div>
</template>

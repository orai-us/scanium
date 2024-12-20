<script lang="ts" setup>
import { reactive, ref, watchEffect } from 'vue';
import Pagination from "@/components/pagination/Pagination.vue";
import { formatNumber } from "@/utils";
import { getListHolderAssets } from "@/service/assetsService";
import { useBlockchain } from '@/stores';

const chainStore = useBlockchain();
const endpointAddress = chainStore.connErr || chainStore.endpoint.address;
const props = defineProps(["denom", "chain", "currentPrice", "decimals"]);
const owners = ref([] as Array<any>);
const pagination = reactive({
  offset: 0,
  limit: 10,
});
const totalHolder = ref(0 as any);

watchEffect(async () => {
  try {
    const res = await getListHolderAssets(pagination, props.denom, endpointAddress);
    owners.value = res.denomOwners;
    totalHolder.value = Number(res.pagination?.total);
  } catch (error) {
    console.log({ error });
  }
});

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}
</script>
<template>
  <div>
    <div class="mb-3">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ formatNumber(totalHolder || 0) }}</span> holders</span>
    </div>
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
</template>

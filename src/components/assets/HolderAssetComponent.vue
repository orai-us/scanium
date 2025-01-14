<script lang="ts" setup>
import { formatNumber } from "@/utils";
import Pagination from "../pagination/Pagination.vue";

const props = defineProps(["owners", "totalHolder", "loading", "chain", "currentPrice", "limit", 'handlePagination', 'searchQuery']);
const emit = defineEmits(['search']);

const handleSearch = (event: any) => {
  emit('search', event?.target?.value);
};
</script>
<template>
  <div>
    <div class="mb-3 flex xl:flex-row flex-col justify-between xl:items-center mt-2 gap-2">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ formatNumber(totalHolder || 0)
          }}</span> holders</span>
      <input
        class="input w-[300px] !input-bordered bg-base text-[14px] font-normal h-[44px] focus:outline-none text-white"
        :value="searchQuery" placeholder="Search by Address" @input="handleSearch" />
    </div>
    <div v-if="!loading">
      <div class="overflow-x-auto">
        <table class="table w-full text-sm" v-if="owners.length > 0">
          <thead>
            <tr>
              <th class="text-white font-bold text-sm">Address</th>
              <th class="text-white font-bold text-sm text-right">Amount</th>
              <th class="text-white font-bold text-sm text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(owner, index) in owners" :key="owner.address">
              <td>
                <div class="w-[150px] break-words truncate xl:w-fit">
                  <RouterLink :to="`/${chain}/account/${owner.address}`"
                    class="text-primary dark:text-link">
                    {{ owner.address }}
                  </RouterLink>
                </div>
              </td>
              <td class="text-right truncate">
                <span v-if="owner.amount / Math.pow(10, 6) >= 0.00001">{{ (owner.amount /
                  Math.pow(10, 6)).toLocaleString("en-US", {}) }}</span>
                <span v-else>{{ `< 0.00001` }} </span>
              </td>
              <td class="text-right truncate">
                <span v-if="owner.amount / Math.pow(10, 6) * currentPrice > 0.00001">$ {{
                  formatNumber(owner.amount / Math.pow(10, 6) * currentPrice) }}</span>
                <span v-else>{{ `< 0.00001` }} </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-center" v-if="totalHolder">
        <Pagination :totalItems="totalHolder" :limit="limit" :onPagination="handlePagination" />
      </div>
    </div>
    <div v-else class="w-full h-[200px] flex items-center justify-center">
      <div class="loading loading-spinner loading-lg !text-gray-400"></div>
    </div>
  </div>
</template>

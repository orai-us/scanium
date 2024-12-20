<script lang="ts" setup>
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import {
  QueryClient,
  setupBankExtension,
} from "@cosmjs/stargate";
import {
  QueryDenomOwnersRequest,
  QueryDenomOwnersResponse,
} from "cosmjs-types/cosmos/bank/v1beta1/query";
import { reactive, ref, watchEffect } from 'vue';
import Pagination from "@/components/pagination/Pagination.vue";
import { formatNumber } from "@/utils";

const props = defineProps(["denom", "chain", "currentPrice"]);
const owners = ref([] as Array<any>);
const pagination = reactive({
  offset: 0,
  limit: 10,
});
const totalHolder = ref(0 as any);

watchEffect(async () => {
  try {
    const { offset, limit } = pagination;
    const cometClient = await Tendermint37Client.connect("https://rpc.orai.io");
    const queryClient = QueryClient.withExtensions(
      cometClient as any,
      setupBankExtension,
    );
    const requestData = Uint8Array.from(
      QueryDenomOwnersRequest.encode(
        QueryDenomOwnersRequest.fromPartial({ denom: props.denom, pagination: { offset: BigInt(offset), limit: BigInt(limit) } })
      ).finish()
    );
    const { value } = await queryClient.queryAbci(
      "/cosmos.bank.v1beta1.Query/DenomOwners",
      requestData
    );
    const res = QueryDenomOwnersResponse.decode(value);
    owners.value = res.denomOwners;
    totalHolder.value = res.pagination?.total;
  } catch (error) {
    console.log({ error });
  }
});

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}
</script>
<template>
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
            formatNumber(owner.balance?.amount / Math.pow(10, 6) * currentPrice)}}</span>
          <span v-else>{{ `< 0.00001` }} </span>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="mt-4 text-center" v-if="totalHolder">
    <Pagination :totalItems="totalHolder" :limit="pagination.limit" :onPagination="handlePagination" />
  </div>
</template>

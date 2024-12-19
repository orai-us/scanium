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

const props = defineProps(["denom", "chain"]);
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
    console.log({ res })
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
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
    <div class="text-white font-bold text-lg">Holder</div>
    <div class="w-full h-[1px] bg-base-300"></div>
    <table class="table w-full text-sm" v-if="owners.length > 0">
      <thead>
        <tr>
          <th class="text-white font-bold text-sm">Address</th>
          <th class="text-white font-bold text-sm">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(owner, index) in owners" :key="index">
          <td>
            <RouterLink :to="`/${chain}/account/${owner.address}`" class="text-primary dark:text-link">
              {{ owner.address }}
            </RouterLink>
          </td>
          <td>
            <span v-if="owner.balance?.amount / Math.pow(10, 6) >= 0.00001">{{ (owner.balance?.amount / Math.pow(10,
              6)).toLocaleString("en-US", {}) }}</span>
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

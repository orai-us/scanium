<script lang="ts" setup>
import { computed, onMounted, reactive, ref, toRaw, watchEffect } from 'vue';

import { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import {
  QueryClient,
  setupBankExtension,
} from "@cosmjs/stargate";
import {
  QueryDenomsMetadataResponse,
  QueryDenomsMetadataRequest,
} from "cosmjs-types/cosmos/bank/v1beta1/query";
import { getListAsset, getPriceByIds } from '@/service/assetsService';
import { LIST_COIN } from '@/constants';
import { formatNumber, shortenDenom } from '@/utils';
import Pagination from '@/components/pagination/Pagination.vue';

const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

const assetsAll = ref([] as Array<any>);
const priceTokens = ref({} as any);
const pagination = reactive({
  limit: 10,
  offset: 0
})

onMounted(async () => {
  const cometClient = await Tendermint37Client.connect("https://rpc.orai.io");
  const queryClient = QueryClient.withExtensions(
    cometClient as any,
    setupBankExtension,
  );
  const requestData = Uint8Array.from(
    QueryDenomsMetadataRequest.encode(
      QueryDenomsMetadataRequest.fromPartial({})
    ).finish()
  );
  const { value } = await queryClient.queryAbci(
    "/cosmos.bank.v1beta1.Query/DenomsMetadata",
    requestData
  );
  const bankAssets = QueryDenomsMetadataResponse.decode(value);
  const registryAssets = await getListAsset("oraichain");
  const assets = [...bankAssets.metadatas, ...registryAssets];
  
  const assetsSupported = assets.filter(item => item.logo_URIs && item.symbol.length && coingeckoSymbols.includes(item.symbol.toLowerCase()))
  .map(asset => ({ ...asset, id: asset.denom_units ? coingeckoIds[coingeckoSymbols.indexOf(asset.denom_units?.slice(-1)[0].denom.toLowerCase())] : coingeckoIds[coingeckoSymbols.indexOf(asset.denomUnits?.slice(-1)[0].denom.toLowerCase())] }));
  const assetsUnSupported = assets.filter(item=>  !(item.logo_URIs && item.symbol && coingeckoSymbols.includes(item.symbol.toLowerCase())));
  assetsAll.value = [...assetsSupported, ...assetsUnSupported];

  const ids = assetsSupported.map((item:any) => item?.id);
  if (ids?.length > 0) {
    const res = await getPriceByIds({ ids: ids.join(",")});
    priceTokens.value = res;
  }
});

const totalAssets = computed(() => { return assetsAll.value.length; })

watchEffect(()=>{
  console.log({ data: toRaw(assetsAll.value) });
})

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}

const assets = computed(()=>{
  return assetsAll.value.slice(pagination.offset, pagination.offset + pagination.limit);
})


</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex xl:gap-5 gap-2 flex-col">
    <div class="text-white font-bold text-lg">Assets Dashboard</div>
    <table class="table w-full text-sm" v-if="assets.length > 0">
      <thead>
        <tr>
          <th class="text-white font-bold text-sm">Name</th>
          <th class="text-white font-bold text-sm">Denom</th>
          <th class="text-white font-bold text-sm">Price</th>
          <th class="text-white font-bold text-sm">24h Change</th>
          <th class="text-white font-bold text-sm">24h Vol</th>
          <th class="text-white font-bold text-sm">Market Cap</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(v, index) in assets" :key="index">
          <td>
            <div class="flex flex-row items-center gap-3">
              <img :src="v.logo_URIs?.png || v.logo_URIs?.svg" alt="img" v-if="v.logo_URIs?.png || v.logo_URIs?.svg"
                class="w-8 h-8 rounded-full border border-blue-100 bg-white" />
              <div v-else class="w-8 h-8 rounded-full border border-blue-100 bg-white"></div>
              <span class="text-white text-sm" v-if="v.symbol">{{ shortenDenom(v.symbol) }}</span>
              <span v-else>-</span>
            </div>
          </td>
          <td>
            <span class="text-white" v-if="v.base">{{ shortenDenom(v.base) }}</span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.usd" class="text-white">
              {{ formatNumber(priceTokens[v.id].usd) }} $
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.usd_24h_change" class="text-white">
              {{ priceTokens[v.id].usd_24h_change.toFixed(2) }} %
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.usd_24h_vol" class="text-white">
              {{ formatNumber(priceTokens[v.id].usd_24h_vol) }} $
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.usd_market_cap" class="text-white">
              {{ formatNumber(priceTokens[v.id].usd_market_cap) }} $
            </span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 text-center" v-if="totalAssets">
      <Pagination :totalItems="totalAssets" :limit="pagination.limit" :onPagination="handlePagination" />
    </div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'assets',
      order: 7
    }
  }
</route>

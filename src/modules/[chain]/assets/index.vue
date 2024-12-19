<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import {
  QueryClient,
  setupBankExtension,
} from "@cosmjs/stargate";
import {
  QueryDenomsMetadataResponse,
  QueryDenomsMetadataRequest,
} from "cosmjs-types/cosmos/bank/v1beta1/query";
import { getInfoToken, getListAsset } from '@/service/assetsService';
import { LIST_COIN } from '@/constants';
import { formatNumber, shortenDenom } from '@/utils';
import Pagination from '@/components/pagination/Pagination.vue';
import TooltipComponent from '@/components/TooltipComponent.vue';
import router from '@/router';

const props = defineProps(["chain"]);

const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

const assetsAll = ref([] as Array<any>);
const assetsSearch = ref([] as Array<any>);
const priceTokens = ref({} as any);
const pagination = reactive({
  limit: 10,
  offset: 0
});
const searchQuery = ref("");

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
  const assetsUnSupported = assets.filter(item => !(item.logo_URIs && item.symbol && coingeckoSymbols.includes(item.symbol.toLowerCase())));
  assetsAll.value = [...assetsSupported, ...assetsUnSupported];
  assetsSearch.value = [...assetsSupported, ...assetsUnSupported];
  const ids = assetsSupported.map((item: any) => item?.id);
  if (ids?.length > 0) {
    try {
      const res = await getInfoToken({ ids: ids.join(",") });
      const prices: any = {};
      for (let item of res) {
        prices[item.id] = item;
      }
      priceTokens.value = prices;
    } catch (error) {
      console.log({ error });
    }
  }
});

const totalAssets = computed(() => { return assetsSearch.value.length; });

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}

const assets = computed(() => {
  return assetsSearch.value.slice(pagination.offset, pagination.offset + pagination.limit);
});

function searchAssets() {
  handlePagination(1);
  const keyword = searchQuery.value.toLowerCase();
  if (keyword.length === 0) assetsSearch.value = assetsAll.value;
  assetsSearch.value = assetsAll.value.filter((item) => item.symbol?.toLowerCase().includes(keyword) || item.base?.toLowerCase().includes(keyword));
}

</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
    <div class="text-white font-bold text-lg">Assets Dashboard</div>
    <div class="w-full h-[1px] bg-base-300"></div>
    <div class="flex flex-row justify-between items-center mt-2 mb-2">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ totalAssets }}</span> Assets</span>
      <input
        class="input w-[300px] !input-bordered bg-base text-[14px] font-normal h-[44px] focus:outline-none text-white"
        v-model="searchQuery" placeholder="Search by Name, Denom" v-on:keyup.enter="searchAssets" />
    </div>

    <table class="table w-full text-sm" v-if="assets.length > 0">
      <thead>
        <tr>
          <th class="text-white font-bold text-sm">Name</th>
          <th class="text-white font-bold text-sm">Denom</th>
          <th class="text-white font-bold text-sm">Price</th>
          <th class="text-white font-bold text-sm">Total Supply</th>
          <th class="text-white font-bold text-sm">Circulating Supply</th>
          <th class="text-white font-bold text-sm">Market Cap</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(v, index) in assets" :key="index" class="cursor-pointer" @click="router.push(`/${chain}/assets/${v.base}`)">
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
            <TooltipComponent :value="shortenDenom(v.base)" :description="v.base" :copyValue="v.base" />
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.current_price" class="text-white">
              {{ formatNumber(priceTokens[v.id].current_price) }} $
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.total_supply" class="text-white">
              {{ formatNumber(priceTokens[v.id].total_supply) }}
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.circulating_supply" class="text-white">
              {{ formatNumber(priceTokens[v.id].circulating_supply) }}
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="priceTokens[v.id]?.market_cap" class="text-white">
              {{ formatNumber(priceTokens[v.id].market_cap) }} $
            </span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="w-full h-full justify-center items-center">
      No Assets
    </div>
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

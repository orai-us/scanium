<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { getListAssetOnChainAndRegistry, getPriceByIds } from '@/service/assetsService';
import { LIST_COIN } from '@/constants';
import { formatNumber, shortenDenom } from '@/utils';
import Pagination from '@/components/pagination/Pagination.vue';
import TooltipComponent from '@/components/TooltipComponent.vue';
import { useBlockchain } from '@/stores';
import { useRoute, useRouter } from 'vue-router';

const chainStore = useBlockchain();
const endpointAddress = chainStore.connErr || chainStore.endpoint.address;
const props = defineProps(["chain"]);

const route = useRoute();
const router = useRouter();
const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

const assetsAll = ref([] as Array<any>);
const assetsSearch = ref([] as Array<any>);
const priceTokens = ref({} as any);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  const offset = (page - 1) * 10;
  return {
    offset,
    limit: 10,
    page
  };
});
const searchQuery = ref("");

onMounted(async () => {
  try {
    const assets = await getListAssetOnChainAndRegistry(endpointAddress, props.chain);
    const assetsSupported = assets.filter(item => item.logo_URIs && item.symbol.length && coingeckoSymbols.includes(item.symbol.toLowerCase()))
      .map(asset => ({ ...asset, id: coingeckoIds[coingeckoSymbols.indexOf(asset.display.toLowerCase())] }));

    assetsAll.value = assetsSupported;
    assetsSearch.value = assetsSupported;

    const ids = assetsSupported.map((item: any) => item?.id);

    if (ids?.length > 0) {
      try {
        const res = await getPriceByIds({ ids: ids.join(",") });
        priceTokens.value = res;
      } catch (error) {
        console.log({ error });
      }
    }
  } catch (error) {
    console.log({ error });
  }
});

const totalAssets = computed(() => { return assetsSearch.value.length; });

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets`, query: { ...route.query, page } });
}

const assets = computed(() => {
  return assetsSearch.value.slice(pagination.value.offset, pagination.value.offset + pagination.value.limit);
});

watch(searchQuery,()=>{
  handlePagination(1);
  const keyword = searchQuery.value.toLowerCase();
  if (keyword.length === 0) assetsSearch.value = assetsAll.value;
  assetsSearch.value = assetsAll.value.filter((item) => item.symbol?.toLowerCase().includes(keyword) || item.base?.toLowerCase().includes(keyword));
})

</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
    <div class="text-white font-bold text-lg">Assets Dashboard</div>
    <div class="w-full h-[1px] bg-base-300"></div>
    <div class="flex xl:flex-row flex-col justify-between xl:items-center mt-2 mb-2 gap-2">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ totalAssets }}</span> Assets</span>
      <input
        class="input w-[300px] !input-bordered bg-base text-[14px] font-normal h-[44px] focus:outline-none text-white"
        v-model="searchQuery" placeholder="Search by Name, Denom" />
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full text-sm" v-if="assets.length > 0">
        <thead>
          <tr>
            <th class="text-white font-bold text-sm">Name</th>
            <th class="text-white font-bold text-sm text-right"></th>
            <th class="text-white font-bold text-sm text-right">Denom</th>
            <th class="text-white font-bold text-sm text-right">Price</th>
            <!-- <th class="text-white font-bold text-sm text-right">Total Supply</th> -->
            <!-- <th class="text-white font-bold text-sm text-right">Circulating Supply</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(v, index) in assets" :key="v.base" class="cursor-pointer"
            @click="router.push(`/${chain}/assets/${encodeURIComponent(v.base)}?page=1`)">
            <td class="truncate">
              <div class="flex flex-row items-center xl:gap-3 gap-1 min-w-[100px]">
                <img :src="v.logo_URIs?.png || v.logo_URIs?.svg" alt="img" v-if="v.logo_URIs?.png || v.logo_URIs?.svg"
                  class="w-8 h-8 rounded-full border border-blue-100 bg-white" />
                <div v-else class="w-8 h-8 rounded-full border border-blue-100 bg-white"></div>
                <span class="text-white text-sm" v-if="v.symbol">{{ shortenDenom(v.symbol) }}</span>
                <span v-else>-</span>
              </div>
            </td>
            <td class="text-right truncate">
              <div v-if="v.verify">
                <div
                  class="text-xs flex items-center justify-center !bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)] p-2 rounded-lg w-fit">
                  Verified</div>
              </div>
            </td>
            <td class="text-right w-fit truncate">
              <TooltipComponent :value="shortenDenom(v.base)" :description="v.base" :copyValue="v.base" />
            </td>
            <td class="text-right">
              <span v-if="priceTokens[v.id]?.usd" class="text-white">
                $ {{ formatNumber(priceTokens[v.id].usd) }}
              </span>
              <span v-else>-</span>
            </td>
            <!-- <td class="text-right">
              <div v-if="priceTokens[v.id]?.total_supply" class="text-white">
                <div>{{ formatNumber(priceTokens[v.id].total_supply) }}</div>
                <span v-if="priceTokens[v.id]?.current_price" class="text-xs text-gray-400">$ {{
                  formatNumber(priceTokens[v.id].total_supply *
                  priceTokens[v.id].current_price) }}</span>
                <span v-else>-</span>
              </div>
              <span v-else>-</span>
            </td> -->
            <!-- <td class="text-right">
              <div v-if="priceTokens[v.id]?.circulating_supply" class="text-white">
                <div>{{ formatNumber(priceTokens[v.id].circulating_supply) }}
                </div>
                <span v-if="priceTokens[v.id]?.current_price" class="text-xs text-gray-400">$ {{
                  formatNumber(priceTokens[v.id].circulating_supply *
                    priceTokens[v.id].current_price) }}</span>
                <span v-else>-</span>
              </div>
              <span v-else>-</span>
            </td> -->
          </tr>
        </tbody>
      </table>
      <div v-else class="w-full h-full justify-center items-center">
        No Assets
      </div>
    </div>

    <div class="mt-4 text-center" v-if="totalAssets">
      <Pagination :totalItems="totalAssets" :limit="pagination.limit" :onPagination="handlePagination" :page="pagination.page" />
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

<script lang="ts" setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { getInfoToken, getListAssetOnChainAndRegistry } from "@/service/assetsService";
import DetailAsset from "@/components/assets/DetailAsset.vue";
import HolderAsset from "@/components/assets/HolderAsset.vue";
import TransactionsAsset from "@/components/assets/TransactionsAsset.vue";
import { RouterLink, useRoute } from "vue-router";
import { LIST_COIN } from '@/constants';

enum SECTOR {
  TRANSACTIONS = 'transactions',
  HOLDERS = 'holders'
}

const props = defineProps(["denom", "chain"]);

const assets = ref([] as Array<any>);
const asset = ref({} as any);
const route = useRoute();
const sector = computed(() => {
  if (route.query.sector) return route.query.sector;
  else return SECTOR.TRANSACTIONS;
});

const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

onMounted(async () => {
  try {
    assets.value = await getListAssetOnChainAndRegistry();
  } catch (error) {
    console.log({ error });
  }
});
watch([() => props.denom, () => assets.value], async () => {
  const info = assets.value.find((item) => item.base === props.denom);
  const id = info?.coingecko_id || coingeckoIds[coingeckoSymbols.indexOf(info?.display)];
  if (id) {
    const res = await getInfoToken({ ids: id });
    if (Array.isArray(res))
      asset.value = { ...res[0], ...info };
    else asset.value = info;
  } else {
    asset.value = info;
  }
});

</script>
<template>
  <div>
    <DetailAsset :asset="asset" />
    <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
      <div class="flex gap-5">
        <RouterLink :to="`/${chain}/assets/${encodeURIComponent(denom)}?sector=${SECTOR.TRANSACTIONS}`"
          class="font-bold text-lg hover:cursor-pointer"
          :class="{ 'border-b-2 border-[#CBAEFF] text-white': sector === SECTOR.TRANSACTIONS }">
          <div>Transactions</div>
        </RouterLink>
        <RouterLink :to="`/${chain}/assets/${encodeURIComponent(denom)}?sector=${SECTOR.HOLDERS}`"
          class="font-bold text-lg hover:cursor-pointer"
          :class="{ 'border-b-2 border-[#CBAEFF] text-white': sector === SECTOR.HOLDERS }">
          <div>Holders</div>
        </RouterLink>
      </div>
      <div class="w-full h-[1px] bg-base-300"></div>
      <div v-show="sector === SECTOR.TRANSACTIONS">
        <TransactionsAsset :denom="denom" :chain="chain" />
      </div>
      <div v-show="sector === SECTOR.HOLDERS">
        <HolderAsset :denom="denom" :chain="chain" :currentPrice="asset.current_price" />
      </div>
    </div>
  </div>
</template>

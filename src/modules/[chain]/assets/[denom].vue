<script lang="ts" setup>
import { computed, ref, watch, watchEffect } from 'vue';
import { getPriceByIds } from "@/service/assetsService";
import DetailAsset from "@/components/assets/DetailAsset.vue";
import HolderAssetNativeToken from "@/components/assets/HolderAssetNativeToken.vue";
import TransactionsAsset from "@/components/assets/TransactionsAsset.vue";
import { RouterLink, useRoute } from "vue-router";
import { useBlockchain } from '@/stores';
import HolderAssetCw20 from '@/components/assets/HolderAssetCw20.vue';

enum SECTOR {
  TRANSACTIONS = 'transactions',
  HOLDERS = 'holders'
}

const props = defineProps(["denom", "chain"]);

const chainStore = useBlockchain();
const assets = ref([] as Array<any>);
const asset = ref({} as any);
const route = useRoute();
const sector = computed(() => {
  if (route.query.sector) return route.query.sector;
  else return SECTOR.TRANSACTIONS;
});

watchEffect(async () => {
  const chainAssets = chainStore.current?.assets;
  if (Array.isArray(chainAssets))
    assets.value = chainAssets;
});

watch([() => props.denom, () => assets.value], async () => {
  const info = assets.value.find((item) => item.base === props.denom);
  const id = info?.coingecko_id;
  if (id) {
    const res = await getPriceByIds({ ids: id });
    const infoToken = {
      id,
      current_price: res[id]?.usd
    };
    asset.value = { ...infoToken, ...info };
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
        <div v-if="asset?.type_asset === 'cw20'">
          <HolderAssetCw20 :denom="`cw20:${denom}`" :chain="chain" :currentPrice="asset?.current_price" />
        </div>
        <div v-else>
          <HolderAssetNativeToken :denom="denom" :chain="chain" :currentPrice="asset?.current_price" />
        </div>
      </div>
    </div>
  </div>
</template>

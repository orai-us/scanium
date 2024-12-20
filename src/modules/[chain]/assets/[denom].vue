<script lang="ts" setup>
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import {
  QueryClient,
  setupBankExtension,
} from "@cosmjs/stargate";
import {
  QueryDenomsMetadataRequest,
  QueryDenomsMetadataResponse,
} from "cosmjs-types/cosmos/bank/v1beta1/query";
import { computed, onMounted, ref, toRaw, watch, watchEffect } from 'vue';
import { getInfoToken, getListAsset } from "@/service/assetsService";
import DetailAsset from "@/components/assets/DetailAsset.vue";
import HolderAsset from "@/components/assets/HolderAsset.vue";
import TransactionsAsset from "@/components/assets/TransactionsAsset.vue";
import { RouterLink, useRoute } from "vue-router";

enum SECTOR {
  TRANSACTIONS = 'transactions',
  HOLDERS = 'holders'
}

const props = defineProps(["denom", "chain"]);

const assets = ref([] as Array<any>);
const asset = ref({} as any);
const route = useRoute();
const sector = computed(() => { return route.query.sector; });

onMounted(async () => {
  try {
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
    assets.value = [...bankAssets.metadatas, ...registryAssets];
  } catch (error) {
    console.log({ error });
  }
});
watch([() => props.denom, () => assets.value], async () => {
  const info = assets.value.find((item) => item.base === props.denom);
  const id = info?.coingecko_id;
  if (id) {
    const res = await getInfoToken({ ids: id });
    if (Array.isArray(res))
      asset.value = { ...res[0], ...info };
    else asset.value = info;
  } else {
    asset.value = info;
  }
});

watchEffect(() => {
  console.log({ asset: toRaw(asset.value) });
});

</script>
<template>
  <div>
    <DetailAsset :asset="asset" />
    <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
      <div class="flex gap-5">
        <RouterLink :to="`/${chain}/assets/${denom}?sector=${SECTOR.TRANSACTIONS}`"
          class="font-bold text-lg hover:cursor-pointer"
          :class="{ 'border-b-2 border-[#CBAEFF] text-white': sector === SECTOR.TRANSACTIONS }">
          <div>Transactions</div>
        </RouterLink>
        <RouterLink :to="`/${chain}/assets/${denom}?sector=${SECTOR.HOLDERS}`"
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

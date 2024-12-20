<script lang="ts" setup>
import { formatNumber, shortenDenom } from "@/utils";

const props = defineProps(['asset']);

</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-2 flex-col">
    <div class="flex flex-row items-center gap-3">
      <img :src="asset.logo_URIs?.png || asset.logo_URIs?.svg" alt="img" v-if="asset.logo_URIs?.png || asset.logo_URIs?.svg"
        class="w-10 h-10 rounded-full border border-blue-100 bg-white" />
      <div v-else class="w-10 h-10 rounded-full border border-blue-100 bg-white"></div>
      <div>
        <div>
          <span class="text-white text-xl font-bold" v-if="asset.symbol">{{
            shortenDenom(asset.symbol?.toUpperCase())
            }}</span>
          <span v-else>-</span>
        </div>
        <div class="flex flex-row gap-2">
          <div>
            <span v-if="asset.current_price" class="text-white">
              $ {{ formatNumber(asset.current_price) }}
            </span>
            <span v-else>-</span>
          </div>
          <div>
            <span v-if="asset.price_change_24h"
              :class="`${asset.price_change_24h > 0 ? 'text-[#39DD47]' : 'text-error'}`" class="text-[12px]">
              ({{ formatNumber(asset.price_change_24h) }}%)
            </span>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full h-[1px] bg-base-300"></div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-row">
        <div class="w-[200px]">Total Supply</div>
        <span class="text-white font-semibold">{{ formatNumber(asset.total_supply) }} {{
          asset.symbol?.toUpperCase() }}</span>
      </div>
      <div class="flex flex-row">
        <div class="w-[200px]">Fully distributed MC</div>
        <span class="text-white font-semibold">$ {{ formatNumber(asset.total_supply * asset.current_price)
          }}</span>
      </div>
      <div class="flex flex-row">
        <div class="w-[200px]">Circulating Supply</div>
        <span class="text-white font-semibold">{{ formatNumber(asset.circulating_supply) }} {{
          asset.symbol?.toUpperCase() }}</span>
      </div>
      <div class="flex flex-row">
        <div class="w-[200px]">Market cap</div>
        <span class="text-white font-semibold">$ {{ formatNumber(asset.circulating_supply * asset.current_price)
          }}</span>
      </div>
      <div class="flex flex-row">
        <div class="w-[200px]">Decimals</div>
        <span class="text-white font-semibold">{{ asset.denom_units?.slice(-1)[0].exponent }}</span>
      </div>
      <div class="flex flex-row">
        <div class="w-[200px]">Denom</div>
        <span class="text-white font-semibold">{{ asset.denom_units?.slice(-1)[0].denom }}</span>
      </div>

      <div class="flex flex-row">
        <div class="w-[200px]">Description</div>
        <span class="text-white font-semibold">{{ asset.description }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getListAsset } from '@/service/assetsService';
import { useFormatter } from '@/stores';
import type { Coin } from '@/types';
import { ref, toRaw, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  value: { type: Array<Coin> },
});
const route = useRoute();

const format = useFormatter();
const tokens = ref([] as Array<{ denom: string; amount: string; }>);

watchEffect(() => {
  async function fetchName() {
    const assets = await getListAsset(route.params?.chain?.toString());
    const result = [];
    if (props.value) {
      for (let item of props.value) {
        const denom = item.denom;
        const asset = assets.find((asset: any) => asset.base === denom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === denom));
        if (asset) {
          const name = asset.display;
          const denomUnits = asset.denom_units;
          let decimal = 0;
          if (Array.isArray(denomUnits)) {
            decimal = denomUnits.find((denomUnit: any) => denomUnit.denom === name)?.exponent;
          }
          result.push({ denom: name, amount: item.amount, decimal });
        }
      }
      tokens.value = result;
    }
  }
  fetchName();
});


watchEffect(() => {
  console.log({ tokens: toRaw(tokens.value) });
});
</script>
<template>
  <div v-for="(token, key) in tokens" :key="key">
    {{ format.formatTokens([token], true, '0,0.[0000]', '', Math.pow(10, token.decimal)) }}
  </div>
</template>
<script lang="ts">
export default {
  name: 'ArrayCoinElement',
};
</script>

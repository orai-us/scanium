<script lang="ts" setup>
import { useBlockchain } from '@/stores';
import { formatSmallNumber } from '@/utils';
import { ref, watchEffect } from 'vue';

const props = defineProps(['value']);

const symbol = ref("");
let exponent = ref(0);
const blockchain = useBlockchain();

watchEffect(() => {
  if (!!props.value) {
    const assets = blockchain.current?.assets;
    const denom = props.value.denom;
    async function fetchName() {
      const asset = assets?.find((asset: any) => asset.base === denom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === denom));
      if (asset) {
        const symbolToken = asset.symbol;
        const display = asset.display;
        // @ts-ignore
        let decimals = asset.exponent;
        if (!decimals) {
          const denomUnits = asset.denom_units;
          if (Array.isArray(denomUnits)) {
            decimals = denomUnits.find((denomUnit: any) => denomUnit.denom === display)?.exponent;
          }
        }
        symbol.value = symbolToken;
        exponent.value = decimals;
      }
    }
    fetchName();
  }
})

</script>
<template>
  <div class="flex gap-1 xl:text-sm text-[12px]" v-if="!!value">
    <span v-html="formatSmallNumber(Number(value.amount) / 10 ** exponent)"></span>
    <span>{{ symbol }}</span>
  </div>
</template>

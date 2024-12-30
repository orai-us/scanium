<script lang="ts" setup>
import { getListAsset } from '@/service/assetsService';
import axios from 'axios';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps(['value']);

const route = useRoute();
const nameToken = ref("");
let exponent = ref(0);

watchEffect(() => {
  async function fetchName() {
    const denom = props.value["denom"];
    const assets = await getListAsset(route.params?.chain?.toString());
    const asset = assets.find((asset: any) => asset.base === denom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === denom));
    console.log({ asset });
    if (asset) {
      const name = asset.display;
      const denomUnits = asset.denom_units;
      if (Array.isArray(denomUnits)) {
        exponent.value = denomUnits.find((denomUnit: any) => denomUnit.denom === name)?.exponent;
      }
      nameToken.value = name;
    }
  }
  fetchName();
})

</script>
<template>
  <div class="overflow-auto">
    {{ (Number(value["amount"]) / Math.pow(10, exponent)).toLocaleString("en-US", {}) }} {{ nameToken }}
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import { ref, toRaw, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps(['value']);

const route = useRoute();
const nameToken = ref("");
let exponent = ref(0);

watchEffect(() => {
  console.log({amount: toRaw(props.value)})
  async function fetchName() {
    const denom = props.value["denom"];
    if (denom?.includes("/")) {
      const responseRegistry = await axios(`https://registry.ping.pub/${route.params?.chain?.toString().toLowerCase()}/assetlist.json`);
      const assets = responseRegistry.data.assets as Array<any>;
      const asset = assets.find((asset: any) => asset.base === denom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === denom));
      if (asset) {
        const name = asset.display;
        const denomUnits = asset.denom_units;
        exponent.value = denomUnits.find((denomUnit: any) => denomUnit.denom === name)?.exponent;
        nameToken.value = name;
      }
    } else {
      nameToken.value = denom;
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

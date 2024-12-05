<script lang="ts" setup>
import axios from 'axios';
import { ref, watchEffect } from 'vue';


const props = defineProps(['value']);

const nameToken = ref("");

watchEffect(() => {
  async function fetchName() {
    const denom = props.value["denom"];
    console.log({ denom })
    if (denom?.includes("/")) {
      const responseRegistry = await axios(`https://registry.ping.pub/osmosis/assetlist.json`);
      const assets = responseRegistry.data.assets as Array<any>;
      const name = assets.find((asset: any) => asset.base === denom)?.display;
      nameToken.value = name;
    } else {
      nameToken.value = denom;
    }
  }
  fetchName();
})


</script>
<template>
  <div class="overflow-auto">
      {{ Number(value["amount"]).toLocaleString("en-US", {}) }} {{ nameToken }}
  </div>
</template>

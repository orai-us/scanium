<script lang="ts" setup>
import axios from 'axios';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps(['value']);

const route = useRoute();
const nameToken = ref("");

watchEffect(() => {
  async function fetchName() {
    const denom = props.value["denom"];
    if (denom?.includes("/")) {
      const responseRegistry = await axios(`https://registry.ping.pub/${route.params?.chain?.toString().toLowerCase()}/assetlist.json`);
      const assets = responseRegistry.data.assets as Array<any>;
      const name = assets.find((asset: any) => asset.base === denom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === denom))?.display;
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

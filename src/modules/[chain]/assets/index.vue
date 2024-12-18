<script lang="ts" setup>
import { ref } from 'vue';

const assetsRegistry = ref([] as Array<any>)

function fetchAssetsRegistry(){
  const assets = await getList
}

</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex xl:gap-5 gap-2 flex-col">
    <div class="text-white font-bold text-lg">Assets Dashboard</div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'assets',
      order: 7
    }
  }
</route>

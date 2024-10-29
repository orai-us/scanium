<script lang="ts" setup>
import { useIndexModule } from '@/modules/[chain]/indexStore';
import { useBaseStore } from '@/stores';
import { computed, ref, watch, watchEffect } from 'vue';


const indexModule = useIndexModule();
const store = useBaseStore();
const blockTime = ref();

const blockSummary = computed(()=>{
  return indexModule.stats
})

watch(blockSummary, () => {
  const heightNew = blockSummary.value[0]?.stats;
  if (heightNew) {
    const heightPre = Number(heightNew) - 1
    store.fetchBlock(heightPre).then((x) => {
      const block = x?.block;
      const headerBlock = block?.header;
      const time = new Date().getTime() - new Date(headerBlock?.time.toString()).getTime()
      blockTime.value = (time / 1000).toFixed(1) + " s";
    });
  }
})
</script>

<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex gap-5 flex-col">
    <div class="text-white font-bold text-lg">Block Summary</div>
    <div class="grid grid-cols-4 gap-5">
      <div class="border border-[#383B40] rounded-lg p-4 flex flex-col">
        <span>Block Height</span>
        <span class="text-white text-16 font-semibold">{{ !!blockSummary[0]?.stats ? blockSummary[0]?.stats : "-"
          }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex flex-col">
        <span>Bonded Tokens</span>
        <span class="text-white text-16 font-semibold">{{ blockSummary[3]?.stats }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex flex-col">
        <span>Inflation</span>
        <span class="text-white text-16 font-semibold">{{ blockSummary[4]?.stats }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex flex-col">
        <span>Block Time</span>
        <span class="text-white text-16 font-semibold">{{ blockTime ? blockTime : "-" }}</span>
      </div>
    </div>

  </div>
</template>
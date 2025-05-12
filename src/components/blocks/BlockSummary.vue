<script lang="ts" setup>
import { useBaseStore, useFormatter, useMintStore, useStakingStore } from '@/stores';
import { ref, watch } from 'vue';

const staking = useStakingStore();
const store = useBaseStore();
const blockTime = ref();
const formatter = useFormatter();
const props = defineProps(['chain']);
const mintStore = useMintStore();

watch(store, async () => {
  const heightNew = Number(store?.latest?.block?.header?.height);
  if (heightNew > 5) {
    const heightOld = Number(heightNew) - 5;
    const [blockOld, blockNew] = await Promise.all([
      store.fetchBlock(heightOld),
      store.fetchBlock(heightNew),
    ])
    const blockTimeNew = new Date(blockNew.block?.header?.time?.toString()).getTime();
    const blockTimeOld = new Date(blockOld.block?.header?.time?.toString()).getTime();

    blockTime.value = (blockTimeNew - blockTimeOld) / 5000 + " s"
  }
})

</script>

<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl p-5 flex xl:gap-5 gap-2 flex-col">
    <div class="text-white font-bold text-lg">{{ $t('block.block_summary') }}</div>
    <div class="grid grid-cols-1 xl:gap-5 gap-2 xl:grid-cols-4">
      <div class="border border-[#383B40] rounded-lg p-4 flex xl:flex-col flex-row xl:gap-0 gap-2">
        <span>{{ $t('block.block_height') }}</span>
        <span class="text-white text-16 font-semibold">{{ props?.chain?.toLowerCase() === 'oraichain' ?
          store?.blocks?.[0]?.height ??
          store?.latest?.block?.header?.height ?? "0" :
          store?.latest?.block?.header?.height ?? "0" }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex xl:flex-col flex-row xl:gap-0 gap-2">
        <span>{{ $t('staking.total_bonded') }}</span>
        <span class="text-white text-16 font-semibold">{{
          formatter.formatToken({
            amount: staking?.pool?.bondedTokens,
            denom: staking.params.bondDenom,
          })
        }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex xl:flex-col flex-row xl:gap-0 gap-2">
        <span>{{ $t('staking.inflation') }}</span>
        <span class="text-white text-16 font-semibold">{{ formatter.formatDecimalToPercent(mintStore.inflation) }}</span>
      </div>
      <div class="border border-[#383B40] rounded-lg p-4 flex xl:flex-col flex-row xl:gap-0 gap-2">
        <span>{{ $t('block.block_time') }}</span>
        <span class="text-white text-16 font-semibold">{{ blockTime ? "≈"+blockTime : "-" }}</span>
      </div>
    </div>

  </div>
</template>

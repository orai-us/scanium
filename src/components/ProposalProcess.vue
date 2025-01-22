<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { computed, ref } from '@vue/reactivity';
import { watchEffect, type PropType } from 'vue';

const props = defineProps({
  tally: { type: Object as PropType<any> },
  pool: {
    type: Object as PropType<{
      notBondedTokens: string;
      bondedTokens: string;
    }>,
  },
});

const total = computed(() => props.pool?.bondedTokens);
const format = useFormatter();

const yes = ref("0");
const no = ref("0");
const abstain = ref("0");
const veto = ref("0");

watchEffect(() => {
  yes.value = format.calculatePercent(props.tally?.yesCount || props.tally?.yes, total.value);
  no.value = format.calculatePercent(props.tally?.noCount || props.tally?.no, total.value);
  abstain.value = format.calculatePercent(props.tally?.abstainCount || props.tally?.abstain, total.value);
  veto.value = format.calculatePercent(props.tally?.noWithVetoCount || props.tally?.noWithVetoCount, total.value);
})

</script>

<template>
  <div class="progress rounded-[3px] h-6 text-xs flex items-center">
    <div
      class="h-6 bg-yes flex items-center pl-2 text-white overflow-hidden"
      :style="`width: ${yes}`"
      :title="'yes'"
    >
      {{ yes }}
    </div>
    <div
      class="h-6 bg-no flex items-center text-white overflow-hidden"
      :style="`width: ${no}`"
      :title="'no'"
    >
      {{ no }}
    </div>
    <div
      class="h-6 bg-[#B71C1C] flex items-center text-white overflow-hidden"
      :style="`width: ${veto};`"
      :title="'veto'"
    >
      {{ veto }}
    </div>
    <div
      class="h-6 bg-secondary flex items-center text-white overflow-hidden"
      :style="`width: ${abstain}`"
      :title="'abstain'"
    >
      {{ abstain }}
    </div>
  </div>
</template>
<style scoped>
.progress {
  overflow: hidden;
  background-color: rgba(128, 128, 128, 0.178);
}
</style>

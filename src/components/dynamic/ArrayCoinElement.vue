<script lang="ts" setup>
import { useFormatter } from '@/stores';
import type { Coin } from '@/types';

const props = defineProps({
  value: { type: Array<Coin>},
})

const format = useFormatter()

</script>
<template>
  <div class="xl:text-sm text-[12px]">
    {{ format.formatTokens(value, true, "0,0.[000000]") }}
  </div>
</template>
<script lang="ts">
export default {
  name: 'ArrayCoinElement'
}
</script>

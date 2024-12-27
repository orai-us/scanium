<script lang="ts" setup>
import BlockIndexes from '@/components/blocks/BlockIndexes.vue';
import BlockNonIndexes from '@/components/blocks/BlockNonIndexes.vue';
import { CHAIN_INDEXS } from '@/constants';

const props = defineProps(['height', 'chain']);

</script>
<template>
  <div>
    <div v-if="CHAIN_INDEXS.includes(chain)">
      <BlockIndexes :chain="chain" :height="height"/>
    </div>
    <div v-else>
      <BlockNonIndexes :chain="chain" :height="height" />
    </div>
  </div>
</template>

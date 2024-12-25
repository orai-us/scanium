<script lang="ts" setup>
import { wrapBinary } from '@/libs/utils';
import { JsonViewer } from 'vue3-json-viewer';
import { useBaseStore } from '@/stores';

const props = defineProps(['value']);
const baseStore = useBaseStore();

</script>
<template>
  <div class="overflow-auto rounded-lg max-w-full border border-gray-800">
    <JsonViewer :value="wrapBinary(value)" :theme="baseStore.theme" style="background: transparent; border: none"
      copyable sort expand-depth="5" boxed />
  </div>
</template>

<style>
.jv-container .jv-code.boxed {
  max-height: fit-content;
  overflow-y: auto;
  width: 1200px;
}

.jv-more {
  opacity: 0;
}
</style>

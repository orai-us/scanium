<script lang="ts" setup>
import { wrapBinary } from '@/libs/utils';
import { JsonViewer } from 'vue3-json-viewer';
import { useBaseStore } from '@/stores';
import { computed, ref, watchEffect } from 'vue';
import ArrayElement from './ArrayElement.vue';
import TextElement from './TextElement.vue';
import DynamicComponent from './DynamicComponent.vue';

const props = defineProps(['value']);
const baseStore = useBaseStore();
const countNest = ref(0);

function countNestedObjects(obj: any) {
  let count = 0;

  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count++;
      count += countNestedObjects(obj[key]);
    }

    if (count > 1) return count;
  }

  return count;
}

function allElementsSameType(arr: Array<any>) {
  if (arr.length === 0) return true;

  const firstType = Object.prototype.toString.call(arr[0]);

  return arr.every(element => Object.prototype.toString.call(element) === firstType);
}

watchEffect(() => {
  countNest.value = countNestedObjects(props.value);
});

const isRenderJsonArray = computed(() => {
  if (Array.isArray(props.value)) {
    for (let item of props.value) {
      if (Array.isArray(item)) return true;
      if (typeof item !== "object") return true;
      const count = countNestedObjects(item);
      if (count > 1) { return true; }
    }
  }
  return false;
})

</script>
<template>
  <div class="overflow-auto rounded-lg max-w-full border border-gray-800" v-if="Array.isArray(value)">
    <div v-if="isRenderJsonArray && allElementsSameType(value)">
      <JsonViewer :value="wrapBinary(value)" :theme="baseStore.theme" style="background: transparent; border: none"
        copyable sort expand-depth="5" boxed />
    </div>
    <div v-else>
      <DynamicComponent :value="value" />
    </div>

  </div>
  <div v-else-if="typeof value ==='string' || typeof value ==='boolean'">
    <TextElement :value="value" />
  </div>
  <div class="overflow-auto rounded-lg w-full border border-gray-800" v-else>
    <div v-if="countNest > 1">
      <JsonViewer :value="wrapBinary(value)" :theme="baseStore.theme" style="background: transparent; border: none"
        copyable sort expand-depth="5" boxed />
    </div>
    <div v-else>
      <ArrayElement :value="[value]" />
    </div>
  </div>

</template>
<style>
.jv-container .jv-code.boxed {
  max-height: fit-content !important;
  overflow-y: auto;
  width: 1200px;
}

.jv-more {
  opacity: 0;
}
</style>

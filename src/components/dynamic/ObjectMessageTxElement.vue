<script lang="ts" setup>
import { wrapBinary } from '@/libs/utils';
import { JsonViewer } from 'vue3-json-viewer';
import { useBaseStore } from '@/stores';
import { computed, ref, toRaw, watchEffect } from 'vue';
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
  const stringStructure = Object.keys(arr[0]).toString();  
  return arr.every(element => { 
    console.log({ key: Object.keys(element).toString() }) 
    return Object.keys(element).toString() === stringStructure; 
  });
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

watchEffect(()=>{
  console.log({ value: toRaw(props.value) });
})

</script>
<template>
  <div>
    <div v-if="Array.isArray(value)" class="overflow-auto rounded-lg max-w-full border border-gray-800">
      <div v-if="allElementsSameType(value) && !isRenderJsonArray">
        <DynamicComponent :value="value" />
      </div>
      <div v-else>
        <JsonViewer :value="wrapBinary(value)" :theme="baseStore.theme" style="background: transparent; border: none"
          copyable sort expand-depth="5" boxed />
      </div>
    </div>
    <div v-else-if="typeof value === 'string' || typeof value === 'boolean'">
      <TextElement :value="value" />
    </div>
    <div v-else>
      <div v-if="countNest > 1" class="overflow-auto rounded-lg w-full border border-gray-800">
        <JsonViewer :value="wrapBinary(value)" :theme="baseStore.theme" style="background: transparent; border: none"
          copyable sort expand-depth="5" boxed />
      </div>
      <div v-else>
        <ArrayElement :value="[value]" />
      </div>
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

<script lang="ts" setup>
import { useBaseStore } from '@/stores';
import { JsonViewer } from 'vue3-json-viewer';
import { toBase64, toHex } from '@cosmjs/encoding';
import { parseJSONRecursive } from '@/libs/utils';
import { fromBinary } from '@cosmjs/cosmwasm-stargate';
import { computed, ref } from 'vue';

const baseStore = useBaseStore();

const props = defineProps(['value']);
const format = ref('utf8');
const text = computed(() => {
  switch (format.value) {
    case 'hex':
      return toHex(props.value);
    case 'base64':
      return toBase64(props.value);
    default:
      try {
        const jsonValue = fromBinary(toBase64(props.value));
        return parseJSONRecursive(jsonValue);
      } catch (ex) {
        return 'Invalid Utf8';
      }
  }
});
function change(value: string) {
  format.value = value;
}
function getClass(value: string) {
  return value === format.value ? 'btn-primary' : '';
}
</script>
<template>
  <div>
    <div class="bg-base-100 rounded-lg">
      <JsonViewer
        v-if="typeof text === 'object'"
        :value="text"
        :theme="baseStore.theme || 'dark'"
        style="background: transparent; border:none"
        copyable
        boxed
        sort
        :expand-depth="5"
      />
      <div v-else class="p-2">
        {{ text }}
      </div>
    </div>
    <!-- <div class="btn-group mt-4 inline-block" role="group">
      <button
        type="button"
        v-bind:class="getClass('utf8')"
        class="btn btn-xs"
        @click="change('utf8')"
      >
        Utf8
      </button>
      <button
        type="button"
        v-bind:class="getClass('base64')"
        class="btn btn-xs"
        @click="change('base64')"
      >
        Base64
      </button>
      <button
        type="button"
        v-bind:class="getClass('hex')"
        class="btn btn-xs"
        @click="change('hex')"
      >
        Hex
      </button>
    </div> -->
  </div>
</template>

<style>
.jv-container .jv-code.boxed {
  max-height: fit-content;
  overflow-y: auto;
}
</style>

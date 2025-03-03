<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { select } from './index';
import { useFormatter } from '@/stores';
import MdEditor from 'md-editor-v3';

const props = defineProps(['value']);
const format = useFormatter();

</script>
<template>
  <div class="overflow-auto rounded-lg w-full p-2">
    <div v-for="(v, k) of value" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2 lg:max-w-full max-w-[300px]">
      <div v-if="k.toString() === 'description'"
        class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2 lg:max-w-full max-w-[300px]">
        <div class="w-40 xl:text-sm text-xs">Description :</div>
        <div class="w-[70%]">
          <MdEditor :model-value="format.multiLine(v)" previewOnly class="md-editor-recover text-white">
          </MdEditor>
        </div>
      </div>
      <div v-else class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2 lg:max-w-full max-w-[300px]">
        <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k.toString()) }}:</div>
        <Component :is="select(v)" :value="v"></Component>
      </div>
    </div>
  </div>
</template>
<style scoped>
::v-deep span {
  background-color: #18181A !important;
  color: white !important;
}
</style>

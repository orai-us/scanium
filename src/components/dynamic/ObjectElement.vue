<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { select } from './index';

const props = defineProps(['value']);
</script>
<template>
  <div class="overflow-auto border border-solid border-base-400 rounded-lg w-full p-2">
    <table class="table table-compact w-full text-sm">
      <tbody class="w-full">
        <tr v-for="(v, k) of value" class="w-full">
          <td class=" whitespace-break-spaces min-w-max">
            {{ formatTitle(String(k)) }}:
          </td>
          <td class="w-4/5">
            <div class="overflow-hidden w-auto whitespace-normal">
              <Component :is="select(v)" :value="v"></Component>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<!-- <template>
  <div class="bg-base">
    <div v-for="(v, k) of value" class="flex gap-2">
      <div class="flex gap-1">
        <span class="text-white">{{ formatTitle(k.toString()) }}</span>
        <span class="font-bold text-gray-400">{{ v }}</span>
      </div>
    </div>
  </div>
</template> -->

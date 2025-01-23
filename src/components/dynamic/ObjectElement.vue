<script lang="ts" setup>
import { formatTitle } from '@/libs/utils';
import { select } from './index';

const props = defineProps(['value']);
</script>
<template>
  <div class="overflow-auto rounded-lg w-full p-2">
    <table class="xl:table-sm table-xs table-compact w-full text-sm">
      <tbody class="w-full">
        <tr v-for="(v, k) of value" class="w-full">
          <td class="whitespace-break-spaces min-w-max xl:text-sm text-xs">
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
<style scoped>
::v-deep span {
  background-color: #18181A !important;
  color: white !important;
}
</style>

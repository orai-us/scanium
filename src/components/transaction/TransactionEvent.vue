<script lang="ts" setup>
import { ref } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { formatTitle } from '@/libs/utils';

const props = defineProps(['events']);
const logOpens = ref([false] as Array<boolean>);

const changeLogOpen = (index: number) => {
  const status = logOpens.value[index];
  logOpens.value[index] = !status
};

</script>
<template>
  <div class="m-4 flex pt-4">
    <div class="mb-2 w-1/5">Event Logs:</div>
    <div class="w-full">
      <div v-for="(event, idx) of events" class="rounded border-solid border border-stone-800 mb-4">
        <div class="collapse collapse-arrow" :class="{
          'collapse-open': idx === 0 && logOpens[idx],
          'collapse-close': !logOpens[idx]
        }">
          <input type="checkbox" class="cursor-pointer block" @click="changeLogOpen(idx)" />
          <div class="pb-2 collapse-title" :class="{ 'border-b border-solid border-stone-800 ': logOpens[idx] }">[{{ idx }}]
            {{ formatTitle(event.type) }}</div>
          <div class="pt-2 collapse-content">
            <div v-for="v of event.attributes" class="mb-4 flex">
              <div class="w-1/5">{{ formatTitle(v.key) }}:</div>
              <DynamicComponent :value="v.value" direct="horizontal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

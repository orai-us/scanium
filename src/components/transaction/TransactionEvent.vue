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
  <div class="xl:m-4 flex xl:flex-row flex-col pt-4 gap-2">
    <div class="mb-2 xl:w-1/5 w-full xl:text-sm text-xs">Event Logs:</div>
    <div class="xl:w-4/5 w-full">
      <div v-for="(event, idx) of events" class="rounded border-solid border border-stone-800 mb-4">
        <div class="collapse collapse-arrow w-[80%]" :class="{
          'collapse-open': idx === 0 && logOpens[idx],
          'collapse-close': !logOpens[idx]
        }">
          <input type="checkbox" class="cursor-pointer block" @click="changeLogOpen(idx)" />
          <div class="pb-2 collapse-title xl:text-sm text-xs" :class="{ 'border-b border-solid border-stone-800': logOpens[idx] }">[{{ idx }}]
            {{ formatTitle(event.type) }}</div>
          <div class="pt-2 collapse-content xl:w-[90%] w-[80%] xl:overflow-scroll">
            <div v-for="v of event.attributes" class="mb-4 flex xl:flex-row flex-col gap-2">
              <div class="xl:w-1/5 w-full xl:text-sm text-xs">{{ formatTitle(v.key) }}:</div>
              <DynamicComponent :value="v.value" direct="horizontal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

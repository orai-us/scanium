<script lang="ts" setup>
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { formatTitle } from '@/libs/utils';

const props = defineProps(['events']);

</script>
<template>
  <div class="m-4">
    <div class="mb-2">Event Logs:</div>
    <div v-for="(event, idx) of events" class="rounded border-solid border border-stone-800 mb-4">
      <div class="m-4">
        <div class="border-b border-solid border-stone-800 mb-2">[{{ idx }}] {{ formatTitle(event.type) }}</div>
        <div>
          <div v-for="v of event.attributes" class="mb-4">
            <div>{{ formatTitle(v.key) }}:</div>
            <DynamicComponent :value="v.value" direct="horizontal" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

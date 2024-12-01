<script lang="ts" setup>
import { computed } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { decodeBuffer, formatTitle } from '@/libs/utils';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

const props = defineProps(['value', 'type']);
const executeMsgParams = computed(() => {
  if (props.type !== MsgExecuteContract.typeUrl) {
    return null;
  }
  return Object.values(decodeBuffer(props.value.msg))[0];
});
</script>
<template>
  <div>
    <div class="min-h-[25px] m-4">
      <div v-if="executeMsgParams">
        <div class="mb-4">
          <div>Contract:</div>
          <div>
            <DynamicComponent :value="value.contract" />
          </div>
        </div>
        <div class="mb-4">
          <div>Sender:</div>
          <div>
            <DynamicComponent :value="value.sender" />
          </div>
        </div>
        <div class="mb-4">
          <div>Funds:</div>
          <div v-if="value.funds.length">
            <DynamicComponent :value="value.funds" />
          </div>
          <div v-else="value.funds.length">None</div>
        </div>
        <div v-for="(v, k) of executeMsgParams" class="mb-4">
          <div>{{ formatTitle(k) }}:</div>
          <div>
            <DynamicComponent :value="v" direct="horizontal" />
          </div>
        </div>
      </div>
      <div v-else>
        <div v-for="(v, k) of value" class="mb-4">
          <div>{{ formatTitle(k) }}:</div>
          <div>
            <DynamicComponent :value="v" direct="horizontal" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

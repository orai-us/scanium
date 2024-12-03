<script lang="ts" setup>
import { computed } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { decodeBuffer, formatTitle } from '@/libs/utils';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import AmmV3Message from './AmmV3Message.vue';
import { contractAddress } from '@/libs/amm-v3';

const props = defineProps(['value', 'type', 'events']);
const executeMsgParams = computed(() => {
  if (props.type !== MsgExecuteContract.typeUrl) {
    return null;
  }
  const decodedExecuteMsg = decodeBuffer(props.value.msg);
  return {
    action: Object.keys(decodedExecuteMsg)[0],
    params: Object.values(decodedExecuteMsg)[0],
  };
});
const isAmmV3ExecuteMessage = computed(() => {
  return props.type === MsgExecuteContract.typeUrl && props.value.contract === contractAddress;
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
        <AmmV3Message v-if="isAmmV3ExecuteMessage" :action="executeMsgParams.action" :params="executeMsgParams.params"
          :events="events" />
        <template v-else>
          <div v-for="(v, k) of executeMsgParams.params" class="mb-4">
            <div>{{ formatTitle(k) }}:</div>
            <div>
              <DynamicComponent :value="v" direct="horizontal" />
            </div>
          </div>
        </template>
      </div>
      <div v-else>
        <div v-for="(v, k) of value" class="mb-4">
          <div>{{ formatTitle(k.toString()) }}:</div>
          <div>
            <DynamicComponent :value="v" direct="horizontal" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

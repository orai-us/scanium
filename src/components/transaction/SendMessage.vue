<script lang="ts" setup>
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { computed, toRaw, watchEffect } from 'vue';
import { formatTitle } from '@/libs/utils';
import { displayListAssets } from '@/libs/amm-v3';
import { BONDING_CONTRACT_ADDRESS, BRIDGE_EVM_CONTRACT_ADDRESS, BRIDGE_TON_ADDRESS, EXECUTE_SWAP_OPERATIONS_ROUTER, EXECUTE_SWAP_OPERATIONS_SMART_CONTRACT, PREFIX_MEMO_MSG_BRIDGE_EVMS, SWAP_AND_ACTION_CONTRACT_ADDRESS } from '@/libs/send-msg';
import ContractMessage from './ContractMessage.vue';

const props = defineProps(['params', 'events', 'denom', 'sender', 'chain']);

const receiver = computed(() => {
  let result = "";

  if (props.params?.msg) {
    const msg = JSON.parse(atob(props.params.msg));
    console.log({ msg })
    const contract = props.params?.contract;
    switch (contract) {
      case BRIDGE_EVM_CONTRACT_ADDRESS:
        const memo = msg.memo;
        PREFIX_MEMO_MSG_BRIDGE_EVMS.forEach((item) => {
          if (memo.startsWith(item)) {
            result = memo.replace(item, "");
          }
        });
        return result;
      case BRIDGE_TON_ADDRESS:
        return msg.to;
      case SWAP_AND_ACTION_CONTRACT_ADDRESS:
        return msg.swap_and_action?.post_swap_action?.transfer?.to_address || msg.swap_and_action?.post_swap_action?.ibc_transfer?.ibc_info?.receiver;
      case EXECUTE_SWAP_OPERATIONS_SMART_CONTRACT:
      case EXECUTE_SWAP_OPERATIONS_ROUTER:
        return props.sender;
      case BONDING_CONTRACT_ADDRESS:
        return props.params?.contract;
      default:
        return result;
    }
  }
  return result;

});

const valueSend = computed(() => {
  return {
    receiver: receiver.value,
    amount: displayListAssets([props.params?.amount], [props.denom]),
  };
})

</script>
<template>
  <div>
    <div v-for="(v, k) of valueSend" class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">{{ formatTitle(k) }}:</div>
      <div
        :class="{ 'border-gray-800 border rounded-md xl:w-[80%] w-full': typeof v === 'object' && !Array.isArray(v) && v }">
        <DynamicComponent :value="v" />
      </div>
    </div>
    <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">Contract :</div>
      <ContractMessage :contract="props.params?.contract" :chain="chain" />
    </div>
    <!-- <div class="mb-4 flex xl:flex-row flex-col xl:gap-10 gap-2">
      <div class="w-40 xl:text-sm text-xs">Msg :</div>
      <DynamicComponent :value="props.params?.msg" :direct="'messageTx'"/>
    </div> -->
  </div>
</template>

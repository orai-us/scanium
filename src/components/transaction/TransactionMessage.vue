<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import DynamicComponent from '../dynamic/DynamicComponent.vue';
import { decodeBuffer, formatTitle } from '@/libs/utils';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import AmmV3Message from './AmmV3Message.vue';
import { contractAddress } from '@/libs/amm-v3';
import { Icon } from '@iconify/vue';
import { fromBinary } from '@cosmjs/cosmwasm-stargate';
import ArrayCoinElement from '../dynamic/ArrayCoinElement.vue';
import nameMatcha from '@leapwallet/name-matcha';
import ContractMessage from './ContractMessage.vue';

const props = defineProps(['value', 'type', 'events', 'chain']);

let showCopyToast = ref(0);
const encoder = new TextEncoder();
const labelSenders = ref([] as { name?: string | null; provider?: string }[]);

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

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = 1;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  } catch (err) {
    showCopyToast.value = 2;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  }
};

const tipMsg = computed(() => {
  return showCopyToast.value === 2
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});

watchEffect(() => {
  nameMatcha.lookupAll(props.value.sender).then((re) => {
    labelSenders.value = Object.keys(re)
      .map((key) => ({ name: re[key], provider: key }))
      .filter((x) => x.name);
  });
});


</script>
<template>
  <div>
    <div class="min-h-[25px] m-4">
      <div v-if="executeMsgParams">
        <div class="mb-4 flex flex-row gap-10">
          <div class="w-40">Contract:</div>
          <ContractMessage :contract="value.contract" :chain="chain" />
        </div>
        <div class="mb-4 flex flex-row gap-10">
          <div class="w-40">Sender:</div>
          <div class="flex flex-row justify-center items-center">
            <RouterLink :to="`/${chain}/account/${value.sender}`" class="text-link">{{ value.sender }}</RouterLink>
            <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="value.sender"
              @click="copyWebsite(value.sender || '')" />
            <div v-for="{ name, provider } in labelSenders">
              <span class="text-xs truncate relative py-1 px-2 p2-4 w-fit ml-2 rounded text-success tooltip"
                :data-tip="provider" :title="provider">
                <span class="inset-x-0 inset-y-0 opacity-10 absolute bg-success"></span>
                <button>{{ name }}</button>
              </span>
            </div>
          </div>
        </div>
        <div class="mb-4 flex flex-row gap-10">
          <div class="w-40">Funds:</div>
          <div v-if="value.funds.length">
            <ArrayCoinElement :value="value.funds" />
          </div>
          <div v-else>None</div>
        </div>
        <AmmV3Message v-if="isAmmV3ExecuteMessage" :action="executeMsgParams.action" :params="executeMsgParams.params"
          :events="events" />
        <template v-else>
          <div v-for="(v, k) of executeMsgParams.params" class="mb-4 flex flex-row gap-10">
            <div class="w-40">{{ formatTitle(k) }}:</div>
            <div v-if="k === 'data'">
              <div v-for="(value, key) in v" class="flex gap-2">
                <div class="flex gap-1">
                  <span class="text-white text-sm">{{ Number(value).toLocaleString("en-US", {}) }}</span>
                  <span class="font-bold text-gray-400 text-sm">{{ key }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="k === 'msg'" class="w-full">
              <DynamicComponent :value="encoder.encode(JSON.stringify(fromBinary(v)))" />
            </div>
            <div v-else-if="k === 'contract'">
              <ContractMessage :contract="v" :chain="chain" />
            </div>
            <div v-else>
              <DynamicComponent :value="v" :direct="'messageTx'" />
            </div>
          </div>
        </template>
      </div>
      <div v-else>
        <div v-for="(v, k) of value" class="mb-4 flex flex-row gap-10">
          <div class="w-40">{{ formatTitle(k.toString()) }}:</div>
          <div class="w-full">
            <DynamicComponent :value="v" />
          </div>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === 1">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === 2">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

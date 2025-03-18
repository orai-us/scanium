<script lang="ts" setup>
import { formatSmallNumber } from '@/utils';
import { Icon } from '@iconify/vue';
import { Event } from 'cosmjs-types/tendermint/abci/types';
import { computed, ref, toRaw, watchEffect } from 'vue';
import TokenElement from '../dynamic/TokenElement.vue';

const props = defineProps(['value', 'type', 'events', 'chain']);
const message = ref({} as any);
let resultCopy = ref();

const attributes = computed(() => {
  const result: any[] = [];

  props.events?.forEach(
    (e: Event) => {
      if (e.type === "message" && e.attributes.find(item => item.key === "action" && item.value === "/ethermint.evm.v1.MsgEthereumTx")) {
        e.attributes.forEach((item) => { if (item.key === "sender") { result.push({ key: 'senderCosmos', value: item.value }) } })
      }
      e.attributes.forEach((item) => result.push(item))
    })
  console.log({ result })
  return result
});

watchEffect(() => {
  if (Array.isArray(attributes.value)) {
    const msg: any = {}
    attributes.value.forEach((item) => {
      msg[item.key] = item.value
    })
    message.value = msg;
  }
})

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    resultCopy.value = true;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  } catch (err) {
    resultCopy.value = false;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  }
};

</script>

<template>
  <div class="mt-5 xl:w-full w-[65%]">
    <div class="mb-4 flex xl:gap-10 gap-2 xl:flex-row flex-col">
      <div class="w-40 xl:text-sm text-xs">EVM Tx Hash:</div>
      <div class="flex gap-2 items-center">
        <RouterLink :to="`/${chain}/tx/${message.ethereumTxHash}`" class="text-link xl:text-sm text-[12px] truncate break-words w-full">
          {{ message.ethereumTxHash }}</RouterLink>
        <Icon icon="mdi:content-copy" class="cursor-pointer xl:w-5 w-3" v-show="message.ethereumTxHash"
          @click="copyWebsite(message.ethereumTxHash || '')" />
      </div>
    </div>
    <div class="mb-4 flex xl:gap-10 gap-2 xl:flex-row flex-col">
      <div class="w-40 xl:text-sm text-xs">Cosmos Sender:</div>
      <div class="flex gap-2 items-center">
        <RouterLink :to="`/${chain}/account/${message.senderCosmos}`" class="text-link xl:text-sm text-[12px] truncate break-words">
          {{ message.senderCosmos }}</RouterLink>
        <Icon icon="mdi:content-copy" class="cursor-pointer xl:w-5 w-3" v-show="message.senderCosmos"
          @click="copyWebsite(message.senderCosmos || '')" />
      </div>

    </div>
    <div class="mb-4 flex xl:gap-10 gap-2 xl:flex-row flex-col">
      <div class="w-40 xl:text-sm text-xs">EVM Sender:</div>
      <div class="flex gap-2 items-center">
        <RouterLink :to="`/${chain}/account/${message.sender}`" class="text-link xl:text-sm text-[12px] truncate break-words">
          {{ message.sender }}</RouterLink>
        <Icon icon="mdi:content-copy" class="cursor-pointer xl:w-5 w-3" v-show="message.sender"
          @click="copyWebsite(message.sender || '')" />
      </div>
    </div>
    <div class="mb-4 flex xl:gap-10 gap-2 xl:flex-row flex-col">
      <div class="w-40 xl:text-sm text-xs">Recipient:</div>
      <div class="flex gap-2 items-center">
        <RouterLink :to="`/${chain}/account/${message.recipient}`" class="text-link xl:text-sm text-[12px] truncate break-words">
          {{ message.recipient }}</RouterLink>
        <Icon icon="mdi:content-copy" class="cursor-pointer xl:w-5 w-3" v-show="message.recipient"
          @click="copyWebsite(message.recipient || '')" />
      </div>
    </div>
    <div class="mb-4 flex xl:gap-10 gap-2 xl:flex-row flex-col">
      <div class="w-40 xl:text-sm text-xs">Amount:</div>
      <div class="xl:text-sm text-[12px] flex gap-1">
        <TokenElement :value="{amount: message.amount, denom:'aorai'}"/>
      </div>
    </div>
    <div class="toast" v-show="resultCopy === true">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>Copy Success!</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="resultCopy === false">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>Copy Error!</span>
        </div>
      </div>
    </div>
  </div>
</template>

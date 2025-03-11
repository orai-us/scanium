<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { Event } from 'cosmjs-types/tendermint/abci/types';
import { computed, ref, toRaw, watchEffect } from 'vue';

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
  <div class="mt-5">
    <div class="mb-4 flex flex-row gap-10">
      <div class="w-40">EVM Tx Hash:</div>
      <div class="flex gap-1 justify-center items-center">
        <RouterLink :to="`/${chain}/tx/${message.ethereumTxHash}`" class="text-primary dark:text-link">
          {{ message.ethereumTxHash }}</RouterLink>
        <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="message.ethereumTxHash"
          @click="copyWebsite(message.ethereumTxHash || '')" />
      </div>
    </div>
    <div class="mb-4 flex flex-row gap-10">
      <div class="w-40">Cosmos Sender:</div>
      <div class="flex gap-1 justify-center items-center">
        <RouterLink :to="`/${chain}/account/${message.senderCosmos}`" class="text-primary dark:text-link">
          {{ message.senderCosmos }}</RouterLink>
        <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="message.senderCosmos"
          @click="copyWebsite(message.senderCosmos || '')" />
      </div>

    </div>
    <div class="mb-4 flex flex-row gap-10">
      <div class="w-40">EVM Sender:</div>
      <div class="flex gap-1 justify-center items-center">
        <RouterLink :to="`/${chain}/account/${message.sender}`" class="text-primary dark:text-link">
          {{ message.sender }}</RouterLink>
        <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="message.sender"
          @click="copyWebsite(message.sender || '')" />
      </div>
    </div>
    <div class="mb-4 flex flex-row gap-10">
      <div class="w-40">Recipient:</div>
      <div class="flex gap-1 justify-center items-center">
        <RouterLink :to="`/${chain}/account/${message.recipient}`" class="text-primary dark:text-link">
          {{ message.recipient }}</RouterLink>
        <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="message.recipient"
          @click="copyWebsite(message.recipient || '')" />
      </div>
    </div>
    <div class="mb-4 flex flex-row gap-10">
      <div class="w-40">Amount:</div>
      <div>{{ `${message.amount} aorai` }}</div>
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
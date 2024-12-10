<script lang="ts" setup>
import { useBaseStore, useBlockchain, useFormatter } from '@/stores';
import DynamicComponent from '@/components/dynamic/DynamicComponent.vue';
import type { GetTxResponse } from 'cosmjs-types/cosmos/tx/v1beta1/service';
import { logs } from '@cosmjs/stargate';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { JsonViewer } from 'vue3-json-viewer';
// if you used v1.0.5 or latster ,you should add import "vue3-json-viewer/dist/index.css"
import 'vue3-json-viewer/dist/index.css';
import { Icon } from '@iconify/vue';
import { ref, computed, watchEffect, toRaw } from 'vue';
import { decodeProto } from '@/components/dynamic';
import TransactionMessage from '@/components/transaction/TransactionMessage.vue';
import { formatTitle, wrapBinary } from '@/libs/utils';
import { Event } from 'cosmjs-types/tendermint/abci/types';
import TransactionEvent from '@/components/transaction/TransactionEvent.vue';
import IBCMessage from '@/components/transaction/IBCMessage.vue';
import ContractMessage from '@/components/transaction/ContractMessage.vue';

const props = defineProps(['hash', 'chain']);

const blockchain = useBlockchain();
const baseStore = useBaseStore();
const format = useFormatter();
const tx = ref({} as GetTxResponse | undefined);
const tab = ref('msg');
const messageOpens = ref([true] as Array<boolean>);
const logOpens = ref([true] as Array<boolean>);

if (props.hash) {
  blockchain.rpc.getTx(props.hash).then((x) => {
    tx.value = x;
  });
}
const messages = computed(() => {
  return tx.value?.tx?.body?.messages.map((msg) => {
    const decodedValue = decodeProto(msg);

    let displayType = msg.typeUrl.split('.').slice(-1)[0].replace(/^Msg/, '').replaceAll(/(?<=.)([A-Z])/g, (match) => ` ${match}`);
    const typeMsg = msg.typeUrl.split('.')[0];

    if (msg.typeUrl === MsgExecuteContract.typeUrl) {
      const decodedExecuteContractMsg = JSON.parse(Buffer.from(decodedValue.msg).toString());
      const functionName = Object.keys(decodedExecuteContractMsg)[0];
      displayType += `/${formatTitle(functionName)}`;
    }
    return {
      decodedValue,
      displayType,
      typeUrl: msg.typeUrl,
      typeMsg
    }
  }) || [];
});

const txLogs = computed(() => {
  const eventLogsByIndex = {} as any;
  tx.value?.txResponse?.events.forEach((event) => {
    const msgIndex = event.attributes.find((attr) => attr.key === 'msg_index')?.value;
    if (msgIndex === undefined) return;
    if (!eventLogsByIndex[msgIndex]) {
      eventLogsByIndex[msgIndex] = {
        msgIndex,
        events: [],
      };
    }
    eventLogsByIndex[msgIndex].events.push(event);
  });

  if (tx.value?.txResponse?.logs && tx.value?.txResponse?.logs.length) {
    return tx.value?.txResponse?.logs;
  }
  try {
    const parsedRawLogs = logs?.parseRawLog(tx.value?.txResponse?.rawLog || '[]');
    if (parsedRawLogs && parsedRawLogs.length) {
      return parsedRawLogs;
    }
  } catch (error) {
    return [];
  }
  return Object.values(eventLogsByIndex) as Array<{ msgIndex: string, events: Array<Event> }>;
});

const changeMsgOpen = (index: number) => {
  const status = messageOpens.value[index];
  messageOpens.value[index] = !status;
};
const changeLogOpen = (index: number) => {
  const status = logOpens.value[index];
  logOpens.value[index] = !status
};

</script>
<template>
  <div class="box-content !p-0">
    <div v-if="tx?.txResponse" class="p-4 md:p-6">
      <h2 class="card-title truncate mb-2 text-white">{{ $t('tx.title') }}</h2>
      <div class="overflow-auto-x">
        <table class="table text-sm">
          <tbody>
            <tr>
              <td>{{ $t('tx.tx_hash') }}</td>
              <td>{{ tx?.txResponse.txhash }}</td>
            </tr>
            <tr>
              <td>{{ $t('account.height') }}</td>
              <td>
                <RouterLink :to="`/${props.chain}/block/${tx.txResponse.height}`" class="text-primary dark:text-link">{{
                  tx.txResponse.height }}
                </RouterLink>
              </td>
            </tr>
            <tr>
              <td>{{ $t('staking.status') }}</td>
              <td>
                <span class="text-xs truncate relative py-2 w-fit mr-2 rounded inline-flex items-center" :class="`${
                    tx.txResponse.code === 0 ? 'text-[#39DD47]' : 'text-error'
                  }`">
                  <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp;
                  {{ tx.txResponse.code === 0 ? 'Success' : 'Failed' }}
                </span>
                <span>
                  {{ tx.txResponse.code === 0 ? '' : tx?.txResponse?.rawLog }}
                </span>
              </td>
            </tr>
            <tr>
              <td>{{ $t('account.time') }}</td>
              <td>
                {{ format.toLocaleDate(tx.txResponse.timestamp) }} ({{
                format.toDay(tx.txResponse.timestamp, 'from')
                }})
              </td>
            </tr>
            <tr>
              <td>{{ $t('tx.gas') }}</td>
              <td>
                {{ tx.txResponse.gasUsed }} / {{ tx.txResponse.gasWanted }}
              </td>
            </tr>
            <tr>
              <td>{{ $t('tx.fee') }}</td>
              <td>
                {{
                format.formatTokens(
                tx.tx?.authInfo?.fee?.amount,
                true,
                '0,0.[00]'
                )
                }}
              </td>
            </tr>
            <tr>
              <td>{{ $t('tx.memo') }}</td>
              <td>{{ tx.tx?.body?.memo || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="border-t border-b border-base-200">
      <div
        class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0 border-t border-b border-base-300 !rounded-none">
        <a class="tab text-gray-400 capitalize !pb-3" :class="{ 'tab-active': tab === 'msg' }"
          @click="tab = 'msg'">Messages ({{ messages.length }})</a>
        <a class="tab text-gray-400 capitalize !pb-2" :class="{ 'tab-active': tab === 'log' }" @click="tab = 'log'">Logs
          ({{ txLogs.length }})</a>
        <a class="tab text-gray-400 capitalize !pb-2" :class="{ 'tab-active': tab === 'json' }"
          @click="tab = 'json'">JSON</a>
      </div>

      <div v-if="tab === 'msg'">
        <div v-if="tx?.txResponse" class="bg-base-100 px-4 pt-3 pb-4 rounded mb-4">
          <!-- <h2 class="card-title truncate mb-2">
            {{ $t('account.messages') }}: ({{ messages.length }})
          </h2> -->
          <div v-for="(msg, i) in messages" :key="i">
            <div class="rounded-lg mt-4 collapse collapse-arrow bg-base-200" :class="{
              'collapse-open': i === 0 && messageOpens[i], 
              'collapse-close': !messageOpens[i]
            }">
              <input type="checkbox" class="cursor-pointer !h-10 block" @click="changeMsgOpen(i)" />
              <div class="flex justify-between p-5 collapse-title"
                :class="{ 'border-b border-solid border-stone-700': messageOpens[i] }">
                <h5 class="text-lg font-bold">#{{ i + 1 }}. {{ msg.displayType }}</h5>
              </div>
              <div class="collapse-content" v-if="msg.typeMsg==='/ibc'">
                <IBCMessage :value="msg.decodedValue" :type="msg.displayType" />
              </div>
              <div class="collapse-content" v-else>
                <TransactionMessage :value="msg.decodedValue" :type="msg.typeUrl" :events="txLogs[i]?.events"
                  :chain="chain" />
              </div>
            </div>
          </div>
          <div v-if="messages.length === 0">{{ $t('tx.no_messages') }}</div>
        </div>
      </div>

      <div v-if="tab === 'log'">
        <div v-if="txLogs" class="bg-base-100 px-4 pt-3 pb-4 rounded shadow mb-4">
          
          <div v-for="(msg, i) in txLogs" :key="i">
            <div class="mt-4 bg-base-200 rounded-lg collapse collapse-arrow" :class="{
              'collapse-open': i === 0 && logOpens[i],
              'collapse-close': !logOpens[i]
            }">
              <input type="checkbox" class="cursor-pointer !h-10 block" @click="changeLogOpen(i)" />
              <div class="flex justify-between p-5 collapse-title"
                :class="{ 'border-b border-solid border-stone-700': logOpens[i]}">
                <h5 class="text-lg font-bold">#{{ i + 1 }}. {{ messages[i].displayType }}</h5>
              </div>
              <div class="collapse-content">
                <TransactionEvent :events="msg.events" />
              </div>
            </div>
          </div>
          <div v-if="txLogs.length === 0">{{ $t('tx.no_logs') }}</div>
        </div>
      </div>

      <div v-if="tab === 'json'">
        <div v-if="tx?.txResponse" class="bg-base-100 px-4 pt-3 pb-4 rounded shadow">
          <!-- <h2 class="card-title truncate mb-2">JSON</h2> -->
          <JsonViewer :value="wrapBinary(tx)" :theme="baseStore.theme" style="background: transparent; border: none"
            copyable sort expand-depth="5" boxed />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.jv-container .jv-code.boxed {
  max-height: fit-content;
  overflow-y: auto;
}
</style>

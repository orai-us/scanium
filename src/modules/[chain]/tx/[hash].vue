<script lang="ts" setup>
import gql from 'graphql-tag';
import { useQuery } from '@vue/apollo-composable';
import { useBaseStore, useBlockchain, useFormatter } from '@/stores';
import DynamicComponent from '@/components/dynamic/DynamicComponent.vue';
import { logs } from '@cosmjs/stargate';
import { JsonViewer } from 'vue3-json-viewer';
// if you used v1.0.5 or latster ,you should add import "vue3-json-viewer/dist/index.css"
import 'vue3-json-viewer/dist/index.css';
import { wrapBinary } from '@/libs/utils';
import { Icon } from '@iconify/vue';
import { ref, computed, watch } from 'vue';

const props = defineProps(['hash', 'chain']);

const format = useFormatter();
const baseStore = useBaseStore();
const transaction = ref({} as any);
const blockchain = useBlockchain();
const tx = ref({} as any);
const tab = ref('msg');

const query = gql`
      query GetTransaction($id: String!) {
        transaction(id:$id) {
          fee,
          gasUsed,
          code,
          blockNumber,
          sender,
          id,
          nodeId,
          timestamp,
          messages {
            nodes{
              type,
              subType,
              contract,
              sender,
            }
          }
        }
      }`;


if (props.hash) {
  blockchain.rpc.getTx(props.hash).then((x) => {
    tx.value = x;
  });
}

const variables = computed(() => {
  return {
    id: props.hash
  }
})

const { result } = useQuery(query, variables);

watch(result, () => {
  const txIndexer = result?.value?.transaction;
  if (!!txIndexer) {
    const { __typename, ...tx } = txIndexer;
    transaction.value = tx;
  }

})

const messages = computed(() => {
  const messages = result?.value?.transaction?.messages?.nodes || [];
  return messages.map((item: any) => {
    const { __typename, ...message } = item;
    return message
  })
});

const txLogs = computed(() => {
  return (
    result.value?.txResponse?.logs || logs.parseRawLog(transaction.value?.txResponse?.rawLog)
  );
});
</script>

<template>
  <div class="box-content !p-0">
    <div v-if="transaction" class="p-4 md:p-6">
      <h2 class="card-title truncate mb-2 text-white">{{ $t('tx.title') }}</h2>
      <div class="overflow-auto-x">
        <table class="table text-sm">
          <tbody>
            <tr>
              <td>{{ $t('tx.tx_hash') }}</td>
              <td>{{ transaction?.id ? transaction.id : "-" }}</td>
            </tr>
            <tr>
              <td>{{ $t('account.height') }}</td>
              <td>
                <RouterLink :to="`/${props.chain}/block/${transaction?.blockNumber}`"
                  class="text-primary dark:text-link" v-if="transaction?.blockNumber">
                  {{ transaction.blockNumber }}
                </RouterLink>
              </td>
            </tr>
            <tr>
              <td>{{ $t('staking.status') }}</td>
              <td>
                <span class="text-xs truncate relative py-2 w-fit mr-2 rounded inline-flex items-center" :class="`${transaction?.code === 0 ? 'text-[#39DD47]' : 'text-error'
                  }`">
                  <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp;
                  {{ transaction?.code === 0 ? 'Success' : 'Failed' }}
                </span>
              </td>
            </tr>
            <tr>
              <td>{{ $t('account.time') }}</td>
              <td>
                {{ format.toLocaleDate(Number(transaction?.timestamp)) }} ({{
                  format.toDay(Number(transaction?.timestamp), 'from')
                }})
              </td>
            </tr>
            <tr>
              <td>{{ $t('tx.gas') }}</td>
              <td>
                {{ transaction?.gasUsed }}
              </td>
            </tr>
            <tr>
              <td>{{ $t('tx.fee') }}</td>
              <td>
                {{
                  format.formatTokens(
                    transaction?.fee,
                    true,
                    '0,0.[00]'
                  )
                }}
              </td>
            </tr>
            <!-- <tr>
              <td>{{ $t('tx.memo') }}</td>
              <td>{{ tx.tx?.body?.memo || '--' }}</td>
            </tr> -->
          </tbody>
        </table>
      </div>
    </div>

    <div class="border-t border-b border-base-200">
      <div
        class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0 border-t border-b border-base-300 !rounded-none"
      >
        <a
          class="tab text-gray-400 capitalize !pb-3"
          :class="{ 'tab-active': tab === 'msg' }"
          @click="tab = 'msg'"
          >Messages ({{ messages.length }})</a
        >
        <a
          class="tab text-gray-400 capitalize !pb-2"
          :class="{ 'tab-active': tab === 'log' }"
          @click="tab = 'log'"
          >Logs ({{ txLogs.length }})</a
        >
        <a
          class="tab text-gray-400 capitalize !pb-2"
          :class="{ 'tab-active': tab === 'json' }"
          @click="tab = 'json'"
          >JSON</a
        >
      </div>

      <div v-show="tab === 'msg'">
        <div v-if="transaction" class="bg-base-100 px-4 pt-3 pb-4 rounded mb-4">
          <!-- <h2 class="card-title truncate mb-2">
            {{ $t('account.messages') }}: ({{ messages.length }})
          </h2> -->
          <div v-for="(msg, i) in messages">
            <div class="rounded-md mt-4">
              <DynamicComponent :value="msg" />
            </div>
          </div>
          <div v-if="messages.length === 0">{{ $t('tx.no_messages') }}</div>
        </div>
      </div>

      <div v-show="tab === 'log'">
        <div v-if="txLogs" class="bg-base-100 px-4 pt-3 pb-4 rounded shadow mb-4">
          <!-- <h2 class="card-title truncate mb-2">
            {{ $t('account.logs') }}: ({{ txLogs.length }})
          </h2> -->
          <div v-for="(msg, i) in txLogs">
            <div class="rounded-md mt-4">
              <DynamicComponent :value="msg" />
            </div>
          </div>
          <div v-if="txLogs.length === 0">{{ $t('tx.no_logs') }}</div>
        </div>
      </div>

      <div v-show="tab === 'json'">
        <div v-if="transaction" class="bg-base-100 px-4 pt-3 pb-4 rounded shadow">
          <!-- <h2 class="card-title truncate mb-2">JSON</h2> -->
          <JsonViewer
            :value="wrapBinary(tx)"
            :theme="baseStore.theme"
            style="background: transparent; border: none"
            copyable
            sort
            expand-depth="5"
            boxed
          />
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

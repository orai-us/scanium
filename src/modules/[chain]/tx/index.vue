<script lang="ts" setup>
import { CHAIN_INDEXS } from '@/constants';
import { useBaseStore, useBlockchain, useFormatter } from '@/stores';
import { shortenTxHash } from '@/utils';
import { Icon } from '@iconify/vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, ref, toRaw, watch, watchEffect } from 'vue';
const props = defineProps(['chain']);

const base = useBaseStore();
const format = useFormatter();
const blockchain = useBlockchain();
const detailTxs = ref({} as any);

const query = gql`
      query GetTransactions($orderBy: [TransactionsOrderBy!], $first: Int!, $offset: Int!) {
        transactions(orderBy: $orderBy, first: $first, offset:$offset) {
          results: nodes {
            id
            blockNumber
            gasUsed
            timestamp
            sender
            fee
            code
            messages {
              nodes {
                type
                subType
              }
            }
          }
          totalCount
        }
      }
`;

const variables = computed(() => {
  return {
    orderBy: "BLOCK_NUMBER_DESC",
    first: 10,
    offset: 0
  }
})

const { result } = useQuery(query, variables);

const transactions: any = computed(() => {
  console.log({ data: base.txsInRecents })
  let initTxs: never[] = []
  if (result.value && CHAIN_INDEXS.includes(props.chain)) {
    initTxs = result.value?.transactions?.results.map((item: any) => ({
      hash: item.id,
      code: item.code,
      timestamp: item.timestamp,
      messages: item.messages.nodes[0].type.split(".").slice(-1)[0],
      height: item.blockNumber,
      fee: item.fee[0] && `${item.fee[0].amount / 1e6} ${item.fee[0].denom.toUpperCase()}`
    }))
    return [...base.txsInRecents, ...initTxs]
  } else return base.txsInRecents
})

watch(transactions, () => {
  for (let tx of base.txsInRecents) {
    blockchain.rpc.getTx(tx.hash).then((x) => {
      detailTxs.value[tx.hash] = x;
    });
  }
})

</script>

<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl">
    <div class="bg-base-100 overflow-x-auto rounded-2xl px-5 pt-5">
      <table class="table w-full table-compact">
        <thead class="border border-base-200">
          <tr>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              Tx Hash
            </th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              Result
            </th>
            <th class="text-white text-xs font-bold">
              {{ $t('account.messages') }}
            </th>

            <th class="text-white text-xs font-bold">{{ $t('block.fees') }}</th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              {{ $t('account.height') }}
            </th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in transactions" :index="item.hash" class="hover:bg-base-300">
            <td class="truncate text-link">
              <RouterLink :to="`/${props.chain}/tx/${item.hash}`">{{
                shortenTxHash(item.hash)
                }}</RouterLink>
            </td>
            <td>
              <span class="text-xs truncate relative py-2 w-fit rounded inline-flex items-center" :class="`${detailTxs[item.hash]?.txResponse.code !== 0 ? 'text-error': 'text-[#39DD47]'
                }`" v-if="!!detailTxs[item.hash]?.txResponse?.timestamp">
                <!-- <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp; -->
                {{ detailTxs[item.hash]?.txResponse.code !== 0 ? 'Failed' : 'Success' }}
              </span>
              <span v-else-if="item.code !== null && item.code !== undefined" :class="`${item.code !== 0 ? 'text-error' : 'text-[#39DD47]'
                }`">
                {{ item.code !== 0 ? "Failed" : "Success" }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]">
                {{ item.messages || format.messages(item.tx?.body?.messages) }}
              </span>
            </td>

            <td>{{ item.fee || format.formatTokens(item.tx?.authInfo?.fee?.amount) }}</td>
            <td class="text-sm text-link">
              <RouterLink :to="`/${props.chain}/block/${item.height}`">{{
                item.height
                }}</RouterLink>
            </td>
            <td>
              <span v-if="!!detailTxs[item.hash]?.txResponse?.timestamp">
                {{ format.toLocaleDate(detailTxs[item.hash]?.txResponse?.timestamp) }} ({{
                format.toDay(detailTxs[item.hash]?.txResponse?.timestamp, 'from')
                }})
              </span>
              <span v-else-if="!!item.timestamp">
                {{ format.toLocaleDate(Number(item.timestamp)) }} ({{
                format.toDay(Number(item.timestamp), 'from')
                }})
              </span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="p-4 rounded-2xl">
        <div class="alert relative bg-transparent">
          <div class="alert absolute inset-x-0 inset-y-0 w-full h-full bg-info opacity-10"></div>
          <div class="text-info flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              class="stroke-current flex-shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{{ $t('block.only_tx') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<route>
    {
      meta: {
        i18n: 'transactions',
        order: 6
      }
    }
</route>

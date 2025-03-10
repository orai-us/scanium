<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { Icon } from '@iconify/vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, ref, toRaw, watchEffect } from 'vue';

const props = defineProps(['hash', 'chain']);
const format = useFormatter();
const tx = ref({} as any);

const query = gql`
      query GetTransactions($id: String!) {
        evmTransaction(id: $id) {
          results: 
            blockNumber
            cosmosTransactionId
            fee
            from
            id
            method
            status
            timestamp
            to
            value
        }
      }
    `;

const variables = computed(() => {
  return { id: props.hash }
});

const { result } = useQuery(query, variables);

watchEffect(() => {
  if (result.value?.evmTransaction) {
    tx.value = result.value.evmTransaction
  }
})

watchEffect(() => {
  console.log({ data: toRaw(tx.value) })
})

</script>
<template>
  <div class="box-content !p-0">
    <div class="p-4 md:p-6">
      <h2 class="card-title truncate mb-2 text-white xl:text-lg text-sm">{{ $t('tx.title') }}</h2>
      <div class="overflow-auto-x">
        <table class="table text-sm">
          <tbody>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Tx Evm Hash</td>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">{{ tx.id }}</td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Tx Cosmos Hash</td>
              <td class="xl:p-4 p-2">
                <RouterLink :to="`/${props.chain}/tx/${tx.cosmosTransactionId}`"
                  class="text-primary dark:text-link xl:text-sm text-xs">{{ tx.cosmosTransactionId}}
                </RouterLink>
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Height</td>
              <td class="xl:p-4 p-2">
                <RouterLink :to="`/${props.chain}/block/${tx.results}`"
                  class="text-primary dark:text-link xl:text-sm text-xs">{{ tx.results }}
                </RouterLink>
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Method</td>
              <td class="xl:p-4 p-2">
                {{ tx.method }}
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Status</td>
              <td class="xl:p-4 p-2" v-if="tx.status">
                <span class="truncate relative py-2 w-fit mr-2 rounded inline-flex items-center xl:text-sm text-xs"
                  :class="`${tx.status ? 'text-[#39DD47]' : 'text-error'
                    }`">
                  <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp;
                  {{ tx.status ? 'Success' : 'Failed' }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Time</td>
              <td class="xl:p-4 p-2 xl:text-sm text-xs" v-if="tx.timestamp">
                {{ format.timestampFrom(Number(tx.timestamp)) }}
              </td>
              <td class="xl:p-4 p-2 xl:text-sm text-xs" v-else>
                -
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Fee</td>
              <td class="xl:p-4 p-2 xl:text-sm text-xs" v-if="tx.fee !== null && tx.fee !== undefined">
                {{ `${tx.fee} aorai` }}
              </td>
              <td v-else>-</td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">Value</td>
              <td class="xl:p-4 p-2 xl:text-sm text-xs" v-if="tx.value !== null && tx.fee !== undefined">
                {{ `${tx.value} aorai` }}
              </td>
              <td v-else>-</td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">From</td>
              <td class="truncate py-3">
                <RouterLink :to="`/${chain}/account/${tx.from}`" class="text-primary dark:text-link">
                  {{ tx.from }}
                </RouterLink>
              </td>
            </tr>
            <tr>
              <td class="xl:p-4 p-2 xl:text-sm text-xs">To</td>
              <td class="truncate py-3">
                <RouterLink :to="`/${chain}/account/${tx.to}`" class="text-primary dark:text-link">
                  {{ tx.to }}
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
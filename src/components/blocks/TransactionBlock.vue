<script lang="ts" setup>
import { useFormatter } from "@/stores";
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import Pagination from "../pagination/Pagination.vue";
import { shortenTxHash } from "@/utils";

const props = defineProps(['txs', 'chain', 'height'])
const format = useFormatter();

// Transaction in contract
const transactions = ref();
const totalCount = ref();
const pagination = reactive({
  limit: 10,
  offset: 0
})

const query = gql`
      query GetTransactions($filter: TransactionFilter!, $orderBy: [TransactionsOrderBy!], $first: Int!, $offset: Int!) {
        transactions(filter: $filter, orderBy: $orderBy, first: $first, offset:$offset) {
          results: nodes {
            id
            blockNumber
            gasUsed
            timestamp
            sender
            fee
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
    filter: { blockNumber:{equalTo: props.height} },
    orderBy: "BLOCK_NUMBER_ASC",
    first: pagination.limit,
    offset: pagination.offset
  }
})

const { result, refetch } = useQuery(query, variables);

watchEffect(() => {
  if (result.value) {
    transactions.value = result.value.transactions.results;
    totalCount.value = result.value.transactions.totalCount;
  }
})

function handlePagination(page: number) {
  pagination.offset = page * pagination.limit
  refetch()
}

</script>

<template>
  <div>
    <table class="table table-compact w-full text-sm">
      <thead>
        <tr>
          <th>Tx Hash</th>
          <th>Result</th>
          <th>Message</th>
          <th>Height</th>
          <th>Amount</th>
          <th>Fee</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(tx) in transactions" :key="tx.id">
          <td class="truncate text-link">
            <RouterLink :to="`/${props.chain}/tx/${tx.id}`">
              {{ shortenTxHash(tx.id) }}
            </RouterLink>
          </td>
          <td>Success</td>
          <td>
            <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]">{{
              format.messages(tx.messages?.nodes.map((item: any) =>
                ({ "@type": item.type, typeUrl: item.type })
              )) }}</span>
          </td>
          <td class="truncate text-link">
            <RouterLink :to="`/${props.chain}/block/${tx.blockNumber}`">
              {{ tx.blockNumber }}
            </RouterLink>
          </td>
          <td>{{ tx.gasUsed }}</td>
          <!-- <td>{{ tx.fee[0]?.amount/10e6 }} {{ tx.fee[0]?.denom?.toUpperCase()}}</td> -->
          <td>0.000076 ORAI</td>
          <td>{{ format.toLocaleDate(new Date(Number(tx.timestamp))) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="text-center mt-4">
      <Pagination :totalItems="totalCount" :limit="pagination.limit" :onPagination="handlePagination" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useFormatter } from "@/stores";
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import Pagination from "../pagination/Pagination.vue";
import { shortenTxHash } from "@/utils";
import TransactionTable from "../TransactionTable.vue";

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
    const data = result.value.transactions.results;
    transactions.value = data.map((item: any) => ({
      txhash: shortenTxHash(item?.id),
      result: "Success",
      message: format.messages(item.messages?.nodes.map((item: any) =>
        ({ "@type": item.type, typeUrl: item.type })
      )),
      height: item.blockNumber,
      amount: 0,
      fee: `${Number(item.fee[0].amount) / 1e6} ${item?.fee[0].denom?.toUpperCase()}`,
      timestamp: format.toLocaleDate(new Date(Number(item.timestamp)))
    }));
    totalCount.value = result.value.transactions.totalCount;
  }
})

function handlePagination(page: number) {
  pagination.offset = page * pagination.limit
  refetch()
}

</script>

<template>
  <TransactionTable :transaction="transactions" :chain="chain" :txTotal="totalCount" :pagination="pagination"
    :handlePagination="handlePagination" />
</template>
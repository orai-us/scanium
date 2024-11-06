<script lang="ts" setup>
import { useFormatter } from "@/stores";
import { computed, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";

import TransactionTable from "../TransactionTable.vue";

const props = defineProps(['txs', 'chain', 'address'])
const format = useFormatter();

const transactions = ref()
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
    filter: {
      messages: {
        some: {
          sender: {
            equalTo: props.address,
          },
        },
      },
    },
    orderBy: "TIMESTAMP_DESC",
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
  <TransactionTable :transactions="transactions" :chain="chain" :txTotal="totalCount" :pagination="pagination"
    :handlePagination="handlePagination" />
</template>
<script lang="ts" setup>
import { useFormatter } from "@/stores";
import { computed, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import { shortenTxHash } from "@/utils";
import TransactionTable from "../TransactionTable.vue";

const props = defineProps(['txs', 'chain', 'address'])
const format = useFormatter();

const TRANSACTION_TYPE = {
  ALL: "Transactions",
  // QUERIES: "Queries",
  // EXECUTES: "Executes",
  // HISTORY: "History",
  // STATES: "States"
}

const tabTransaction = ref(TRANSACTION_TYPE.ALL);

// Transaction in contract
const transactions = ref();
const txTotal = ref();
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
    filter: {
      messages: {
        some: {
          contract: {
            equalTo: props.address,
          },
        },
      },
    },
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
    txTotal.value = result.value.transactions.totalCount;
  }
})

function handlePagination(page: number) {
  pagination.offset = page * pagination.limit
  refetch()
}

</script>

<template>
  <div class="box-content flex flex-col gap-4">
    <!-- <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0">
      <a v-for="(value) of TRANSACTION_TYPE" class="tab text-gray-400 capitalize !pb-3" :key="value"
        :class="{ 'tab-active': tabTransaction === value }" @click="tabTransaction = value">{{ value }}</a>
    </div> -->

    <h2 class="card-title truncate w-full">
      Transaction
    </h2>
    <TransactionTable :transaction="transactions" :chain="chain" :txTotal="txTotal" :pagination="pagination"
      :handlePagination="handlePagination" />
  </div>
</template>
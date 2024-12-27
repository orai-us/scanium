<script lang="ts" setup>
import BlockHeader from './BlockHeader.vue';
import BlockInformation from './BlockInformation.vue';
import TransactionTable from '../TransactionTable.vue';
import { computed, ref, toRaw, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import { useFormatter } from '@/stores';
import { toBase64 } from '@cosmjs/encoding';

const props = defineProps(['chain', 'height']);
const format = useFormatter();

const blockInformation = ref({} as any);

// Transaction in contract
const transactions = ref();
const totalCount = ref();
const pagination = reactive({
  limit: 10,
  offset: 0
});
const aggregates = ref();

const queryTransactions = gql`
      query GetTransactions($filter: TransactionFilter!, $orderBy: [TransactionsOrderBy!], $first: Int!, $offset: Int!) {
        transactions(filter: $filter, orderBy: $orderBy, first: $first, offset:$offset) {
          results: nodes {
            id
            blockNumber
            gasUsed
            timestamp
            sender
            code
            fee
            messages {
              nodes {
                type
                subType
              }
            }
          }
          totalCount
          aggregates {
            sum {
              gasUsed
              gasWanted
            }
          }
        }
      }
    `;

const transactionsVariables = computed(() => {
  return {
    filter: { blockNumber: { equalTo: props.height } },
    orderBy: "BLOCK_NUMBER_ASC",
    first: pagination.limit,
    offset: pagination.offset
  };
});

const { result: resultTxs, refetch } = useQuery(queryTransactions, transactionsVariables);

watchEffect(() => {
  if (resultTxs.value) {
    transactions.value = resultTxs.value.transactions.results;
    totalCount.value = resultTxs.value.transactions.totalCount;
    aggregates.value = resultTxs.value.transactions.aggregates;
  }
});

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
  refetch();
}

// Block detail
const queryBlock = gql`
query GetBlockDetail($filter: BlockFilter!, $first: Int!){
  blocks(filter: $filter,first: $first){
    results: nodes {
      id
      chainId
      round
      txCount
      proposerAddress
      time
      nodeId
    }
  }
}
`;
const blockVariables = computed(() => {
  return {
    filter: { height: { equalTo: props.height } },
    first: 1,
  };
});

const { result: resultBlock } = useQuery(queryBlock, blockVariables);

watchEffect(() => {
  if (resultBlock.value) {
    const blockDetail = resultBlock.value.blocks.results[0];
    console.log({ resultBlock: toRaw(blockDetail) });
    blockInformation.value = {
      'Time': format.toLocaleDate(new Date(Number(blockDetail.time))),
      'Chain': blockDetail.chainId,
      'Block Hash': toBase64(blockDetail.id),
      'Round': blockDetail.round,
      'TX Counts': blockDetail.txCount,
      'Proposer': format.validator(blockDetail.proposerAddress && toBase64(blockDetail.proposerAddress)),
      'Gas Used / Wanted': `${aggregates.value.sum?.gasUsed}/${aggregates.value.sum?.gasWanted}`
    };
  }
});

</script>

<template>
  <div>
    <BlockHeader :height="height" :chain="chain" />
    <BlockInformation :blockInformation="blockInformation" />
    <div class="box-content">
      <h2 class="card-title flex flex-row justify-between text-white">
        {{ $t('account.transactions') }}
      </h2>
      <div class="w-full h-[1px] bg-[#242627] my-2"></div>
      <TransactionTable :transactions="transactions" :chain="chain" :txTotal="totalCount" :limit="pagination.limit"
        :handlePagination="handlePagination" />
    </div>
  </div>
</template>

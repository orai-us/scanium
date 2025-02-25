<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import TransactionTable from "../TransactionTable.vue";
import { countTxsOnContract, getTxsOnContract, ParamsGetTx } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import { labelInOutTxs } from '@/utils';

const props = defineProps(['txs', 'chain', 'address']);
const route = useRoute();
const router = useRouter();

// Transaction in contract
const transactions = ref();
const txTotal = ref();

const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsOnContract(props.address, pagination);
    if (res) {
      transactions.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}


async function fetchCountTxs() {
  try {
    const res = await countTxsOnContract(props.address);
    if (res) {
      txTotal.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}

onMounted(() => {
  fetchCountTxs();
});

watchEffect(() => {
  fetchTxs(pagination.value);
});

const txHashes = computed(() => {
  return transactions.value?.map((tx: any) => tx.id);
});

const query = gql`
      query GetTransactions($filter: TransactionFilter!) {
        transactions(filter: $filter) {
          results: nodes {
            id
            messages {
              nodes {
                type
                subType
              }
            }
            tokenTransfers {
              nodes {
                denom
                from
                to
                amount
                type
              }
            }
          }
        }
      }
    `;

const variables = computed(() => {
  return {
    filter: {
      id: { in: txHashes.value }
    },
  };
});

const { result } = useQuery(query, variables);

const txsMerge = computed(() => {
  const txsOptimal = transactions.value;
  const txsIndexer = result.value?.transactions?.results;

  const data = txsOptimal?.map((txOptimal: any) => {
    const searchTx = txsIndexer?.find((txIndexer: any) => txIndexer.id === txOptimal.id);
    const messages = searchTx?.messages;
    const tokenTransfers = searchTx?.tokenTransfers;

    return {
      ...txOptimal,
      messages,
      tokenTransfers
    };
  });

  return labelInOutTxs(data, props.address);
});

async function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page } });
}

</script>
<template>
  <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="txTotal" :limit="pagination.limit"
    :handlePagination="handlePagination" />
</template>

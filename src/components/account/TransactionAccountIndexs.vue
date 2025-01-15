<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

import TransactionTable from "../TransactionTable.vue";
import { labelInOutTxs } from "@/utils";
import { countTxsByAccount, getTxsByAccount, ParamsGetTx } from "@/service/transactionsService";
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(['txs', 'chain', 'address']);

const route = useRoute();
const router = useRouter();
const transactions = ref([]);
const totalCount = ref();
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsByAccount(props.address, pagination);
    if (res) {
      transactions.value = res.data;
    }
  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountTxs() {
  try {
    const res = await countTxsByAccount(props.address);
    if (res) {
      totalCount.value = res.data;
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

async function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page } });
}

// parse massage txs
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
})

</script>
<template>
  <div>
    <div>
      <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="totalCount" :pagination="pagination"
        :handlePagination="handlePagination" :displayStatus="true" :page="pagination.page" />
    </div>
  </div>
</template>

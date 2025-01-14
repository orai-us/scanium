<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

import TransactionTable from "../TransactionTable.vue";
import { formatNumber } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { countTxsByDenom, getTxsByDenom, mergeTxsOptimalAndIndexer, ParamsGetTx } from '@/service/transactionsService';

const props = defineProps(['denom', 'chain']);

const route = useRoute();
const router = useRouter();
const transactions = ref();
const totalCount = ref(0);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});
const denom = computed(() => {
  if (props.denom?.includes("cw20:")) {
    return props.denom.split("cw20:")[1];
  }
  return props.denom;
})

async function fetchTxs(pagination: ParamsGetTx) {
  try {
    const res = await getTxsByDenom(encodeURIComponent(denom.value), pagination);
    if (res) {
      transactions.value = res.data;
    }

  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountTxs() {
  try {
    const res = await countTxsByDenom(encodeURIComponent(denom.value));
    if (res) {
      totalCount.value = res.data;
    }
  } catch (error) {

  }
}

onMounted(() => {
  fetchCountTxs();
});

watchEffect(() => {
  fetchTxs(pagination.value);
});

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/assets/${encodeURIComponent(props.denom)}`, query: { ...route.query, page } });
}

//Get message txs
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

  return mergeTxsOptimalAndIndexer(txsOptimal, txsIndexer);
})

</script>

<template>
  <div>
    <div class="mb-3">
      <span class="text-white font-bold">There are <span class="text-[#CBAEFF]">{{ formatNumber(totalCount || 0)
          }}</span>
        transactions</span>
    </div>
    <TransactionTable :transactions="txsMerge" :chain="chain" :txTotal="totalCount" :pagination="pagination"
      :handlePagination="handlePagination" :page="pagination.page" />
  </div>
</template>

<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, onMounted, ref, watchEffect } from 'vue';
import TransactionTable from '../TransactionTable.vue';
import { getTsxEvmByAccount } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(["address", "chain"]);

const transactionsCosmos = ref([] as Array<any>);
const route = useRoute();
const router = useRouter();
const txsEvm = ref([] as Array<any>);

const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    limit: 10,
    page
  };
});

async function fetchTsxEvmByAccount() {
  try {
    const res = await getTsxEvmByAccount(props.address, pagination.value);
    if (Array.isArray(res?.data)) {
      txsEvm.value = res.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(() => {
  fetchTsxEvmByAccount()
})

const txHashes = computed(() => {
  if (Array.isArray(txsEvm.value)) {
    return txsEvm.value.map((item) => item.cosmosTransactionId)
  }
  return []
})

const queryTx = gql`
      query GetTransactions($filter: TransactionFilter!) {
        transactions(filter: $filter) {
          results: nodes {
            id
            blockNumber
            timestamp
            fee
            code
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

const variablesTx = computed(() => {
  return {
    filter: {
      id: { in: txHashes.value }
    },
  };
});

const { result: resultTxs } = useQuery(queryTx, variablesTx);

watchEffect(() => {
  if (Array.isArray(resultTxs.value?.transactions?.results) && Array.isArray(txsEvm.value)) {
    const txs = resultTxs.value.transactions.results;
    transactionsCosmos.value = txsEvm.value.map((item) => {
      const tx = txs.find((tx: any) => tx.id === item.cosmosTransactionId);
      return tx
    })
  }
})


function handlePrevious() {
  const page = pagination.value.page;
  if (page === 1) return
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page: page - 1 } });
}

function handleNext() {
  const page = pagination.value.page;
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page: page + 1 } });
}

</script>

<template>
  <div>
    <TransactionTable :transactions="transactionsCosmos" :chain="chain" />
    <div class="flex items-center justify-center w-full mt-5">
      <button class="flex justify-center items-center px-4 py-2 bg-base rounded-s-lg w-20 border-r-2 border-[#383B40]"
        v-on:click="handlePrevious">Previous</button>
      <button class="flex justify-center items-center px-4 py-2 bg-base rounded-e-lg w-20"
        v-on:click="handleNext">Next</button>
    </div>
  </div>
</template>
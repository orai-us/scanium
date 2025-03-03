<script lang="ts" setup>
import { getTxsTokenTransfer } from '@/service/transactionsService';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TransactionTable from '../TransactionTable.vue';

const props = defineProps(["address", "chain"])
const route = useRoute();
const router = useRouter();
const tokenTransfers = ref([]);

const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    limit: 10,
    page
  };
});

async function fetchTxsTokenTransfer() {
  try {
    const chain = props.chain === "Oraichain" ? "orai" : props.chain;
    const response = await getTxsTokenTransfer(chain, props.address, pagination.value);
    if (!!response) {
      tokenTransfers.value = response.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(() => {
  fetchTxsTokenTransfer()
})

watch([() => props.address, () => pagination.value.page], () => {
  fetchTxsTokenTransfer()
})

const txHashes = computed(() => {
  return tokenTransfers.value?.map((tx: any) => tx.transactionId);
});

const query = gql`
     query GetTransactions($filter: TransactionFilter!) {
      transactions(filter: $filter) {
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

const transactions = computed(() => {
  const txsIndexer = result.value?.transactions?.results;
  if (Array.isArray(txsIndexer) && Array.isArray(tokenTransfers.value)) {
    const result: any[] | undefined = [];
    tokenTransfers.value.forEach((item: any) => {
      let state = "";
      const txTransfer: any = txsIndexer.find((tx: any) => tx.id === item.transactionId);
      if (txTransfer) {
        if (item?.from === props.address) state = "OUT"
        else state = "IN"
        result.push({
          ...txTransfer,
          state
        })
      }
    })
    return result
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
  <TransactionTable :transactions="transactions" :chain="chain" :limit="pagination.limit" :displayStatus="true" />
  <div class="flex items-center justify-center w-full mt-5">
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-s-lg w-20 border-r-2 border-[#383B40]"
      v-on:click="handlePrevious">Previous</button>
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-e-lg w-20"
      v-on:click="handleNext">Next</button>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsTransfers',
};
</script>

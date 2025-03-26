<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import TransactionTable from "../TransactionTable.vue";
import { getTxsByBlock } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(['chain', 'height'])

// Transaction in contract
const route = useRoute();
const router = useRouter();
const transactions = ref();
const totalCount = ref();
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});

async function fetchTxsByBlock() {
  try {
    const res = await getTxsByBlock(props.height, pagination.value);
    if (Array.isArray(res?.data)) {
      transactions.value = res.data.map((tx: any) => ({
        ...tx,
        messages: {
          nodes: tx.transactionMessages
        }
      }))
    }
  } catch (error) {
    console.log({ error })
  }
}

watchEffect(()=>{
  fetchTxsByBlock()
})

function handlePrevious() {
  const page = pagination.value.page;
  if (page === 1) return
  router.push({ path: route.fullPath, query: { ...route.query, page: page - 1 } });
}

function handleNext() {
  const page = pagination.value.page;
  router.push({ path: route.fullPath, query: { ...route.query, page: page + 1 } });
}

</script>

<template>
  <TransactionTable :transactions="transactions" :chain="chain" :txTotal="totalCount" :limit="pagination.limit" />
  <div class="flex items-center justify-center w-full mt-5">
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-s-lg w-20 border-r-2 border-[#383B40]"
      v-on:click="handlePrevious">Previous</button>
    <button class="flex justify-center items-center px-4 py-2 bg-base rounded-e-lg w-20"
      v-on:click="handleNext">Next</button>
  </div>
</template>

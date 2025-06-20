<script lang="ts" setup>
import { computed } from 'vue';
import TransactionsTransfers from "./TransactionsTransfers.vue";
import TransactionAccountIndexs from './TransactionAccountIndexs.vue';
import TransactionAccountRpc from './TransactionAccountRpc.vue';
import { CHAIN_INDEXS } from '@/constants';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import TransactionTransferIndexs from './TransactionTransferIndexs.vue';
import TransactionsEvm from './TransactionsEvm.vue';
import TransactionsTransfersEvm from './TransactionsTransfersEvm.vue';

const props = defineProps(['address', 'chain', 'txs']);

const TRANSACTION_TYPE = {
  ALL: "all",
  TRANSFERS: "transfers",
}
const route = useRoute();
const router = useRouter();
const txType = computed(() => {
  return route.query.type || TRANSACTION_TYPE.ALL;
})

function changeTypeTx(tx: string) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, type: tx, page: 1 } });
}

function downloadCSV() {
  router.push({ path: `/${props.chain}/csv?type=${txType.value}`, query: { ...route.query, address: props.address } });
}

// Handle route updates
onBeforeRouteUpdate((to, from, next) => {
  // Force component to re-fetch data or update state when route changes
  if (from.path.includes('/csv') && to.path.includes('/account')) {
    // You can add any necessary data refetching logic here
    console.log('Returning from CSV page, updating component...');
  }
  next();
});
</script>

<template>
  <div
    :key="$route.fullPath"
    class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]"
  >
    <!-- <h2 class="card-title mb-4 text-white">
      {{ $t('account.transactions') }}
    </h2> -->
    <div class="flex gap-2 mb-4">
      <button :class="{ 'px-2 py-1 bg-base rounded-md text-white': txType === TRANSACTION_TYPE.ALL }"
        v-on:click="changeTypeTx(TRANSACTION_TYPE.ALL)">
        {{ $t('account.transactions') }}
      </button>
      <button :class="{ 'px-2 py-1 bg-base rounded-md text-white': txType === TRANSACTION_TYPE.TRANSFERS }"
        v-on:click="changeTypeTx(TRANSACTION_TYPE.TRANSFERS)">
        Token Transfers
      </button>
    </div>
    <div v-show="txType === TRANSACTION_TYPE.ALL">
      <div v-if="CHAIN_INDEXS.includes(chain)">
        <TransactionsEvm :address="address" :chain="chain" v-if="address.startsWith('0x')" />
        <TransactionAccountIndexs :chain="chain" :address="address" v-else />
      </div>
      <div v-else>
        <TransactionAccountRpc :address="address" :chain="chain" :txs="txs" />
      </div>
    </div>
    <div v-show="txType === TRANSACTION_TYPE.TRANSFERS">
      <div v-if="CHAIN_INDEXS.includes(chain)">
        <TransactionsTransfersEvm :address="address" :chain="chain" v-if="address.startsWith('0x')" />
        <TransactionTransferIndexs :address="address" :chain="chain" v-else />
      </div>
      <div v-else>
        <TransactionsTransfers :address="address" :chain="chain" />
      </div>
    </div>
    <div class="flex justify-end">
      <div
        @click="downloadCSV"
        class="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Download CSV</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsHistory',
};
</script>

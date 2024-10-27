<script lang="ts" setup>
import { ref } from 'vue';
import TransactionsTransfers from "./TransactionsTransfers.vue";
import TransactionAll from "./TransactionsAll.vue";

const props = defineProps(['address', 'chain']);

const TRANSACTION_TYPE = {
  ALL: "tx-all",
  TRANSFERS: "transfers",
}
const txType = ref(TRANSACTION_TYPE.ALL);

function changeTypeTx(tx: string) {
  txType.value = tx
  // if (tx === TRANSACTION_TYPE.CW20) txs.value = txsTransfers.value?.filter(tx => tx.transactionType === TRANSACTION_TYPE.CW20)
  // else txs.value = txsTransfers.value
}

</script>

<template>
  <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
    <!-- <h2 class="card-title mb-4 text-white">
      {{ $t('account.transactions') }}
    </h2> -->
    <div class="flex gap-2 mb-4">
      <button :class="{ 'px-2 py-1 bg-base rounded-md': txType === TRANSACTION_TYPE.ALL }"
        v-on:click="changeTypeTx(TRANSACTION_TYPE.ALL)">
        {{ $t('account.transactions') }}
      </button>
      <button :class="{ 'px-2 py-1 bg-base rounded-md': txType === TRANSACTION_TYPE.TRANSFERS }"
        v-on:click="changeTypeTx(TRANSACTION_TYPE.TRANSFERS)">
        Transaction transfers
      </button>
    </div>
    <div v-show="txType === TRANSACTION_TYPE.ALL">
      <TransactionAll :chain="chain" />
    </div>
    <div v-show="txType === TRANSACTION_TYPE.TRANSFERS">
      <TransactionsTransfers :address="address" :chain="chain" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsHistory',
};
</script>
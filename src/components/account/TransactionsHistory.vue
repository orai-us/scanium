<script lang="ts" setup>
import { computed } from 'vue';
import TransactionsTransfers from "./TransactionsTransfers.vue";
import TransactionAccountIndexs from './TransactionAccountIndexs.vue';
import TransactionAccountRpc from './TransactionAccountRpc.vue';
import { CHAIN_INDEXS } from '@/constants';
import { useRoute, useRouter } from 'vue-router';
import TransactionTransferIndexs from './TransactionTransferIndexs.vue';
import TransactionsEvm from './TransactionsEvm.vue';

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

</script>

<template>
  <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
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
        <TransactionTransferIndexs :address="address" :chain="chain" />
      </div>
      <div v-else>
        <TransactionsTransfers :address="address" :chain="chain" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsHistory',
};
</script>

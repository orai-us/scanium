<script lang="ts" setup>
import TransactionsEvm from '@/components/account/TransactionsEvm.vue';
import TransactionsTransfersEvm from '@/components/account/TransactionsTransfersEvm.vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(["address", "chain"]);
const route = useRoute();
const router = useRouter();
const txType = computed(() => {
  return route.query.type || TRANSACTION_TYPE.ALL;
})

const TRANSACTION_TYPE = {
  ALL: "all",
  TRANSFERS: "transfers",
}

function changeTypeTx(tx: string) {
  router.push({ path: `/${props.chain}/contracts-evm/${props.address}`, query: { ...route.query, type: tx, page: 1 } });
}

</script>

<template>
  <div>
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="flex items-center">
        <div class="flex flex-1 flex-col truncate pl-4">
          <h2 class="text-sm card-title">Contract EVM</h2>
          <span class="truncate text-lg text-white"> {{ address }}</span>
        </div>
      </div>
    </div>
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
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
        <TransactionsEvm :address="address" :chain="chain" />
      </div>
      <div v-show="txType === TRANSACTION_TYPE.TRANSFERS">
        <TransactionsTransfersEvm :address="address" :chain="chain" />
      </div>
    </div>
  </div>
</template>

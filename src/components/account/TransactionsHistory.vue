<script lang="ts" setup>
import { TxsHistory } from '@/libs/client';
import { useFormatter } from '@/stores';
import { onMounted, ref } from 'vue';
import { getHistoryTxs } from '@/service/transactionsService';

const props = defineProps(['address', 'chain']);
const txsHistory = ref({} as TxsHistory[]);
const txs = ref({} as TxsHistory[]);
const format = useFormatter();
const txType = ref("tx-all");

onMounted(()=>{
  fetchTransaction()
})

async function fetchTransaction() {
  try {
    const params = {
      addrByNetworks: `${props?.chain}+${props?.address}`,
      limit: 10, 
      offset: 0
    }
    const response = await getHistoryTxs(params)
    if (!!response) {
      txsHistory.value = response.data;
      txs.value = response.data;
    }
  } catch (error) {
    txs.value = []
  }
}

function changeTypeTx(tx: string) {
  txType.value = tx
  if (tx === "tx-cw-20") txs.value = txsHistory.value.filter(tx => tx.transactionType === "cw20")
  else txs.value = txsHistory.value
}
</script>

<template>
  <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
    <h2 class="card-title mb-4 text-white">
      {{ $t('account.transactions') }}
    </h2>
    <div class="flex gap-2 mb-4">
      <button :class="{ 'px-2 py-1 bg-base rounded-md': txType === 'tx-all' }" v-on:click="changeTypeTx('tx-all')">
        {{ $t('account.transactions') }}
      </button>
      <button :class="{ 'px-2 py-1 bg-base rounded-md': txType === 'tx-cw-20' }" v-on:click="changeTypeTx('tx-cw-20')">
        CW-20 Token Transactions
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="table w-full text-sm">
        <thead>
          <tr>
            <th class="py-3">{{ $t('account.height') }}</th>
            <th class="py-3">{{ $t('account.hash') }}</th>
            <th class="py-3">{{ $t('account.messages') }}</th>
            <th class="py-3">{{ $t('account.time') }}</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="txs.length === 0">
            <td colspan="10">
              <div class="text-center">
                {{ $t('account.no_transactions') }}
              </div>
            </td>
          </tr>
          <tr v-for="(v, index) in txs" :key="index">
            <td class="text-sm py-3">
              <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
                v.height }}
              </RouterLink>
            </td>
            <td class="truncate py-3" style="max-width: 200px">
              <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
                {{ v.txhash }}
              </RouterLink>
            </td>
            <td class="flex items-center py-3">
              <!-- <div class="mr-2">
                    {{ format.messages(v.txRaw.body.messages) }}
                  </div>
                  <Icon v-if="v.result.code === 0" icon="mdi-check" class="text-success text-lg" />
                  <Icon v-else icon="mdi-multiply" class="text-error text-lg" /> -->
            </td>
            <td class="py-3">
              <span v-if="v.timestamp" class="text-xs">({{ format.toDay(v.timestamp, 'from') }})</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script lang="ts">
export default {
  name: 'TransactionsHistory',
};
</script>
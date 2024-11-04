<script lang="ts" setup>
import { TxsHistory } from '@/libs/client';
import { useFormatter } from '@/stores';
import { onMounted, reactive, ref, watch } from 'vue';
import { getHistoryTxs } from '@/service/transactionsService';
import TransactionTable from '../TransactionTable.vue';

const props = defineProps(['address', 'chain']);
const txs = ref({} as TxsHistory[]);
const format = useFormatter();
const txTotal = ref(0)

const pagination = reactive({
  limit: 10,
  offset: 0
})
onMounted(()=>{
  fetchTransaction()
})

async function fetchTransaction() {
  try {
    const params = {
      addrByNetworks: `${props?.chain}+${props?.address}`,
      limit: pagination.limit,
      offset: pagination.offset
    }
    const response = await getHistoryTxs(params)
    if (!!response) {
      txs.value = response.data.map((item: any) => ({
        txhash: item.txhash,
        result:  item.status ? "Success" : "Failed",
        message: "",
        height: item.height,
        amount:  `${Number(item.amount[0]) / 1e6} ${item?.tokenInfos[0].denom?.toUpperCase()}`,
        fee: `${Number(item.fee[0]) / 1e6} ${item?.tokenInfos[0].denom?.toUpperCase()}`,
        timestamp: format.toLocaleDate(new Date(Number(item.timestamp * 1000)))
      }));
      txTotal.value = response.totalRecord;
    }
  } catch (error) {
    txs.value = []
  }
}

watch(pagination, () => {
  fetchTransaction()
})

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit
}
</script>

<template>
  <div>
    <TransactionTable :transaction="txs" :chain="chain" :txTotal="txTotal" :pagination="pagination" :handlePagination="handlePagination" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsTransfers',
};
</script>
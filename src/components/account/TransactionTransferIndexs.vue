<script lang="ts" setup>
import { countTxsTokenTransfer, getListTxByTxHashes, getTxsTokenTransfer } from '@/service/transactionsService';
import { useQuery } from '@vue/apollo-composable';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatSmallNumber, shortenTxHash } from '@/utils';
import { useFormatter } from '@/stores';
import { tokenMap } from '@/libs/amm-v3';
import { formatTitle } from '@/libs/utils';
import TokenElement from '../dynamic/TokenElement.vue';
import Pagination from '../pagination/Pagination.vue';

const props = defineProps(["address", "chain"])
const format = useFormatter();
const route = useRoute();
const router = useRouter();
const tokenTransfers = ref([]);
const txByTxHashes = ref([] as Array<any>);
const totalTxs = ref(0);
const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    limit: 10,
    page
  };
});

async function fetchTxsTokenTransfer() {
  try {
    const response = await getTxsTokenTransfer(props.address, pagination.value);
    if (!!response) {
      tokenTransfers.value = response.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

async function fetchCountTxs(){
  try {
    const res = await countTxsTokenTransfer(props.address);
    if (res?.data) {
      totalTxs.value = Number(res.data);
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(() => {
  fetchTxsTokenTransfer()
})

watchEffect(() => {
  if (props.address)
    fetchCountTxs()
})

watch([() => props.address, () => pagination.value.page], () => {
  fetchTxsTokenTransfer()
})

const txHashes = computed(() => {
  return tokenTransfers.value?.map((tx: any) => tx.transactionId);
});

async function fetchListTxByTxHashes (txHashes: Array<any>){
  try {
    const res = await getListTxByTxHashes(txHashes);
    if (Array.isArray(res?.data)) {
      txByTxHashes.value = res.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

watch(() => txHashes.value, () => {
  if (Array.isArray(txHashes.value))
    fetchListTxByTxHashes(txHashes.value)
})

const transactions = computed(() => {
  const txsIndexer = txByTxHashes.value;
  if (Array.isArray(txsIndexer) && Array.isArray(tokenTransfers.value) && tokenMap) {
    const result: any[] | undefined = [];
    tokenTransfers.value.forEach((item: any) => {
      let state = "";
      const txTransfer: any = txsIndexer.find((tx: any) => tx.id === item.transactionId);
      if (txTransfer) {
        if (item?.from === props.address) state = "OUT"
        else state = "IN"
        const txhash = txTransfer.id;
        const status = txTransfer.code === 0 ? "Success" : "Failed";
        const height = txTransfer.blockNumber;
        const fees = txTransfer.fee;
        let denomTransfer = item.denom;
        let amountTransfer = item.amount;
        if (denomTransfer !== "aorai") {
          const tokenInfoTransfer = tokenMap[denomTransfer];
          if (tokenInfoTransfer) {
            denomTransfer = tokenInfoTransfer.coinDenom;
            amountTransfer = formatSmallNumber(amountTransfer / 10 ** tokenInfoTransfer.coinDecimals);
          }
        }
        if(denomTransfer === "aorai"){
          amountTransfer = formatSmallNumber(amountTransfer / 10 ** 18, 18);
        }
        let timestamp: any = "-";
        if (!!txTransfer.timestamp)
          timestamp = format.toDay(new Date(Number(txTransfer.timestamp)), 'from')

        const nodeMessages = txTransfer.transactionMessages;
        let numberMessageRemain = 0;
        let message: any = "";
        if (Array.isArray(nodeMessages)) {
          const firstNodeMessage = nodeMessages[0];
          const formatMessage = nodeMessages[0]?.subType || format.messages([{ "@type": firstNodeMessage?.type, typeUrl: firstNodeMessage?.type }]);
          message = formatTitle(formatMessage || "");
          numberMessageRemain = nodeMessages.length > 1 ? nodeMessages.length - 1 : 0;
        }

        result.push({
          txhash,
          result: status,
          message,
          height,
          fee: fees[0],
          status: state,
          token: denomTransfer,
          amount: amountTransfer,
          timestamp,
          numberMessageRemain
        })
      }
    })
    return result
  }
  return []
})

function handlePrevious() {
  const page = pagination.value.page;
  if (page === 1) return
  router.push({ path: `${route.fullPath}`, query: { ...route.query, page: page - 1 } });
}

function handleNext() {
  const page = pagination.value.page;
  router.push({ path: `${route.fullPath}`, query: { ...route.query, page: page + 1 } });
}

function handlePagination(page: number) {
  router.push({ path: `${route.fullPath}`, query: { ...route.query, page } });
}

</script>
<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm" v-if="transactions?.length > 0">
      <thead>
        <tr>
          <th>Tx Hash</th>
          <th>Result</th>
          <th>Message</th>
          <th>Height</th>
          <th>Fee</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Token</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(v, index) in transactions" :key="v.uniqKey">
          <td class="truncate py-3" style="max-width: 200px">
            <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
              {{ shortenTxHash(v.txhash) }}
            </RouterLink>
          </td>
          <td class="text-sm py-3" :class="`${v.result === 'Success' ? 'text-[#39DD47]' : 'text-error'
            }`">
            {{ v.result }}
          </td>
          <td class="flex gap-1 text-sm py-3">
            <span
              class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] h-full w-fit flex justify-center items-center">{{
                v.message }}</span>
            <span v-if="v.numberMessageRemain">+{{ v.numberMessageRemain }}</span>
          </td>
          <td class="text-sm py-3">
            <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
              v.height }}
            </RouterLink>
          </td>
          <td class="py-3">
            <TokenElement :value="v.fee"/>
          </td>
          <td class="py-3">
            <div class="flex gap-2">
              <button class="btn btn-xs  border rounded-lg " v-if="v.status" :class="{
                '!bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)]': v.status === 'IN',
                '!bg-[rgba(255,82,82,0.20)] !text-[#FF5252] border-[rgba(255,82,82,0.20)]': v.status === 'OUT'
              }">
                {{ v.status }}
              </button>
            </div>
          </td>
          <td class="py-3">
            <span v-html="v.amount"></span>
          </td>
          <td class="py-3">
            <span>{{ v.token }}</span>
          </td>
          <td class="!break-normal">
            <span v-if="v.timestamp">{{ v.timestamp }}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transactions</td>
    </div>
    <div>
      <div class="mt-4 text-center" v-if="totalTxs">
        <Pagination :totalItems="totalTxs" :limit="pagination.limit" :onPagination="handlePagination" :page="pagination.page" />
      </div>
      <div class="flex items-center justify-center w-full mt-5" v-else>
        <button class="flex justify-center items-center px-4 py-2 bg-base rounded-s-lg w-20 border-r-2 border-[#383B40]"
          v-on:click="handlePrevious">Previous</button>
        <button class="flex justify-center items-center px-4 py-2 bg-base rounded-e-lg w-20"
          v-on:click="handleNext">Next</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsTransfers',
};
</script>

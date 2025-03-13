<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { countTxsEvmByAccount, getTxsEvmByAccount } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import { shortenTxHash } from '@/utils';
import { useFormatter } from '@/stores';
import TokenElement from '../dynamic/TokenElement.vue';
import Pagination from '../pagination/Pagination.vue';

const props = defineProps(["address", "chain"]);

const route = useRoute();
const router = useRouter();
const format = useFormatter();
const txsEvm = ref([] as Array<any>);
const totalTx = ref(0);

const pagination = computed(() => {
  const page = route.query.page ? Number(route.query.page) : 1;
  return {
    page,
    limit: 10,
  };
});

async function fetchTsxEvmByAccount() {
  try {
    const res = await getTxsEvmByAccount(props.address, pagination.value);
    if (Array.isArray(res?.data)) {
      txsEvm.value = res.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

async function fetchTotalTx() {
  try {
    const res = await countTxsEvmByAccount(props.address);
    if (res.data) {
      totalTx.value = Number(res.data)
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(()=>{
  fetchTsxEvmByAccount()
  fetchTotalTx()
})


watch([() => props.address, () => pagination.value.page], () => {
  fetchTsxEvmByAccount()
  fetchTotalTx()
})

function handlePagination(page: number) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, page } });
}

</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm" v-if="txsEvm?.length > 0">
      <thead>
        <tr>
          <th>EVM Tx Hash</th>
          <th>Tx Hash</th>
          <th>Method</th>
          <th>Result</th>
          <th>Height</th>
          <th>From</th>
          <th>To</th>
          <th>Fee</th>
          <!-- <th>Value</th> -->
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(v, index) in txsEvm" :key="v.id">
          <td class="truncate py-3">
            <RouterLink :to="`/${chain}/tx/${v.id}`" class="text-primary dark:text-link" v-if="v.id">
              {{ shortenTxHash(v.id) }}
            </RouterLink>
          </td>
          <td class="truncate py-3" style="max-width: 200px">
            <RouterLink :to="`/${chain}/tx/${v.cosmosTransactionId}`" class="text-primary dark:text-link" v-if="v.cosmosTransactionId">
              {{ shortenTxHash(v.cosmosTransactionId) }}
            </RouterLink>
          </td>
          <td>
            <span
              class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] h-full w-fit flex justify-center items-center">{{
              v.method }}</span>
          </td>
          <td class="text-sm py-3" :class="`${v.status ? 'text-[#39DD47]' : 'text-error'}`">
            {{ v.status ? "Success" : "Failed" }}
          </td>
          <td class="text-sm py-3">
            <RouterLink :to="`/${chain}/block/${v.blockNumber}`" class="text-primary dark:text-link" v-if="v.blockNumber">{{ v.blockNumber }}
            </RouterLink>
          </td>
          <td class="truncate py-3">
            <RouterLink :to="`/${chain}/account/${v.from}`" class="text-primary dark:text-link" v-if="v.from">
              {{ shortenTxHash(v.from) }}
            </RouterLink>
          </td>
          <td class="truncate py-3">
            <RouterLink :to="`/${chain}/account/${v.to}`" class="text-primary dark:text-link" v-if="v.to">
              {{ shortenTxHash(v.to) }}
            </RouterLink>
          </td>
          <td class="py-3 flex gap-1">
            <TokenElement :value="{amount: v.fee, denom:'aorai'}"/>
          </td>
          <!-- <td class="py-3">
            <span>{{ `${formatNumber(v.value)} aorai` }}</span>
          </td> -->
          <td>
            <button class="btn btn-xs  border rounded-lg " :class="{
              '!bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)]': v.from !== address,
              '!bg-[rgba(255,82,82,0.20)] !text-[#FF5252] border-[rgba(255,82,82,0.20)]': v.from === address
            }">
              {{ v.from === address ? "OUT" : "IN" }}
            </button>
          </td>
          <td class="!break-normal">
            <span v-if="v.timestamp">{{ format.toDay(new Date(Number(v.timestamp)), 'from')}}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transactions</td>
    </div>
    <div class="mt-4 text-center" v-if="totalTx">
      <Pagination :totalItems="totalTx" :limit="pagination.limit" :onPagination="handlePagination" :page="pagination.page" />
    </div>
  </div>
</template>
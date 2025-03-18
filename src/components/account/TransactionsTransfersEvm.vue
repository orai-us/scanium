<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { countTxsEvmTokenTransfers, getTxsEvmTokenTransfers } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import { formatNumber, shortenTxHash } from '@/utils';
import { useFormatter } from '@/stores';
import Pagination from '../pagination/Pagination.vue';
import web3Service from '@/service/web3Service';

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
    const res = await getTxsEvmTokenTransfers(props.address, pagination.value);
    if (Array.isArray(res?.data)) {
      txsEvm.value = res.data.map((item: any) => {
        const id = item.id;
        let linkTxEvm = id;
        const splitId = id.split("-");
        if (splitId[0]) linkTxEvm = splitId[0]
        return {
          ...item,
          linkTxEvm
        }
      });
    }
  } catch (error) {
    console.log({ error })
  }
}

async function fetchTotalTx() {
  try {
    const res = await countTxsEvmTokenTransfers(props.address);
    if (res.count) {
      totalTx.value = Number(res.count)
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(() => {
  fetchTsxEvmByAccount()
  fetchTotalTx()
})


watch([() => props.address, () => pagination.value.page], () => {
  fetchTsxEvmByAccount()
  fetchTotalTx()
})

function handlePagination(page: number) {
  router.push({ path: `${route.fullPath}`, query: { ...route.query, page } });
}

async function handleRedirect(address: string) {
  const isAccount = await web3Service.isAccountEVM(address);
  if (isAccount)
    router.push({ path: `/${props.chain}/account/${address}` })
  else
    router.push({ path: `/${props.chain}/contracts-evm/${address}` })
}

</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm" v-if="txsEvm?.length > 0">
      <thead>
        <tr>
          <th>EVM Tx Hash</th>
          <th>Contract Address</th>
          <th>Height</th>
          <th>From</th>
          <th>To</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(v, index) in txsEvm" :key="v.id">
          <td class="truncate py-3">
            <RouterLink :to="`/${chain}/tx/${v.linkTxEvm}`" class="text-primary dark:text-link" v-if="v.id">
              {{ shortenTxHash(v.id) }}
            </RouterLink>
          </td>
          <td class="truncate py-3">
            <RouterLink :to="''" class="text-primary dark:text-link" v-if="v.id">
              {{ shortenTxHash(v.contractAddress) }}
            </RouterLink>
          </td>
          <td class="text-sm py-3">
            <RouterLink :to="`/${chain}/block/${v.blockNumber}`" class="text-primary dark:text-link"
              v-if="v.blockNumber">{{ v.blockNumber }}
            </RouterLink>
          </td>
          <td class="truncate py-3">
            <span class="text-primary dark:text-link cursor-pointer" v-if="v.from" v-on:click="handleRedirect(v.from)">
              {{ shortenTxHash(v.from) }}
            </span>
          </td>
          <td class="truncate py-3">
            <span class="text-primary dark:text-link cursor-pointer" v-if="v.to" v-on:click="handleRedirect(v.to)">
              {{ shortenTxHash(v.to) }}
            </span>
          </td>
          <td class="text-sm py-3">
            {{ formatNumber(Number(v.amount) / 10 ** 18) }} AORAI
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transactions</td>
    </div>
    <div class="mt-4 text-center" v-if="totalTx">
      <Pagination :totalItems="totalTx" :limit="pagination.limit" :onPagination="handlePagination"
        :page="pagination.page" />
    </div>
  </div>
</template>

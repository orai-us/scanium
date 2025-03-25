<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { countTxsEvmTokenTransfers, getTxsEvmTokenTransfers } from '@/service/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import { formatNumber, shortenTxHash } from '@/utils';
import Pagination from '../pagination/Pagination.vue';
import web3Service from '@/service/web3Service';

const props = defineProps(["address", "chain"]);

const route = useRoute();
const router = useRouter();
const txsEvm = ref([] as Array<any>);
const totalTx = ref(0);
const contractAddresses = ref([] as Array<string>);
const tokens = ref({} as any);

const minABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
]

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
    console.log
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
      const setContractAddresses: Set<string> = new Set();
      res.data.forEach((item: any) => {
        setContractAddresses.add(item.contractAddress)
      })
      contractAddresses.value = Array.from(setContractAddresses)
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

watch(() => contractAddresses.value, async () => {
  const infoTokens: any = {};
  if (Array.isArray(contractAddresses.value)) {
    for (let address of contractAddresses.value) {
      const contract = web3Service.contractMethod(minABI, address);
      const [resSymbol, resDecimals] = await Promise.all([contract.methods.symbol().call(), contract.methods.decimals().call()]);
      infoTokens[address] = { symbol: resSymbol, decimals: Number(resDecimals) };
    }
  }
  tokens.value = infoTokens;
})

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
          <th>Token</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(v, index) in txsEvm" :key="v.id">
          <td class="truncate py-3">
            <RouterLink :to="`/${chain}/tx/${v.linkTxEvm}`" class="text-primary dark:text-link" v-if="v.id">
              {{ shortenTxHash(v.linkTxEvm) }}
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
            {{ formatNumber(Number(v.amount) / 10 ** (tokens[v.contractAddress]?.decimals || 0)) }}
          </td>
          <td>
            <div class="truncate px-2 py-2">{{ tokens[v.contractAddress]?.symbol  }}</div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transactions</td>
    </div>
  </div>
  <div class="mt-4 text-center" v-if="totalTx">
    <Pagination :totalItems="totalTx" :limit="pagination.limit" :onPagination="handlePagination"
      :page="pagination.page" />
  </div>
</template>

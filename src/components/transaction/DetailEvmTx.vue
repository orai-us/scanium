<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { Icon } from '@iconify/vue';
import { ref, watch, watchEffect } from 'vue';
import TokenElement from '../dynamic/TokenElement.vue';
import { contractEvmERC20 } from '@/constants';
import { formatNumber } from '@/utils';
import web3Service from '@/service/web3Service';
import { getEvmByHash } from '@/service/transactionsService';

const props = defineProps(['hash', 'chain']);
const format = useFormatter();
const tx = ref({} as any);
let resultCopy = ref();
const logsERC20 = ref([] as Array<any>);
const addressTokens = ref([] as Array<any>);
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

async function fetchEvmByHash(hash: string){
  try {
    const res = await getEvmByHash(hash)
    if(res.data){
      tx.value = res.data
    }
  } catch (error) {
    console.log({ error })
  }
}

watchEffect(() => {
  if (props.hash) fetchEvmByHash(props.hash)
})

async function getLogsTx() {
  try {
    const res = await web3Service.web3.eth.getTransactionReceipt(props.hash);
    if (Array.isArray(res.logs)) {
      const logs = res.logs.filter(log => {
        const topics = log.topics;
        if (Array.isArray(topics)) return topics[0] === contractEvmERC20
        return false;
      }).map((item) => {
        const data = item.data;
        const topics = item.topics;
        let from = "", to = "", amount = BigInt(0);
        if (data) {
          amount = BigInt(data)
        }
        if (Array.isArray(topics)) {
          from = topics[1]?.replace("000000000000000000000000", "");
          to = topics[2]?.replace("000000000000000000000000", "");
        }
        return {
          token: item.address,
          amount,
          from,
          to
        }
      })
      logsERC20.value = logs;

      const setTokens = new Set();
      logs.forEach((item) => setTokens.add(item.token));
      addressTokens.value = Array.from(setTokens);
    }
  } catch (error) {
    console.log({ error })
  }

}

watch(() => addressTokens.value, async () => {
  const infoTokens: any = {};
  if (Array.isArray(addressTokens.value)) {
    for (let address of addressTokens.value) {
      const contract = new web3Service.web3.eth.Contract(minABI, address);
      const resSymbol = await contract.methods.symbol().call();
      const resDecimals = await contract.methods.decimals().call();
      infoTokens[address] = { symbol: resSymbol, decimals: Number(resDecimals) };
    }
  }
  tokens.value = infoTokens
})

watchEffect(() => {
  getLogsTx()
})

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    resultCopy.value = true;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  } catch (err) {
    resultCopy.value = false;
    setTimeout(() => {
      resultCopy.value = null;
    }, 1000);
  }
};

</script>
<template>
  <div class="box-content !p-0">
    <div class="p-4 md:p-6">
      <h2 class="card-title truncate mb-2 text-white xl:text-lg text-sm">{{ $t('tx.title') }}</h2>
      <div class="overflow-auto-x xl:mt-4 mt-2 xl:p-4 p-2">
        <div class="flex flex-col xl:gap-8 gap-4">
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Evm Tx Hash</div>
            <div>
              <div class="flex gap-1 items-center">
                <RouterLink :to="`/${chain}/tx/${tx.id}`" class="text-primary dark:text-link xl:text-sm text-xs truncate break-words">
                  {{ tx.id }}</RouterLink>
                <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="tx.id"
                  @click="copyWebsite(tx.id || '')" />
              </div>
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Cosmos Tx Hash</div>
            <div>
              <div class="flex gap-1 items-center">
                <RouterLink :to="`/${props.chain}/tx/${tx.cosmosTransactionId}`"
                  class="text-primary dark:text-link xl:text-sm text-xs truncate break-words">{{ tx.cosmosTransactionId }}
                </RouterLink>
                <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="tx.cosmosTransactionId"
                  @click="copyWebsite(tx.cosmosTransactionId || '')" />
              </div>
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Height</div>
            <div class="">
              <RouterLink :to="`/${props.chain}/block/${tx.blockNumber}`"
                class="text-primary dark:text-link xl:text-sm text-xs">{{ tx.blockNumber }}
              </RouterLink>
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Method</div>
            <div class="xl:text-sm text-xs">
              {{ tx.method }}
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Status</div>
            <div class="" v-if="tx.status">
              <span class="truncate relative py-2 w-fit mr-2 rounded inline-flex items-center xl:text-sm text-xs"
                :class="`${tx.status ? 'text-[#39DD47]' : 'text-error'
                  }`">
                <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp;
                {{ tx.status ? 'Success' : 'Failed' }}
              </span>
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Time</div>
            <div class="xl:text-sm text-xs" v-if="tx.timestamp">
              {{ format.timestampFrom(Number(tx.timestamp)) }}
            </div>
            <div class="xl:text-sm text-xs" v-else>
              -
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Fee</div>
            <div class="xl:text-sm text-xs flex gap-1" v-if="tx.fee !== null && tx.fee !== undefined">
              <TokenElement :value="{ amount: tx.fee, denom: 'aorai' }" />
            </div>
            <div v-else>-</div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">Value</div>
            <div class="xl:text-sm text-xs flex gap-1" v-if="tx.value !== null && tx.fee !== undefined">
              <TokenElement :value="{ amount: tx.value, denom: 'aorai' }" />
            </div>
            <div v-else>-</div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">From</div>
            <div>
              <div class="flex gap-1 items-center">
                <RouterLink :to="`/${chain}/account/${tx.from}`"
                  class="text-primary dark:text-link xl:text-sm text-xs truncate break-words">
                  {{ tx.from }}
                </RouterLink>
                <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer xl:w-5 w-2.5" v-show="tx.from"
                  @click="copyWebsite(tx.from || '')" />
              </div>
            </div>
          </div>
          <div class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60">To</div>
            <div>
              <div class="flex gap-1 items-center">
                <RouterLink :to="`/${chain}/account/${tx.to}`" class="text-primary dark:text-link xl:text-sm text-xs truncate break-words">
                  {{ tx.to }}
                </RouterLink>
                <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer xl:w-5 w-2.5" v-show="tx.to"
                  @click="copyWebsite(tx.to || '')" />
              </div>
            </div>
          </div>
          <div v-if="!!logsERC20.length" class="flex xl:flex-row flex-col gap-1">
            <div class="xl:text-sm text-xs w-60 items-start">ERC-20 Token Transferred</div>
            <div
              class="truncate max-h-[300px] !overflow-scroll flex flex-col gap-1 rounded-lg border-base-400 border xl:px-5 px-2 xl:py-3 py-1 max-w-full">
              <div v-for="(log, index) of logsERC20" class="flex gap-1" :key="index">
                <span class="text-white font-semibold xl:text-sm text-xs">From</span>
                <div class="flex">
                  <RouterLink :to="`/${chain}/account/${log.from}`" class="text-link xl:text-sm text-xs">
                    {{ log.from }}</RouterLink>
                </div>
                <span class="text-white font-semibold xl:text-sm text-xs">to</span>
                <div class="flex">
                  <RouterLink :to="`/${chain}/account/${log.to}`" class="text-link xl:text-sm text-xs">
                    {{ log.to }}</RouterLink>
                </div>
                <span class="text-white font-semibold xl:text-sm text-xs">For</span>
                <span class="xl:text-sm text-xs">{{ formatNumber(Number(log.amount) / 10 ** (tokens[log.token]?.decimals || 6)) }}</span>
                <span class="text-white font-semibold xl:text-sm text-xs">{{ tokens[log.token]?.symbol }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="toast" v-show="resultCopy === true">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>Copy Success!</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="resultCopy === false">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>Copy Error!</span>
        </div>
      </div>
    </div>
  </div>
</template>

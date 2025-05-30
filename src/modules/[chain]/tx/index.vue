<script lang="ts" setup>
import { CHAIN_INDEXS } from '@/constants';
import { useBaseStore, useBlockchain, useFormatter } from '@/stores';
import { shortenTxHash } from '@/utils';
import { formatTitle, parseJSONRecursive } from '@/libs/utils';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { fromBinary } from '@cosmjs/cosmwasm-stargate';
import { toBase64 } from '@cosmjs/encoding';
import { decodeProto } from '@/components/dynamic';
import { getListLatestTxs } from '@/service/transactionsService';
const props = defineProps(['chain']);

const base = useBaseStore();
const format = useFormatter();
const blockchain = useBlockchain();
const detailTxs = ref({} as any);
const pagination = reactive({
  page: 1,
  limit: 5
})
const latestTxs = ref([] as Array<any>);

async function fetchLatestTxs() {
  try {
    const res = await getListLatestTxs(pagination);
    if(Array.isArray(res.data)){
      latestTxs.value = res.data;
    }
  } catch (error) {
    console.log({ error })
  }
}

onMounted(()=>{
  fetchLatestTxs()
})

const transactions: any = computed(() => {
  let initTxs: any[] = [];
  if (Array.isArray(latestTxs.value) && CHAIN_INDEXS.includes(props.chain)) {
    initTxs = latestTxs.value.map((item: any) => ({
      hash: item.id,
      code: item.code,
      timestamp: item.timestamp,
      tx: {
        body: {
          messages: item.transactionMessages
        }
      },
      subType: item.transactionMessages[0]?.subType,
      height: item.blockNumber,
      fee: item.fee[0] && `${item.fee[0].amount / 1e6} ${item.fee[0].denom?.toUpperCase()}`
    }));
  }

  const txs = !!initTxs ? [...base.txsInRecents, ...initTxs] : base.txsInRecents;
  const data = txs.map((item) => {
    const message = format.messages(item.tx?.body?.messages)?.split("×")[0];
    return {
      ...item,
      message: message === "ExecuteContract" ? "-" : formatTitle(message || ""),
      numberMessageRemain: item.tx?.body?.messages?.length > 1 ?  item.tx?.body?.messages?.length - 1 : 0,
    };
  });
  return data;
})

function getDetailTxs(txs: Array<any>){
  for (let tx of txs) {
    blockchain.rpc.getTx(tx.hash).then((x) => {
      const messages = x?.tx?.body?.messages[0];
      let subType;
      if (messages) {
        const value = decodeProto(messages);
        if (value.msg instanceof Uint8Array) {
          try {
            const jsonValue = fromBinary(toBase64(value.msg));
            subType = Object.keys(parseJSONRecursive(jsonValue))[0];
          } catch (error) {
            console.log({ error });
          }
        }
      }
      detailTxs.value[tx.hash] = { ...x, subType };
    });
  }
}

onMounted(() => {
  getDetailTxs(base.txsInRecents);
})

watch(transactions, (newTxs, oldTxs) => {
  const txs = base.txsInRecents.slice(0, newTxs.length - oldTxs.length + 1);
  getDetailTxs(txs);
})

</script>

<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl">
    <div class="bg-base-100 overflow-x-auto rounded-2xl px-5 pt-5">
      <table class="table w-full table-compact">
        <thead class="border border-base-200">
          <tr>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              {{ $t('tx.tx_hash') }}
            </th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              {{ $t('tx.result') }}
            </th>
            <th class="text-white text-xs font-bold">
              {{ $t('account.messages') }}
            </th>

            <th class="text-white text-xs font-bold">{{ $t('block.fees') }}</th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              {{ $t('account.height') }}
            </th>
            <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
              {{ $t('account.time') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in transactions" :index="item.hash" class="hover:bg-base-300">
            <td class="truncate text-link">
              <RouterLink :to="`/${props.chain}/tx/${item.hash}`">{{
                shortenTxHash(item.hash)
                }}</RouterLink>
            </td>
            <td>
              <span class="text-sm truncate relative w-fit rounded inline-flex items-center" :class="`${detailTxs[item.hash]?.txResponse.code !== 0 ? 'text-error': 'text-[#39DD47]'
                }`" v-if="!!detailTxs[item.hash]?.txResponse?.timestamp">
                <!-- <Icon icon="mdi:check" width="20" height="20" />&nbsp;&nbsp; -->
                {{ detailTxs[item.hash]?.txResponse.code !== 0 ? 'Failed' : 'Success' }}
              </span>
              <span v-else-if="item.code !== null && item.code !== undefined" :class="`${item.code !== 0 ? 'text-error' : 'text-[#39DD47]'
                }`">
                {{ item.code !== 0 ? "Failed" : "Success" }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="!break-normal flex gap-1 items-center">
              <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]" v-if="item.subType">
                {{ formatTitle(item?.subType) }}
              </span>
              <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]" v-else-if="detailTxs[item.hash]?.subType">
                {{ formatTitle(detailTxs[item.hash].subType) }}
              </span>
              <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]" v-else>
                {{ item.message }}
              </span>
              <span v-if="item.numberMessageRemain">
                +{{ item.numberMessageRemain }}
              </span>
            </td>

            <td>{{ item.fee || format.formatTokens(item.tx?.authInfo?.fee?.amount) }}</td>
            <td class="text-sm text-link">
              <RouterLink :to="`/${props.chain}/block/${item.height}`">{{
                item.height
                }}</RouterLink>
            </td>
            <td class="!break-normal">
              <span v-if="!!detailTxs[item.hash]?.txResponse?.timestamp">
                {{ format.toDay(detailTxs[item.hash]?.txResponse?.timestamp, 'from') }}
              </span>
              <span v-else-if="!!item.timestamp">
                {{ format.toDay(Number(item.timestamp), 'from') }}
              </span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="p-4 rounded-2xl">
        <div class="alert relative bg-transparent">
          <div class="alert absolute inset-x-0 inset-y-0 w-full h-full bg-info opacity-10"></div>
          <div class="text-info flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              class="stroke-current flex-shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{{ $t('block.only_tx') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<route>
    {
      meta: {
        i18n: 'transactions',
        order: 6
      }
    }
</route>

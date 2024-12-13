<script lang="ts" setup>
import { useBlockchain, useFormatter } from '@/stores';
import { onMounted, ref} from 'vue';
import { PageRequest } from '@/types';
import { toHex } from '@cosmjs/encoding';
import { shortenTxHash } from '@/utils';
import Pagination from '@/components/pagination/Pagination.vue';
import { formatTitle } from '@/libs/utils';

const props = defineProps(['channel', 'port', 'typetx', 'chain']);

const chainStore = useBlockchain();
const format = useFormatter();
const txs = ref([] as Array<any>);
const txTotal = ref(0 as number);
const page = ref(new PageRequest());
page.value.limit = 10;

function parseTransaction(txs: Array<any>) {
  return txs.map(tx => {
    const amount = tx.txRaw?.authInfo?.fee?.amount;
    return {
      txhash: toHex(tx.hash),
      result: tx.result?.code === 0 ? "Success" : "Failed",
      message: formatTitle(format.messages(tx.txRaw?.body?.messages) || "-"),
      height: tx.height,
      fee: Array.isArray(amount) ? `${amount[0].amount} ${amount[0].denom}` : "-",
    };
  });
}

function fetchSendingTxs(channel: string, port: string, pageNum = 0) {
  page.value.setPage(pageNum);
  chainStore.rpc
    .getTxs(
      [
        {
          key: 'send_packet.packet_src_channel',
          value: channel,
        },
        {
          key: 'send_packet.packet_src_port',
          value: port,
        },
      ],
      page.value
    )
    .then((res) => {
      txs.value = parseTransaction(res.txs);
      txTotal.value = res.totalCount;
    });
}

function fetchRecevingTxs(channel: string, port: string, pageNum = 0) {
  page.value.setPage(pageNum);
  chainStore.rpc
    .getTxs(
      [
        {
          key: 'recv_packet.packet_dst_channel',
          value: channel,
        },
        {
          key: 'recv_packet.packet_dst_port',
          value: port,
        },
      ],
      page.value
    )
    .then((res) => {
      txs.value = parseTransaction(res.txs);
      txTotal.value = res.totalCount;
    });
}

onMounted(() => {
  if (props.typetx === "out")
    fetchSendingTxs(props.channel, props.port);
  if (props.typetx === "in")
    fetchRecevingTxs(props.channel, props.port);
});

function handlePagination(page: number) {
  if (props.typetx === "out")
    fetchSendingTxs(props.channel, props.port, page + 1);
  if (props.typetx === "in")
    fetchRecevingTxs(props.channel, props.port, page + 1);
}

</script>
<template>
  <div class="m-4 md:m-6 border border-base-400 bg-base-100 rounded-2xl h-full py-5">
    <div class="px-5">
      <h3 class="card-title capitalize">
        Transactions ({{ props.channel }} {{ props.port }} {{ props.typetx }})
      </h3>
    </div>
    <div class="bg-base-100 overflow-x-auto rounded-2xl p-5">
      <div class="overflow-x-auto">
        <table class="table w-full text-sm" v-if="txs?.length > 0">
          <thead>
            <tr>
              <th>Tx Hash</th>
              <th>Result</th>
              <th>Message</th>
              <th>Height</th>
              <th>Fee</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="txs?.length === 0">
              <td colspan="10">
                <div class="text-center">
                  {{ $t('account.no_transactions') }}
                </div>
              </td>
            </tr>
            <tr v-for="(v, index) in txs" :key="index">
              <td class="truncate py-3" style="max-width: 200px">
                <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
                  {{ shortenTxHash(v.txhash) }}
                </RouterLink>
              </td>
              <td class="text-sm py-3 !break-normal" :class="`${v.result === 'Success' ? 'text-[#39DD47]' : 'text-error'
                }`">
                {{ v.result }}
              </td>
              <td class="py-3 !break-normal">
                <span
                  class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] h-full w-fit flex justify-center items-center">{{
                    v.message }}</span>
              </td>
              <td class="text-sm py-3 !break-normal">
                <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
                  v.height }}
                </RouterLink>
              </td>
              <td class="py-3 !break-normal">
                <span>{{ v.fee || "-" }}</span>
              </td>
              <td class="!break-normal">{{ v.timestamp || "-" }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="flex items-center justify-center w-full h-full">
          <td>No Transactions</td>
        </div>
      </div>
    </div>
    <div class="mt-4 text-center" v-if="txTotal">
      <Pagination :totalItems="txTotal" :limit="page.limit" :onPagination="handlePagination" />
    </div>
  </div>
</template>

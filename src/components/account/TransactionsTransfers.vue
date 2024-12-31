<script lang="ts" setup>
import { useFormatter } from '@/stores';
import { onMounted, reactive, ref, watch } from 'vue';
import { getHistoryTxs } from '@/service/transactionsService';
import { shortenTxHash } from '@/utils';
import Pagination from '../pagination/Pagination.vue';

const props = defineProps(['address', 'chain']);
const txs = ref([] as Array<any>);
const format = useFormatter();
const txTotal = ref(0);

const pagination = reactive({
  limit: 10,
  offset: 0
});
onMounted(() => {
  fetchTransaction();
});

async function fetchTransaction() {
  try {
    const params = {
      addrByNetworks: `${props?.chain}+${props?.address}`,
      limit: pagination.limit,
      offset: pagination.offset
    };
    const response = await getHistoryTxs(params);
    if (!!response) {
      txs.value = response.data.map((item: any) => {
        const result = item.status === 0 ? "Success" : "Failed";
        const blockNumber = item.height || "-";

        let fee = "-";
        if (Array.isArray(item.fee))
          if (!isNaN(Number(item.fee[0])))
            fee = `${Number(item.fee[0]) / 1e6} ORAI`;

        let token = "-";
        if (Array.isArray(item.tokenInfos) && item.tokenInfos[0]?.abbr)
          token = item.tokenInfos[0].abbr.toUpperCase();

        let timestamp = "-";
        if (!!item.timestamp)
          timestamp = format.toLocaleDate(new Date(item.timestamp * 1000));
        let status = "";
        if (item.fromAddress === props.address) status = "OUT";
        else status = "IN"

        return {
          ...item,
          result,
          blockNumber,
          fee,
          token,
          timestamp,
          status
        };
      });
      txTotal.value = response.totalRecord;
    }
  } catch (error) {
    txs.value = [];
  }
}

watch([() => props.address, pagination], () => {
  fetchTransaction();
});

function handlePagination(page: number) {
  pagination.offset = (page - 1) * pagination.limit;
}
</script>

<template>
  <div>
    <div class="overflow-x-auto">
      <table class="table w-full text-sm" v-if="txs?.length > 0">
        <thead>
          <tr>
            <th>Tx Hash</th>
            <th>Result</th>
            <th>Height</th>
            <th>Fee</th>
            <th>Status</th>
            <th>Token</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="(v, index) in txs" :key="v.txhash">
            <td class="truncate py-3" style="max-width: 200px">
              <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
                {{ shortenTxHash(v.txhash) }}
              </RouterLink>
            </td>
            <td class="text-sm py-3" :class="`${v.result === 'Success' ? 'text-[#39DD47]' : 'text-error'
              }`">
              {{ v.result }}
            </td>
            <td class="text-sm py-3">
              <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
                v.height }}
              </RouterLink>
            </td>
            <td class="py-3">
              <span class="text-xs">{{ v.fee || "-" }}</span>
            </td>
            <td class="py-3">
              <div class="flex gap-2">
                <button class="btn btn-xs  border rounded-lg " v-if="v.status"
                 :class="{'!bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)]': v.status ==='IN', 
                          '!bg-[rgba(255,82,82,0.20)] !text-[#FF5252] border-[rgba(255,82,82,0.20)]': v.status ==='OUT'}">
                  {{ v.status }}
                </button>
              </div>
            </td>
            <td class="py-3">
              <span>{{ v.token }}</span>
            </td>
            <td class="!break-normal">{{ format.toDay(v.timestamp, 'from') || "-" }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="flex items-center justify-center w-full h-full">
        <td>No Transactions</td>
      </div>
    </div>

    <div class="mt-4 text-center" v-if="txTotal">
      <Pagination :totalItems="txTotal" :limit="pagination.limit" :onPagination="handlePagination" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionsTransfers',
};
</script>

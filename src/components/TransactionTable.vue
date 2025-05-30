<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import Pagination from './pagination/Pagination.vue';
import { shortenTxHash } from '@/utils';
import { useFormatter } from '@/stores';
import { CHAIN_INDEXS } from '@/constants';
import { formatTitle } from '@/libs/utils';
import TokenElement from './dynamic/TokenElement.vue';

const props = defineProps(['transactions', 'chain', 'txTotal', 'limit', 'handlePagination', 'displayStatus', 'page']);
const format = useFormatter();
const txs = ref([] as Array<any>)

watchEffect(() => {
  if (!!props?.transactions?.length) {
    if (CHAIN_INDEXS.includes(props.chain)) {
      txs.value = props?.transactions?.map((item: any) => {
        const nodes = item.messages?.nodes;
        let firstNodeMessage, message;
        let numberMessageRemain = 0;
        if (Array.isArray(nodes)) {
          firstNodeMessage = nodes[0];
          message = firstNodeMessage?.subType || format.messages([{ "@type": firstNodeMessage?.type, typeUrl: firstNodeMessage?.type }])
          if(nodes.length > 1){
            numberMessageRemain = nodes.length - 1;
          }
        }
        return {
          txhash: item?.id,
          result: item.code === 0 ? "Success" : "Failed",
          message: formatTitle(message || ""),
          numberMessageRemain,
          height: item.blockNumber,
          fee: item.fee[0],
          timestamp: format.toDay(new Date(Number(item.timestamp)), 'from'),
          state: item.state
        }
      });
    } else {
      txs.value = props.transactions
    }
  } else {
    txs.value = [];
  }
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm" v-if="txs?.length > 0">
      <thead>
        <tr>
          <th>{{ $t('tx.tx_hash') }}</th>
          <th>{{ $t('tx.result') }}</th>
          <th>{{ $t('tx.message') }}</th>
          <th>{{ $t('account.height') }}</th>
          <th>{{ $t('tx.fee') }}</th>
          <th v-if="displayStatus">{{ $t('staking.status') }}</th>
          <th>{{ $t('account.time') }}</th>
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
          <td class="py-3 !break-normal flex gap-1 items-center">
            <span
              class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] h-full w-fit flex justify-center items-center">{{ v.message }}</span>
              <span v-if="v.numberMessageRemain">+{{ v.numberMessageRemain }}</span>
          </td>
          <td class="text-sm py-3 !break-normal">
            <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
              v.height }}
            </RouterLink>
          </td>
          <td class="py-3 !break-normal">
            <TokenElement :value="v.fee"/>
          </td>
          <td v-if="displayStatus">
            <button class="btn btn-xs  border rounded-lg " v-if="v.state"
            :class="{'!bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)]': v.state ==='IN',
                     '!bg-[rgba(255,82,82,0.20)] !text-[#FF5252] border-[rgba(255,82,82,0.20)]': v.state ==='OUT'}">
             {{ v.state }}
           </button>
           <div v-else>-</div>
          </td>
          <td class="!break-normal">{{ v.timestamp || "-" }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transactions</td>
    </div>
  </div>

  <div class="mt-4 text-center" v-if="txTotal">
    <Pagination :totalItems="txTotal" :limit="limit" :onPagination="handlePagination" :page="page" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionTable',
};
</script>

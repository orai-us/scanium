<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import Pagination from '../pagination/Pagination.vue';
import { formatSmallNumber, shortenTxHash } from '@/utils';
import { useFormatter } from '@/stores';
import { CHAIN_INDEXS } from '@/constants';
import { tokenMap } from '@/libs/amm-v3';
import { formatTitle } from '@/libs/utils';

// import TokenElement from './dynamic/TokenElement.vue';

const props = defineProps(['transfers', 'chain', 'txTotal', 'limit', 'handlePagination', 'displayStatus', 'page', 'denom']);
const format = useFormatter();
const transfers = ref([] as Array<any>)

watchEffect(() => {
  if (!!props?.transfers?.length) {
    if (CHAIN_INDEXS.includes(props.chain)) {
      transfers.value = props?.transfers?.map((item: any) => {
        let message;
        let numberMessageRemain = 0;

        if (Array.isArray(item.messages)) {
          message = item.messages[0]?.subType || format.messages([{ "@type": item.messages[0]?.type, typeUrl: item.messages[0]?.type }])
          numberMessageRemain = Math.max(item.messages.length - 1, 0);
        }

        let amountTransfer = item.amount;
        const tokenInfoTransfer = tokenMap[props.denom];
        if (tokenInfoTransfer) {
          amountTransfer = formatSmallNumber(amountTransfer / 10 ** tokenInfoTransfer.coinDecimals);
        }

        return {
          txhash: item?.transactionId,
          // result: item.code === 0 ? "Success" : "Failed",
          message: formatTitle(message || ""),
          numberMessageRemain,
          height: item.blockNumber,
          from: item.from,
          to: item.to,
          amount: amountTransfer,
          // fee: item.fee[0],
          // timestamp: format.toDay(new Date(Number(item.timestamp)), 'from'),
          // state: item.state
        }
      });
    } else {
      transfers.value = props.transfers
    }
  } else {
    transfers.value = [];
  }
  console.log({ transfers: transfers.value });
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm" v-if="transfers?.length > 0">
      <thead>
        <tr>
          <th>{{ $t('tx.tx_hash') }}</th>
          <!-- <th>{{ $t('tx.result') }}</th> -->
          <th>{{ $t('tx.message') }}</th>
          <th>{{ $t('account.height') }}</th>
          <!-- <th>{{ $t('tx.fee') }}</th> -->
          <!-- <th v-if="displayStatus">{{ $t('staking.status') }}</th> -->
          <!-- <th>{{ $t('account.time') }}</th> -->
          <th>{{ $t('assets.from') }}</th>
          <th>{{ $t('assets.to') }}</th>
          <th>{{ $t('assets.amount') }}</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-if="transfers?.length === 0">
          <td colspan="10">
            <div class="text-center">
              {{ $t('account.no_transactions') }}
            </div>
          </td>
        </tr>
        <tr v-for="(v, index) in transfers" :key="index">
          <td class="truncate py-3" style="max-width: 200px">
            <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
              {{ shortenTxHash(v.txhash).toUpperCase() }}
            </RouterLink>
          </td>
          <!-- <td class="text-sm py-3 !break-normal" :class="`${v.result === 'Success' ? 'text-[#39DD47]' : 'text-error'
            }`">
            {{ v.result }}
          </td> -->
          <td class="py-3 !break-normal flex gap-1 items-center">
            <span
              class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] h-full w-fit flex justify-center items-center">{{
                v.message }}</span>
            <span v-if="v.numberMessageRemain">+{{ v.numberMessageRemain }}</span>
          </td>
          <td class="text-sm py-3 !break-normal">
            <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
              v.height }}
            </RouterLink>
          </td>
          <!-- <td class="py-3 !break-normal">
            <TokenElement :value="v.fee"/>
          </td> -->
          <!-- <td v-if="displayStatus">
            <button class="btn btn-xs  border rounded-lg " v-if="v.state"
            :class="{'!bg-[rgba(39,120,77,0.20)] !text-[#39DD47] border-[rgba(39,120,77,0.20)]': v.state ==='IN',
                     '!bg-[rgba(255,82,82,0.20)] !text-[#FF5252] border-[rgba(255,82,82,0.20)]': v.state ==='OUT'}">
             {{ v.state }}
           </button>
           <div v-else>-</div>
          </td> -->
          <td class="py-3 !break-normal">
            <span>{{ v.from }}</span>
          </td>
          <td class="py-3 !break-normal">
            <span>{{ v.to }}</span>
          </td>
          <td class="py-3 !break-normal">
            <span> {{ v.amount }}</span>
          </td>
          <!-- <td class="!break-normal">{{ v.timestamp || "-" }}</td> -->
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center w-full h-full">
      <td>No Transfers</td>
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

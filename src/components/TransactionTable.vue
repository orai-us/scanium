<script lang="ts" setup>
import { shortenTxHash } from '@/utils';
import Pagination from './pagination/Pagination.vue';

const props = defineProps(['transaction', 'chain', 'txTotal', 'pagination', 'handlePagination']);
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full text-sm">
      <thead>
        <tr>
          <th>Tx Hash</th>
          <th>Result</th>
          <th>Message</th>
          <th>Height</th>
          <th>Amount</th>
          <th>Fee</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-if="transaction?.length === 0">
          <td colspan="10">
            <div class="text-center">
              {{ $t('account.no_transactions') }}
            </div>
          </td>
        </tr>
        <tr v-for="(v, index) in transaction" :key="index">
          <td class="truncate py-3" style="max-width: 200px">
            <RouterLink :to="`/${chain}/tx/${v.txhash}`" class="text-primary dark:text-link">
              {{ v.txhash }}
            </RouterLink>
          </td>
          <td class="text-sm py-3">
            {{ v.status ? "Success" : "Failed" }}
          </td>
          <td class="flex items-center py-3">
            <!-- <div class="mr-2">
                      {{ format.messages(v.txRaw.body.messages) }}
                    </div>
                    <Icon v-if="v.result.code === 0" icon="mdi-check" class="text-success text-lg" />
                    <Icon v-else icon="mdi-multiply" class="text-error text-lg" /> -->
          </td>
          <td class="text-sm py-3">
            <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{
              v.height }}
            </RouterLink>
          </td>
          <td class="py-3">
            <span v-if="v.timestamp" class="text-xs">{{ v.amount}}</span>
          </td>

          <td class="py-3">
            <span v-if="v.timestamp" class="text-xs">{{ v.fee }}</span>
          </td>
          <td>{{ v.timestamp }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-4 text-center" v-if="txTotal">
    <Pagination :totalItems="txTotal" :limit="pagination.limit" :onPagination="handlePagination" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransactionTable',
};
</script>
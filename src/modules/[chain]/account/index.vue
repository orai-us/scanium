<script lang="ts" setup>
import { useBlockchain } from '@/stores';
import { PageRequest } from '@/types';
import { onMounted, ref } from 'vue';
import PaginationBar from '@/components/PaginationBar.vue';
import type { Any } from 'cosmjs-types/google/protobuf/any';
import type { PageResponse } from 'cosmjs-types/cosmos/base/query/v1beta1/pagination';
const props = defineProps(['chain']);

const chainStore = useBlockchain();

const accounts = ref([] as Any[]);
const pageRequest = ref(new PageRequest());
const pageResponse = ref({} as PageResponse | undefined);

onMounted(() => {
  pageload(1);
});

function pageload(p: number) {
  pageRequest.value.setPage(p);
  chainStore.rpc.getAuthAccounts(pageRequest.value).then((x) => {
    accounts.value = x.accounts;
    pageResponse.value = x.pagination;
  });
}

function showType(v: string) {
  return v.replace('/cosmos.auth.v1beta1.', '');
}
function findField(v: any, field: string) {
  if (!v || Array.isArray(v) || typeof v === 'string') return null;
  const fields = Object.keys(v);
  if (fields.includes(field)) {
    return v[field];
  }
  for (let i = 0; i < fields.length; i++) {
    const re: any = findField(v[fields[i]], field);
    if (re) return re;
  }
}
function showAddress(v: any) {
  return findField(v, 'address');
}
function showAccountNumber(v: any) {
  return findField(v, 'account_number');
}
function showSequence(v: any) {
  return findField(v, 'sequence');
}
function showPubkey(v: any) {
  return findField(v, 'pub_key');
}
</script>
<template>
  <div class="overflow-x-auto">
    <table class="table table-compact">
      <thead>
        <tr>
          <td>{{ $t('account.type') }}</td>
          <td>{{ $t('account.address') }}</td>
          <td>{{ $t('account.acc_num') }}</td>
          <td>{{ $t('account.sequence') }}</td>
          <td>{{ $t('account.pub_key') }}</td>
        </tr>
      </thead>
      <tr v-for="acc in accounts">
        <td>{{ showType(acc.typeUrl) }}</td>
        <td>
          <RouterLink :to="`/${chain}/account/${showAddress(acc)}`">{{
            showAddress(acc)
          }}</RouterLink>
        </td>
        <td>{{ showAccountNumber(acc) }}</td>
        <td>{{ showSequence(acc) }}</td>
        <td>{{ showPubkey(acc) }}</td>
      </tr>
    </table>
    <PaginationBar
      :limit="pageRequest.limit"
      :total="pageResponse?.total ? pageResponse?.total.toString() : '0'"
      :callback="pageload"
    />
  </div>
</template>

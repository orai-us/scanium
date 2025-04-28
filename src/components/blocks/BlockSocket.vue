<script lang="ts" setup>
import { useBaseStore, useFormatter } from '@/stores';
import { computed, onBeforeUnmount, ref } from 'vue';
import { shortenTxHash } from '@/utils';
import { useRoute } from 'vue-router';

const props = defineProps(['chain']);
const base = useBaseStore();
const route = useRoute(); 
const format = useFormatter();
const tab = ref('blocks');
const lastHeight = ref(Number(base.latest?.block?.header?.height || 0) + 10000);
const target = ref(Number(lastHeight.value || 0));
base.listenToBlocks();

const list = computed(() => {
  const recents = base.blocks;
  return recents.sort(
    (a, b) => Number(b?.height) - Number(a?.height)
  );
});

const listTxs = computed(() => {
  const recents = base.txs;
  const result = recents.map((item) => {
    const msg = item?.tx_result?.events.find((event: any) => event?.type === "message" && event?.attributes.find((attr: any) => attr?.key === "action"));
    const action = msg?.attributes?.find((attr: any) => attr?.key === "action");
    const value = action?.value ?? 'Unknown';
    return {
      ...item,
      message: value
    }
  });

  return result.sort(
    (a, b) => Number(b?.height) - Number(a?.height)
  );
});

onBeforeUnmount(() => {
  base.disconnectWebSocket();
});

// watchEffect(() => {
//   const recents = base.blocks;
//   const result = recents.sort(
//     (a, b) => Number(b?.height) - Number(a?.height)
//   );
//   const block = result[0];
//   if (block) list.value.unshift(block)
// });


// watchEffect(() => {
//   if (base.latest?.header.height && lastHeight.value === 10000) {
//     lastHeight.value = Number(base.latest?.header.height || 0) + 10000;
//     target.value = Number(lastHeight.value || 0);
//   }
// });

const edit = ref(false);
const newHeight = ref(lastHeight.value);
function updateTarget() {
  target.value = Number(newHeight.value);
  console.log(target.value);
}

// onBeforeRouteUpdate(async (to, from, next) => {
//   if (from.path !== to.path) {
//     base.fetchBlock(String(to.params.height)).then((x) => {
//       current.value = x;
//     });
//     next();
//   }
// });

</script>
<template>
  <div class="flex">
    <div class="m-2 md:m-4 border border-base-400 bg-base-100 rounded-[8px] w-[50%]">
      <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0">
        <a class="tab text-gray-400 capitalize !pb-3" :class="{ 'tab-active': tab === 'blocks' }">{{ $t('block.recent')
        }}</a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="bg-base-100 overflow-x-auto w-full rounded-2xl mb-4 px-5">
          <table class="table w-full table-compact">
            <thead class="border border-base-200">
              <tr>
                <th class="text-white text-xs font-bold">Block</th>
                <th class="text-white text-xs font-bold">
                  Proposer
                </th>
                <th class="text-white text-xs font-bold">TXS Count</th>
                <th class="text-white text-xs font-bold text-right">
                  Created Time
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in list.slice(0, 50)" :index="item?.height" class="hover:bg-base-300">
                <td>
                  <RouterLink :to="`/Oraichain/block/${item?.height}`"
                    class="text-link cursor-pointer hover:text-primary">
                    {{ item?.height }}
                  </RouterLink>
                </td>
                <td class="text-sm text-link">
                  <div class="mt-2 text-sm text-white font-semibold">
                    <span>{{
                      format.validator(
                        item?.proposer_address &&
                        item?.proposer_address
                      )
                    }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-right mt-1 whitespace-nowrap text-white">
                    {{ item?.txs?.length || 0 }}
                  </span>
                </td>
                <td class="truncate text-right">
                  <span class="rounded text-xs whitespace-nowrap font-normal text-white text-right">
                    {{
                      format.getRelativeTimeString(item?.time?.toString())
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    <div class="m-2 md:m-4 border border-base-400 bg-base-100 rounded-[8px] w-[50%]">
      <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0">
        <a class="tab text-gray-400 capitalize !pb-3" :class="{ 'tab-active': tab === 'blocks' }">{{ $t('tx.txs') }}</a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="bg-base-100 overflow-x-auto w-full rounded-2xl mb-4 px-5">
          <table class="table w-full table-compact">
            <thead class="border border-base-200">
              <tr>
                <th class="text-white text-xs font-bold">Hash</th>
                <th class="text-white text-xs font-bold">
                  Status
                </th>
                <th class="text-white text-xs font-bold">Block</th>
                <th class="text-white text-xs font-bold text-right">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listTxs.slice(0, 50)" :index="item?.height" class="hover:bg-base-300">
                <td>
                  <RouterLink :to="`/Oraichain/tx/${item?.hash}`"
                    class="text-link cursor-pointer hover:text-primary">
                    {{ shortenTxHash(item?.hash) }}
                  </RouterLink>
                </td>
                <td class="text-sm">
                  <div class="mt-2 font-semibold">
                    <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]">
                      {{ format.messages([{
                        "@type": item?.message,
                      }]) }}
                    </span>
                  </div>
                </td>
                <td class="text-sm text-link">
                  <RouterLink :to="`/Oraichain/block/${item?.height}`">{{
                    item?.height
                    }}</RouterLink>
                </td>
                <td class="truncate text-right">
                  <span class="rounded text-xs whitespace-nowrap font-normal text-white text-right">
                    {{
                      format.getRelativeTimeString(item?.timestamp?.toString())
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="tab === 'transactions'" class="bg-base-100 overflow-x-auto rounded-2xl px-5">
        <table class="table w-full table-compact">
          <thead class="border border-base-200">
            <tr>
              <th class="text-white text-xs font-bold">
                {{ $t('account.messages') }}
              </th>
              <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
                {{ $t('account.hash') }}
              </th>
              <th class="text-white text-xs font-bold">{{ $t('block.fees') }}</th>
              <th class="text-white text-xs font-bold" style="position: relative; z-index: 2">
                {{ $t('account.height') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in base.txsInRecents" :index="index" class="hover:bg-base-300">
              <td>
                <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]">
                  {{ format.messages(item.tx.body.messages) }}
                </span>
              </td>
              <td class="truncate text-link" width="50%">
                <RouterLink :to="`/Oraichain/tx/${item.hash}`">{{
                  item.hash
                }}</RouterLink>
              </td>
              <td>{{ format.formatTokens(item.tx.authInfo.fee?.amount) }}</td>
              <td class="text-sm text-link">
                <RouterLink :to="`/Oraichain/block/${item?.height}`">{{
                  item?.height
                }}</RouterLink>
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
  </div>


</template>

<route>
    {
      meta: {
        i18n: 'blocks',
        order: 5
      }
    }
  </route>

<script lang="ts" setup>
import { useBaseStore, useFormatter } from '@/stores';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { shortenTxHash } from '@/utils';
import { useRoute } from 'vue-router';
import { useWindowSize } from '@vueuse/core';
import { cosmos } from "@oraichain/proto/dist/codegen/cosmos/bundle";
import { cosmwasm } from "@oraichain/proto/dist/codegen/cosmwasm/bundle";

const props = defineProps(['chain']);
const base = useBaseStore();
const route = useRoute();
const format = useFormatter();
const tab = ref('blocks');
const lastHeight = ref(Number(base.latest?.block?.header?.height || 0) + 10000);
const target = ref(Number(lastHeight.value || 0));
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

onMounted(() => {
  console.log('mounted');
  base.listenToBlocks(true);
});

const list = computed(() => {
  const recents = base.blocks;
  return recents
});

const listTxs = computed(() => {
  const recents = base.txs;
  try {
    const result = recents.map((item) => {
      const decodeTx = cosmos.tx.v1beta1.Tx.decode(Buffer.from(item.tx, 'base64'));
      const messages = decodeTx?.body?.messages;
      const splitMessage = messages?.[0]?.typeUrl?.split(".") ?? ['Unknown'];
      const message = splitMessage[splitMessage.length - 1];

      // if (messages?.[0]?.typeUrl === "/cosmwasm.wasm.v1.MsgExecuteContract") {
      //   const decodeValue = cosmwasm.wasm.v1.MsgExecuteContract.decode(messages[0].value);
      //   const bufferValue = Buffer.from(decodeValue.msg).toString();
      //   const parsedMsg = JSON.parse(bufferValue);

      //   for (const key in parsedMsg) {
      //     if (parsedMsg.hasOwnProperty(key)) {
      //       const type = key.charAt(0).toUpperCase() + key.slice(1);
      //       message = message + '/' + type;
      //     }
      //   }
      // }

      return {
        ...item,
        message,
        messageLength: messages?.length ?? 0
      }
    });
    return result;
  } catch (error) {
    console.log({ catch: error });
    return [];
  }
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

function changeTab(selectedTab: string) {
  tab.value = selectedTab;
}

</script>
<template>
  <div class="flex flex-col md:flex-row">
    <div v-if="isMobile" class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0">
      <a class="tab text-gray-400 capitalize !pb-3 w-[50%]" :class="{ 'tab-active': tab === 'blocks' }"
        @click="changeTab('blocks')">{{ $t('block.recent') }}</a>
      <a class="tab text-gray-400 capitalize !pb-3 w-[50%]" :class="{ 'tab-active': tab === 'transactions' }"
        @click="changeTab('transactions')">{{ $t('block.recent_tx') }}</a>
    </div>

    <div class="m-2 md:m-4 w-[96%] md:w-[50%] border border-base-400 bg-base-100 rounded-[8px]"
      v-if="list.length > 0 && tab === 'blocks'">
      <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0" v-if="!isMobile">
        <a class="tab text-gray-400 capitalize !pb-3" :class="{ 'tab-active': tab === 'blocks' }">{{ $t('block.recent')
          }}</a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <!-- Mobile -->
        <div v-if="isMobile" v-for="item in list.slice(0, 10)" :index="item?.height" class="hover:bg-base-300">
          <div class="p-4 border border-[#383B40] rounded-lg flex flex-col gap-2">
            <span class="text-white text-sm font-bold">
              <RouterLink :to="`/Oraichain/block/${item?.height}`" class="text-link cursor-pointer hover:text-primary">
                {{ item?.height }}
              </RouterLink>
            </span>
            <div class="flex flex-row justify-between gap-2">
              <span>{{ $t('consensus.proposer') }}</span>
              <span class="text-white text-sm font-bold">{{
                format.validator(
                  item?.proposer_address &&
                  item?.proposer_address
                )
              }}</span>
            </div>
            <div class="flex flex-row justify-between gap-2">
              <span>{{ $t('block.block_hash') }}</span>
              <span class="text-white text-sm font-bold"> {{ shortenTxHash(item?.hash, 5, 5) }}</span>
            </div>
            <div class="flex flex-row justify-between gap-2">
              <span> {{ $t('account.time') }}</span>
              <span class="text-white text-sm font-bold"> {{
                format.getRelativeTimeString(item?.time?.toString())
              }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop -->
        <div class="bg-base-100 overflow-x-auto w-full rounded-2xl mb-4 px-5" v-if="!isMobile">
          <table class="table w-full table-compact">
            <thead class="border border-base-200">
              <tr>
                <th class="text-white text-xs font-bold">{{ $t('block.block') }}</th>
                <th class="text-white text-xs font-bold">
                  {{ $t('consensus.proposer') }}
                </th>
                <th class="text-white text-xs font-bold">{{ $t('block.block_hash') }}</th>
                <th class="text-white text-xs font-bold text-right">
                  {{ $t('account.time') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in list.slice(0, 10)" :index="item?.height" class="hover:bg-base-300">
                <td>
                  <RouterLink :to="`/Oraichain/block/${item?.height}`"
                    class="text-link cursor-pointer hover:text-primary">
                    {{ item?.height }}
                  </RouterLink>
                </td>
                <td class="text-sm text-link">
                  <div class="mt-2 text-sm text-white font-semibold fixed-height">
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
                    {{ shortenTxHash(item?.hash, 5, 5) }}
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
    <div class="m-2 md:m-4 w-[96%] md:w-[50%] border border-base-400 bg-base-100 rounded-[8px]"
      v-if="listTxs.length > 0 && (tab === 'transactions' || !isMobile)">
      <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0" v-if="!isMobile">
        <a class="tab text-gray-400 capitalize !pb-3"
          :class="{ 'tab-active': (tab === 'transactions' || !isMobile) }">{{ $t('block.recent_tx') }}</a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <!-- Mobile -->
        <div v-if="isMobile" v-for="item in listTxs.slice(0, 10)" :index="item?.height" class="hover:bg-base-300">
          <div class="p-4 border border-[#383B40] rounded-lg flex flex-col gap-2">
            <span class="text-white text-sm font-bold">
              <RouterLink :to="`/Oraichain/tx/${item?.hash}`" class="text-link cursor-pointer hover:text-primary">
                {{ shortenTxHash(item?.hash) }}
              </RouterLink>
            </span>
            <div class="flex flex-row justify-between gap-2">
              <span>{{ $t('tx.message') }}</span>
              <span class="text-white text-sm font-bold"> {{ format.messages([{
                "@type": item?.message,
              }]) }}</span>
            </div>
            <div class="flex flex-row justify-between gap-2">
              <span>{{ $t('block.block') }}</span>
              <span class="text-white text-sm font-bold"> {{ item?.height }}</span>
            </div>
            <div class="flex flex-row justify-between gap-2">
              <span> {{ $t('account.time') }}</span>
              <span class="text-white text-sm font-bold"> {{
                format.getRelativeTimeString(item?.timestamp?.toString())
              }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop -->
        <div class="bg-base-100 overflow-x-auto w-full rounded-2xl mb-4 px-5" v-if="!isMobile">
          <table class="table w-full table-compact">
            <thead class="border border-base-200">
              <tr>
                <th class="text-white text-xs font-bold">{{ $t('tx.tx_hash') }}</th>
                <th class="text-white text-xs font-bold">
                  {{ $t('tx.message') }}
                </th>
                <th class="text-white text-xs font-bold">
                  {{ $t('block.block') }}
                </th>
                <th class="text-white text-xs font-bold text-right">
                  {{ $t('account.time') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listTxs.slice(0, 10)" :index="item?.hash" class="hover:bg-base-300">
                <td>
                  <RouterLink :to="`/Oraichain/tx/${item?.hash}`" class="text-link cursor-pointer hover:text-primary">
                    {{ shortenTxHash(item?.hash) }}
                  </RouterLink>
                </td>
                <td class="text-sm">
                  <div class="mt-2 font-semibold">
                    <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px] fixed-height">
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
    </div>
  </div>


</template>

<style scoped>
.fixed-height {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 20px;
  width: 130px;
}
</style>

<route>
    {
      meta: {
        i18n: 'blocks',
        order: 5
      }
    }
  </route>

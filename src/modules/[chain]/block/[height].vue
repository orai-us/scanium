<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { Icon } from '@iconify/vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useBaseStore, useFormatter } from '@/stores';
import Countdown from '@/components/Countdown.vue';
import type { BlockResponse } from '@cosmjs/tendermint-rpc';
import { toBase64 } from '@cosmjs/encoding';
import TransactionBlockIndexs from '@/components/blocks/TransactionBlockIndexs.vue';
import TransactionBlockRpc from '@/components/blocks/TransactionBlockRpc.vue';
import { CHAIN_INDEXS } from '@/constants';
import BlogService from '@/service/blogService';

const props = defineProps(['height', 'chain']);

const store = useBaseStore();
const format = useFormatter();
// const current = ref({} as BlockResponse);
const current = ref({} as any);
const sumAggregates = ref(null as any);
const target = ref(Number(props.height || 0));
const blockInformation = ref();
const height = computed(() => {
  return Number(current.value.block?.header?.height || props.height || 0);
});

const isFutureBlock = computed({
  get: () => {
    const latest = store.latest?.block?.header.height;
    const isFuture = latest ? target.value > Number(latest) : true;
    return isFuture;
  },
  set: (val) => {
    console.log(val);
  },
});

watchEffect(async () => {
  current.value = await BlogService.getBlockDetail(props.chain, props.height);
  sumAggregates.value = await BlogService.getAggregates(props.chain, props.height);
})

const remainingBlocks = computed(() => {
  const latest = store.latest?.block?.header.height;
  return latest ? Number(target.value) - Number(latest) : 0;
});

const estimateTime = computed(() => {
  const seconds =
    remainingBlocks.value * Number((store.blocktime / 1000).toFixed()) * 1000;
  return seconds;
});

const estimateDate = computed(() => {
  return new Date(new Date().getTime() + estimateTime.value);
});

watch((current), () => {
  const block = current.value?.block;
  if (block) {
    const blockId = current.value?.blockId;
    const headerBlock = block?.header;
    const lastCommit = block?.lastCommit;
    const time = headerBlock?.time;
    const chainId = headerBlock?.chainId;
    const blockHash = toBase64(blockId?.hash);
    const round = lastCommit?.round;
    const txCount = block?.txs?.length;
    const proposerAddress = headerBlock?.proposerAddress;
    const proposer = format.validator(proposerAddress && toBase64(proposerAddress));
    blockInformation.value = {
      'Time': format.toLocaleDate(time.toString()),
      'Chain': chainId,
      'Block Hash': blockHash,
      'Round': round,
      'TX Counts': txCount,
      'Proposer': proposer,
      'Gas Used / Wanted': "-" 
    };
  } else {
    const block = current.value;
    blockInformation.value = {
      'Time': format.toLocaleDate(parseInt(block.time)),
      'Chain': block.chainId,
      'Block Hash': block.id,
      'Round': block.round,
      'TX Counts': block.txCount,
      'Proposer': block?.proposerAddress,
      'Gas Used / Wanted': "-" 
    };
  }
})

watch((sumAggregates), () => {
  const blockInfo = blockInformation.value;
  if (sumAggregates.value)
    blockInformation.value = { ...blockInfo, 'Gas Used / Wanted': `${sumAggregates.value.gasUsed}/${sumAggregates.value.gasWanted}` };
})

const edit = ref(false);
const newHeight = ref(props.height);
function updateTarget() {
  target.value = Number(newHeight.value);
  console.log(target.value);
}

// onBeforeRouteUpdate(async (to, from, next) => {
//   if (from.path !== to.path) {
//     debugger
//     current.value = await BlogService.getBlockDetail(props.chain, target.value)
//     sumAggregates.value = await BlogService.getAggregates(props.chain, target.value);
//     next();
//   }
// });
</script>
<template>
  <div>
    <div v-if="isFutureBlock" class="text-center">
      <div v-if="remainingBlocks > 0">
        <div class="text-white font-bold text-lg my-10">#{{ target }}</div>
        <Countdown :time="estimateTime" css="md:mx-3 mx-2" />
        <div class="my-5 text-[#B4B7BB] font-normal text-[14px]">
          {{ $t('block.estimated_time') }}:
          <span class="text-xl font-normal">{{
            format.toLocaleDate(estimateDate)
            }}</span>
        </div>
        <div class="pt-10 flex justify-center">
          <div class="box-content !p-6 rounded-2xl !bg-base">
            <table class="table w-max rounded-2xl">
              <tbody>
                <tr class="hover hover:brightness-150 rounded cursor-pointer !border-base-300" @click="edit = !edit">
                  <td>{{ $t('block.countdown_for_block') }}:</td>
                  <td class="text-right">
                    <span class="md:!ml-40">{{ target }}</span>
                  </td>
                </tr>
                <tr v-if="edit" class="!border-base-300">
                  <td colspan="2" class="text-center">
                    <h3 class="text-lg font-bold">
                      {{ $t('block.countdown_for_block_input') }}
                    </h3>
                    <div class="py-4">
                      <div class="join">
                        <input class="input input-bordered join-item !bg-base-300" v-model="newHeight" type="number" />
                        <button class="btn btn-primary join-item" @click="updateTarget()">
                          {{ $t('block.btn_update') }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr class="!border-base-300">
                  <td>{{ $t('block.current_height') }}:</td>
                  <td class="text-right">
                    #{{ store.latest?.block?.header.height }}
                  </td>
                </tr>
                <tr class="!border-base-300">
                  <td>{{ $t('block.remaining_blocks') }}:</td>
                  <td class="text-right">{{ remainingBlocks }}</td>
                </tr>
                <tr class="!border-base-300">
                  <td>{{ $t('block.average_block_time') }}:</td>
                  <td class="text-right">
                    {{ (store.blocktime / 1000).toFixed(1) }}s
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          <p class="">Block #{{ height }}</p>
          <div class="flex" v-if="props.height">
            <RouterLink :to="`/${store.blockchain.chainName}/block/${height - 1}`"
              class="btn btn-primary btn-sm p-1 text-2xl mr-2">
              <Icon icon="mdi-arrow-left" class="w-full h-full" />
            </RouterLink>
            <RouterLink :to="`/${store.blockchain.chainName}/block/${height + 1}`"
              class="btn btn-primary btn-sm p-1 text-2xl">
              <Icon icon="mdi-arrow-right" class="w-full h-full" />
            </RouterLink>
          </div>
        </h2>
        <!-- <div>
          <DynamicComponent :value="current.blockId" />
        </div> -->
      </div>

      <!-- <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          {{ $t('block.block_header') }}
        </h2>
        <DynamicComponent :value="current.block?.header" />
      </div> -->

      <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          <p class="">Block Information</p>
        </h2>
        <div class="w-full h-[1px] bg-[#242627] my-2"></div>
        <div class="overflow-auto">
          <table class="table table-compact w-full text-sm">
            <tbody>
              <tr v-for="(v, k) of blockInformation">
                <td class="capitalize whitespace-break-spaces min-w-max">
                  {{ k }}
                </td>
                <td class="w-4/5">
                  <div class="overflow-hidden w-auto whitespace-normal">
                    <p>{{ v }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          {{ $t('account.transactions') }}
        </h2>
        <div class="w-full h-[1px] bg-[#242627] my-2"></div>
        <!-- <TxsElement :value="current.block" /> -->
        <div v-if="CHAIN_INDEXS.includes(chain)">
          <TransactionBlockIndexs :height="height" :chain="chain" />
        </div>
        <div v-else>
          <TransactionBlockRpc :value="current.block" :chain="chain" :height="height" :time="blockInformation?.Time" />
        </div>
      </div>

      <!-- <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          {{ $t('block.last_commit') }}
        </h2>
        <DynamicComponent :value="commit" />
      </div> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useBaseStore, useFormatter } from '@/stores';
import Countdown from '@/components/Countdown.vue';
import type { BlockResponse } from '@cosmjs/tendermint-rpc';
import { toBase64 } from '@cosmjs/encoding';
import TransactionBlockIndexs from '@/components/blocks/TransactionBlockIndexs.vue';
import TransactionBlockRpc from '@/components/blocks/TransactionBlockRpc.vue';
import BlockHeader from './BlockHeader.vue';
import BlockInformation from './BlockInformation.vue';

const props = defineProps(['height', 'chain']);

const store = useBaseStore();
const format = useFormatter();
const current = ref({} as BlockResponse);
const target = ref(Number(props.height || 0));
const blockInformation = ref();
const height = computed(() => {
  return Number(current.value.block?.header?.height || props.height || 0);
});

const isFutureBlock = computed({
  get: () => {
    const latest = store.latest?.block?.header.height;
    const isFuture = latest ? target.value > Number(latest) : true;
    if (!isFuture && !current.value.blockId)
      store.fetchBlock(target.value).then((x) => {
        current.value = x;
      });
    return isFuture;
  },
  set: (val) => {
    console.log(val);
  },
});

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
  const blockId = current.value?.blockId;
  const headerBlock = block?.header;
  const lastCommit = block?.lastCommit;
  const time = headerBlock?.time;
  const chainId = headerBlock?.chainId;
  const blockHash = toBase64(blockId?.hash);
  const round = lastCommit?.round;
  const txCount = block?.txs?.length;
  const proposerAddress = headerBlock?.proposerAddress;
  const proposer = format.validator(proposerAddress && toBase64(proposerAddress))
  blockInformation.value = {
    'Time': format.toLocaleDate(time.toString()),
    'Chain': chainId,
    'Block Hash': blockHash,
    'Round': round,
    'TX Counts': txCount,
    'Proposer': proposer
  }
})

const edit = ref(false);
const newHeight = ref(props.height);
function updateTarget() {
  target.value = Number(newHeight.value);
  console.log(target.value);
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (from.path !== to.path) {
    store.fetchBlock(String(to.params.height)).then((x) => {
      current.value = x;
    });
    next();
  }
});
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
      <BlockHeader :height="height" :chain="chain" />
      <BlockInformation :blockInformation="blockInformation" />
      <div class="box-content">
        <h2 class="card-title flex flex-row justify-between text-white">
          {{ $t('account.transactions') }}
        </h2>
        <div class="w-full h-[1px] bg-[#242627] my-2"></div>
        <div>
          <TransactionBlockRpc :value="current.block" :chain="chain" :height="height" :time="blockInformation?.Time" />
        </div>
      </div>
    </div>
  </div>
</template>

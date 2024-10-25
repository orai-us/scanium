<script lang="ts" setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import {
  useStakingStore,
  useBaseStore,
  useBlockchain,
} from '@/stores';
import UptimeBar from '@/components/UptimeBar.vue';
import {
  consensusPubkeyToHexAddress,
  valconsToBase64,
} from '@/libs';
import type { Commit } from '@cosmjs/tendermint-rpc';
import type {
  Params,
  ValidatorSigningInfo,
} from 'cosmjs-types/cosmos/slashing/v1beta1/slashing';

const props = defineProps(['keyword']);

const stakingStore = useStakingStore();
const baseStore = useBaseStore();
const chainStore = useBlockchain();
const latest = ref(0);
const commits = ref([] as Commit[]);
const live = ref(true);
const slashingParam = ref({} as Params);

const signingInfo = ref({} as Record<string, ValidatorSigningInfo>);

// filter validators by keywords
const validators = computed(() => {
  if (props.keyword)
    return stakingStore.validators.filter(
      (x) => x.description.moniker.toLowerCase().includes(props.keyword.toLowerCase())
    );
  return stakingStore.validators;
});

const list = computed(() => {
  if (chainStore.isConsumerChain) {
    stakingStore.loadKeyRotationFromLocalstorage(
      baseStore.latest?.block?.header?.chainId
    );

    const window = Number(slashingParam.value.signedBlocksWindow || 0);
    const vset = validators.value.map((v) => {
      const hexAddress = stakingStore.findRotatedHexAddress(v.consensusPubkey!);
      const signing = signingInfo.value[hexAddress];
      return {
        v,
        signing,
        hex: hexAddress,
        uptime:
          signing && window > 0
            ? (window - Number(signing.missedBlocksCounter)) / window
            : undefined,
      };
    });
    return vset;
  } else {
    const window = Number(slashingParam.value.signedBlocksWindow || 0);
    const vset = validators.value.map((v) => {
      const signing =
        signingInfo.value[consensusPubkeyToHexAddress(v.consensusPubkey)];
      return {
        v,
        signing,
        hex: consensusPubkeyToHexAddress(v.consensusPubkey),
        uptime:
          signing && window > 0
            ? (window - Number(signing.missedBlocksCounter)) / window
            : undefined,
      };
    });
    return vset;
  }
});

onMounted(() => {
  live.value = true;
  baseStore.fetchLatest().then((l) => {
    let b = l;
    if (
      baseStore.recents?.findIndex(
        (x) => x.block.header.height === l.block.header.height
      ) > -1
    ) {
      b = baseStore.recents?.at(0) || l;
    }
    latest.value = Number(b.block.header.height);
    b.block.lastCommit && commits.value.unshift(b.block.lastCommit);
    const height = Number(b.block.header?.height || 0);
    if (height > 50) {
      // constructs sequence for loading blocks
      let promise = Promise.resolve();
      for (let i = height - 1; i > height - 50; i -= 1) {
        promise = promise.then(
          () =>
            new Promise((resolve, reject) => {
              if (live.value && commits2.value.length < 50) {
                // continue only if the page is living
                baseStore.fetchBlock(i).then((x) => {
                  x.block.lastCommit &&
                    commits.value.unshift(x.block.lastCommit);
                  resolve();
                });
              }
            })
        );
      }
    }
  });

  updateTotalSigningInfo();

  chainStore.rpc.getSlashingParams().then((x) => {
    slashingParam.value = x.params;
  });
});

function updateTotalSigningInfo() {
  chainStore.rpc.getSlashingSigningInfos().then((x) => {
    x.info?.forEach((i) => {
      signingInfo.value[valconsToBase64(i.address)] = i;
    });
  });
}

const commits2 = computed(() => {
  const la = baseStore.recents.map((b) => b.block.lastCommit!);
  // trigger update total signing info
  if (la.length > 1 && Number(la.at(la.length - 1)?.height || 0) % 10 === 7) {
    updateTotalSigningInfo();
  }
  const all = [...commits.value, ...la];
  return all.length > 50 ? all.slice(all.length - 50) : all;
});

onUnmounted(() => {
  live.value = false;
});

//const tab = ref(window.location.hash.search("block")>-1?"2":"3")
const tab = ref('3');
function changeTab(v: string) {
  tab.value = v;
}

</script>

<template>
  <div class="flex flex-row flex-wrap gap-x-4 mt-4 justify-center">
    <div v-for="({ v, signing, hex }, i) in list" :key="i">
      <div class="flex items-center justify-between py-0 w-[298px]">
        <label class="truncate text-sm mb-1">
          <span class="ml-1 text-black dark:text-white">{{ i + 1 }}.{{ v.description.moniker }}</span>
        </label>
        <div v-if="Number(signing?.missedBlocksCounter || 0) > 10"
          class="badge badge-sm bg-transparent border-0 text-red-500 font-bold">
          {{ signing?.missedBlocksCounter }}
        </div>
        <div v-else class="badge badge-sm bg-transparent text-green-600 border-0 font-bold">
          {{ signing?.missedBlocksCounter }}
        </div>
      </div>
      <UptimeBar :blocks="commits2" :validator="hex" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'UptimeStaking',
};
</script>
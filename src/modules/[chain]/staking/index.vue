<script lang="ts" setup>
import {
  useBaseStore,
  useBlockchain,
  useFormatter,
  useMintStore,
  useStakingStore,
  useTxDialog,
} from '@/stores';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { Key, SigningInfo } from '@/types';
import { formatSeconds } from '@/libs/utils';
import type { Validator } from 'cosmjs-types/cosmos/staking/v1beta1/staking';
import type { Params, ValidatorSigningInfo } from 'cosmjs-types/cosmos/slashing/v1beta1/slashing';
import { toBase64 } from '@cosmjs/encoding';
import type { Any } from 'cosmjs-types/google/protobuf/any';
import { consensusPubkeyToHexAddress, decodeKey, valconsToBase64 } from '@/libs';
import { Commit } from '@cosmjs/tendermint-rpc';
import UptimeBar from '@/components/UptimeBar.vue';

enum SORT_TYPE {
  ASC = "asc",
  DESC = "desc"
}

const props = defineProps(['chain']);

const staking = useStakingStore();
const base = useBaseStore();
const format = useFormatter();
const dialog = useTxDialog();
const chainStore = useBlockchain();
const mintStore = useMintStore();

const cache = JSON.parse(localStorage.getItem('avatars') || '{}');
const avatars = ref(cache || {});
const latest = ref({} as Record<string, number>);
const yesterday = ref({} as Record<string, number>);
const tab = ref('active');
const unbondList = ref([] as Validator[]);
const slashing = ref({} as Params);
const keywordSearchValidator = ref("");
const sortDes = reactive({
  field: "voting_power",
  type: SORT_TYPE.DESC
});

onMounted(() => {
  // staking.fetchUnbondingValdiators().then((res) => {
  //   unbondList.value = res.concat(unbondList.value);
  // });
  staking.fetchInacitveValdiators().then((res) => {
    unbondList.value = unbondList.value.concat(res);
  });
  chainStore.rpc.getSlashingParams().then((res) => {
    slashing.value = res.params;
  });
});

async function fetchChange() {
  let page = 0;

  let height = Number(base.latest?.block?.header?.height || 0);
  if (height > 14400) {
    height -= 14400;
  } else {
    height = 1;
  }
  // voting power in 24h ago
  while (page < staking.validators.length && height > 0) {
    await base.fetchValidatorByHeight(height, page).then((x) => {
      x.validators.forEach((v) => {
        yesterday.value[toBase64(v.pubkey?.data!)] = Number(v.votingPower);
      });
    });
    page += 100;
  }

  page = 0;
  // voting power for now
  while (page < staking.validators.length) {
    await base.fetchLatestValidators(page).then((x) => {
      x.validators.forEach((v) => {
        latest.value[toBase64(v.pubkey?.data!)] = Number(v.votingPower);
      });
    });
    page += 100;
  }
}

const changes = computed(() => {
  const changes = {} as Record<string, number>;
  Object.keys(latest.value).forEach((k) => {
    const l = latest.value[k] || 0;
    const y = yesterday.value[k] || 0;
    changes[k] = l - y;
  });
  return changes;
});

const change24 = (key: Key) => {
  const txt = key.key;
  // const n: number = latest.value[txt];
  // const o: number = yesterday.value[txt];
  // // console.log( txt, n, o)
  // return n > 0 && o > 0 ? n - o : 0;
  return changes.value[txt];
};

const change24Text = (value?: Any) => {
  if (!value) return '';
  const key = decodeKey(value);
  const v = change24(key);
  return v && v !== 0 ? format.showChanges(v) : '';
};

const change24Color = (value?: Any) => {
  if (!value) return '';
  const key = decodeKey(value);
  const v = change24(key);
  if (v > 0) return 'text-success';
  if (v < 0) return 'text-error';
};

const calculateRank = function (position: number) {
  let sum = 0;
  for (let i = 0; i < position; i++) {
    sum += Number(staking.validators[i]?.delegatorShares);
  }
  const percent = sum / staking.totalPower;

  switch (true) {
    case tab.value === 'active' && percent < 0.33:
      return 'error';
    case tab.value === 'active' && percent < 0.67:
      return 'warning';
    default:
      return 'primary';
  }
};

function isFeatured(
  endpoints: string[],
  who?: { website?: string; moniker: string }
) {
  if (!endpoints || !who) return false;
  return (
    endpoints.findIndex(
      (x) =>
        (who.website &&
          who.website
            ?.substring(0, who.website?.lastIndexOf('.'))
            .endsWith(x)) ||
        who?.moniker?.toLowerCase().search(x.toLowerCase()) > -1
    ) > -1
  );
}

const validators = computed(() => {
  return staking.validators.filter(item => item.description.moniker.toLowerCase().includes(keywordSearchValidator.value.toLowerCase()))
})

const rankActive = computed(() => {
  const result: any = {};
  staking.validators.forEach((item, index) => {
    result[item.operatorAddress] = index + 1;
  })
  return result
})

const rankInActive = computed(() => {
  const result: any = {};
  unbondList.value.forEach((item, index) => {
    result[item.operatorAddress] = index + 1;
  })
  return result
})

const list = computed(() => {
  let result: any[] = []
  if (tab.value === 'active') {
    result = validators.value.map((x, i) => ({
      v: x,
      rank: calculateRank(i),
      logo: logo(x.description.identity),
      rankNumber: rankActive.value[x.operatorAddress],
      uptime: getUpTimeValidator(x),
      change24h: change24Text(x.consensusPubkey),
      commission: format.formatCommissionRate(
        x.commission?.commissionRates?.rate,
        1e18
      )
    }));
  } else if (tab.value === "inactive") {
    result = unbondList.value.map((x, i) => ({
      v: x,
      rank: 'primary',
      rankNumber: rankInActive.value[x.operatorAddress],
      logo: logo(x.description.identity),
      uptime: getUpTimeValidator(x),
      change24h: change24Text(x.consensusPubkey),
      commission: format.formatCommissionRate(
        x.commission?.commissionRates?.rate,
        1e18
      )
    }));
  }
  return result;
  // else if (tab.value === 'featured') {
  //   const endpoint = chainStore.current?.endpoints?.rpc?.map((x) => x.provider);
  //   if (endpoint) {
  //     endpoint.push('ping');
  //     return validators.value
  //       .filter((x) => isFeatured(endpoint, x.description))
  //       .map((x, i) => ({
  //         v: x,
  //         rank: 'primary',
  //         logo: logo(x.description.identity),
  //         uptime: getUpTimeValidator(x)
  //       }));
  //   }
  //   return [];
  // }
});

watch(tab, () => {
  keywordSearchValidator.value = ""
})

const fetchAvatar = (identity: string) => {
  // fetch avatar from keybase
  return new Promise<void>((resolve) => {
    staking
      .keybase(identity)
      .then((d) => {
        if (Array.isArray(d.them) && d.them.length > 0) {
          const uri = String(d.them[0]?.pictures?.primary?.url).replace(
            'https://s3.amazonaws.com/keybase_processed_uploads/',
            ''
          );

          avatars.value[identity] = uri;
          resolve();
        } else throw new Error(`failed to fetch avatar for ${identity}`);
      })
      .catch((error) => {
        // console.error(error); // uncomment this if you want the user to see which avatars failed to load.
        resolve();
      });
  });
};

const loadAvatar = (identity: string) => {
  // fetches avatar from keybase and stores it in localStorage
  fetchAvatar(identity).then(() => {
    localStorage.setItem('avatars', JSON.stringify(avatars.value));
  });
};

const loadAvatars = () => {
  // fetches all avatars from keybase and stores it in localStorage
  const promises = staking.validators.map((validator) => {
    const identity = validator.description?.identity;

    // Here we also check whether we haven't already fetched the avatar
    if (identity && !avatars.value[identity]) {
      return fetchAvatar(identity);
    } else {
      return Promise.resolve();
    }
  });

  Promise.all(promises).then(() =>
    localStorage.setItem('avatars', JSON.stringify(avatars.value))
  );
};

const logo = (identity?: string) => {
  if (!identity || !avatars.value[identity]) return '';
  const url = avatars.value[identity] || '';
  return url.startsWith('http')
    ? url
    : `https://s3.amazonaws.com/keybase_processed_uploads/${url}`;
};

let height_in_24h = ref(0);
base.$subscribe((_, s) => {
  if (Number(s.earlest.block.header.height) !== height_in_24h.value) {
    height_in_24h.value = Number(s.earlest.block.header.height);
    fetchChange();
  }
});

//uptime
const latestUptime = ref(0);
const commits = ref([] as Commit[]);
const live = ref(true);
const slashingParam = ref({} as Params);

const getUpTimeValidator = (validator: any) => {
  for (let item of listUptime.value) {
    if (item.v.description.moniker === validator.description.moniker) return item.uptime
  }
  return null
}

const signingInfo = ref({} as Record<string, SigningInfo>);

const listUptime = computed(() => {
  if (chainStore.isConsumerChain) {
    staking.loadKeyRotationFromLocalstorage(
      base.latest?.block?.header?.chainId
    );

    const window = Number(slashingParam.value.signedBlocksWindow || 0);
    const vset = validators.value.map((v) => {
      const hexAddress = staking.findRotatedHexAddress(v.consensusPubkey!);
      const signing = signingInfo.value[hexAddress];
      return {
        v,
        signing,
        hex: hexAddress,
        uptime:
          signing && window > 0
            ? (window - Number(signing.missed_blocks_counter)) / window
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
            ? (window - Number(signing.missed_blocks_counter)) / window
            : undefined,
      };
    });
    return vset;
  }
});

onMounted(() => {
  live.value = true;
  base.fetchLatest().then((l) => {
    let b = l;
    if (
      base.recents?.findIndex(
        (x) => x.block.header.height === l.block.header.height
      ) > -1
    ) {
      b = base.recents?.at(0) || l;
    }
    latestUptime.value = Number(b.block.header.height);
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
                base.fetchBlock(i).then((x) => {
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
  chainStore.rpc.getSlashingSigningInfos1().then((x) => {
    x.info?.forEach((i) => {
      signingInfo.value[valconsToBase64(i.address)] = i;
    });
  });
}

const commits2 = computed(() => {
  const la = base.recents.map((b) => b.block.lastCommit!);
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

loadAvatars();

//sort
function handleChangeSort(field: string) {
  if (field === sortDes.field) {
    if (sortDes.type === SORT_TYPE.ASC) sortDes.type = SORT_TYPE.DESC
    else sortDes.type = SORT_TYPE.ASC
  } else {
    sortDes.field = field
    sortDes.type = SORT_TYPE.ASC
  }
}

function handleSortList(validator: any[], sortDescription: any){
  let result: any[] = [];
  switch (sortDescription.field) {
    case "voting_power":
      result = validator.sort((a, b) => {
        if (Number(a.v.tokens) > Number(b.v.tokens)) return sortDescription.type === SORT_TYPE.ASC ? 1 : -1
        return sortDescription.type === SORT_TYPE.ASC ? -1 : 1
      })
      break
    case "uptime":
      result = validator.map(item => {
        let upTimeForSort = 0;
        if (item.uptime) upTimeForSort = item.uptime
        return {
          ...item,
          upTimeForSort
        }
      }).sort((a, b) => {
        if (a.upTimeForSort > b.upTimeForSort) return sortDescription.type === SORT_TYPE.ASC ? -1 : 1
        return sortDescription.type === SORT_TYPE.ASC ? 1 : -1
      })
      break
    case "24h_changes":
      result = validator.map(item => {
        let change24hSort = 0;
        if (item.change24h) change24hSort = item.change24h
        return {
          ...item,
          change24hSort
        }
      }).sort((a, b) => {
        if (Number(a.change24hSort) > Number(b.change24hSort)) return sortDescription.type === SORT_TYPE.ASC ? -1 : 1
        return sortDescription.type === SORT_TYPE.ASC ? 1 : -1
      })
      break;
    case "commission":
      result = validator.map(item => {
        let commissionSort = 0;
        if (item.commission) commissionSort = item.commission.slice(0, -1)
        return {
          ...item,
          commissionSort
        }
      }).sort((a, b) => {
        if (Number(a.commissionSort) > Number(b.commissionSort)) return sortDescription.type === SORT_TYPE.ASC ? -1 : 1
        return sortDescription.type === SORT_TYPE.ASC ? 1 : -1
      })
      break;
    default:
      break;
  }
  return result;
}

//sort random
function shuffleArray(array: Array<any>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function groupAndShuffle(array: Array<any>, groupSize: number) {
  const sortedArray = array
    .map(e => {
      return { ...e, votingPowerMixUpTime: e.tokens * e.uptime };
    })
    .sort((a, b) => b.votingPowerMixUpTime - a.votingPowerMixUpTime);
  const groups = [];
  for (let i = 0; i < sortedArray.length; i += groupSize) {
    groups.push(sortedArray.slice(i, i + groupSize));
  }
  const shuffledGroups = groups.map(group => shuffleArray(group));
  return shuffledGroups;
}

const listRandom = ref([] as Array<any>);

watch([sortDes], () => {
  listRandom.value = handleSortList(list.value, sortDes)
})

watch([() => list.value.length], () => {
  const result: Array<any> = [];
  const groupValidator = groupAndShuffle(list.value, 10);
  for (let group of groupValidator) {
    for (let validator of group) {
      result.push(validator)
    }
  }
  listRandom.value = result
})

onMounted(() => {
  if (Array.isArray(list.value)) {
      const result: Array<any> = [];
      const groupValidator = groupAndShuffle(list.value, 10);
      for (let group of groupValidator) {
        for (let validator of group) {
          result.push(validator)
        }
      }
      listRandom.value = result
    }
})

</script>
<template>
  <div>
    <div class="rounded-lg grid sm:grid-cols-1 md:grid-cols-4 p-4 md:p-6 gap-4">
      <div class="box-border p-4">
        <span>
          <div class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2">
            <!-- <Icon class="text-[#B4B7BB]" icon="mdi:trending-up" size="32" /> -->
            <img src="../../../assets/images/svg/dup-chart.svg" alt="" />
            <div class="absolute top-0 left-0 bottom-0 right-0 bg-[rgba(180,183,187,0.10)]"></div>
          </div>
        </span>
        <span class="text-center">
          <div class="font-semibold mt-2 text-white text-[18px]">
            {{ format.percent(mintStore.inflation) }}
          </div>
          <div class="text-[14px] font-normal leading-5">
            {{ $t('staking.inflation') }}
          </div>
        </span>
      </div>
      <div class="box-border p-4">
        <span>
          <div class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2">
            <!-- <Icon
              class="text-[#B4B7BB]"
              icon="mdi:lock-open-outline"
              size="32"
            /> -->
            <img src="../../../assets/images/svg/lock.svg" alt="" />
            <div class="absolute top-0 left-0 bottom-0 right-0 bg-[rgba(180,183,187,0.10)]"></div>
          </div>
        </span>
        <span class="text-center">
          <div class="font-semibold mt-2 text-white text-[18px]">
            {{ formatSeconds(staking.params?.unbondingTime) }}
          </div>
          <div class="text-[14px] font-normal leading-5">
            {{ $t('staking.unbonding_time') }}
          </div>
        </span>
      </div>
      <div class="box-border p-4">
        <span>
          <div class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2">
            <!-- <Icon
              class="text-[#B4B7BB]"
              icon="mdi:alert-octagon-outline"
              size="32"
            /> -->

            <img src="../../../assets/images/svg/warning.svg" alt="" />
            <div class="absolute top-0 left-0 bottom-0 right-0 bg-[rgba(180,183,187,0.10)]"></div>
          </div>
        </span>
        <span class="text-center">
          <div class="font-semibold mt-2 text-white text-[18px]">
            {{ format.percent(slashing.slashFractionDoubleSign, 1e18) }}
          </div>
          <div class="text-[14px] font-normal leading-5">
            {{ $t('staking.double_sign_slashing') }}
          </div>
        </span>
      </div>
      <div class="box-border p-4">
        <span>
          <div class="relative w-9 h-9 rounded overflow-hidden flex items-center justify-center mr-2">
            <!-- <Icon class="text-[#B4B7BB]" icon="mdi:pause" size="32" /> -->

            <img src="../../../assets/images/svg/pause.svg" alt="" />
            <div class="absolute top-0 left-0 bottom-0 right-0 bg-[rgba(180,183,187,0.10)]"></div>
          </div>
        </span>
        <span class="text-center">
          <div class="font-semibold mt-2 text-white text-[18px]">
            {{ format.percent(slashing.slashFractionDowntime, 1e18) }}
          </div>
          <div class="text-[14px] font-normal leading-5">
            {{ $t('staking.downtime_slashing') }}
          </div>
        </span>
      </div>
    </div>

    <div class="pt-6 bg-[#141416] border border-[#242627] rounded-2xl mx-4 md:mx-6">
      <div class="flex items-center justify-between py-1 px-2">
        <div class="customTab tabs tabs-boxed bg-transparent">
          <!-- <a
            class="tab text-gray-400"
            :class="{ 'tab-active': tab === 'featured' }"
            @click="tab = 'featured'"
            >{{ $t('staking.popular') }}</a
          > -->
          <a class="tab text-gray-400" :class="{ 'tab-active': tab === 'active' }" @click="tab = 'active'">{{
            $t('staking.active') }}</a>
          <a class="tab text-gray-400" :class="{ 'tab-active': tab === 'inactive' }" @click="tab = 'inactive'">{{
            $t('staking.inactive') }}</a>
          <a class="tab text-gray-400" :class="{ 'tab-active': tab === 'uptime' }" @click="tab = 'uptime'">Uptime</a>
        </div>
        <input class="input w-[30%] !input-bordered" v-model="keywordSearchValidator"
          placeholder="Search validators name" />
        <!-- <div class="text-lg font-semibold pr-4">
          {{ list.length }}/{{ staking.params.maxValidators }}
        </div> -->
      </div>
      <div class="w-full h-[1px] bg-[#242627] my-2"></div>

      <div class="px-4 pt-3 pb-4 rounded shadow" v-if="tab !== 'uptime'">
        <div class="overflow-x-auto">
          <table class="table staking-table w-full">
            <thead>
              <tr>
                <th scope="col" class="uppercase" style="width: 3rem; position: relative">
                  {{ $t('staking.rank') }}
                </th>
                <th scope="col" class="uppercase hover:text-white hover:cursor-pointer">
                  {{ $t('staking.validator') }}
                </th>
                <th scope="col" class="text-right uppercase hover:text-white hover:cursor-pointer"
                  @click="handleChangeSort('voting_power')">
                  {{ $t('staking.voting_power') }}
                </th>
                <th scope="col" class="text-right uppercase hover:text-white hover:cursor-pointer"
                  @click="handleChangeSort('uptime')">
                  Uptime
                </th>
                <th scope="col" class="text-right uppercase hover:text-white hover:cursor-pointer"
                  @click="handleChangeSort('24h_changes')">
                  {{ $t('staking.24h_changes') }}
                </th>
                <th scope="col" class="text-right uppercase hover:text-white hover:cursor-pointer"
                  @click="handleChangeSort('commission')">
                  {{ $t('staking.commission') }}
                </th>
                <th scope="col" class="text-center uppercase" @click="handleChangeSort('voting_power')">
                  {{ $t('staking.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="({ v, rank, logo, uptime, change24h, commission, rankNumber }, i) in listRandom"
                :key="v.operatorAddress" class="hover:bg-gray-100 dark:hover:bg-base-300">
                <!-- 👉 rank -->
                <td>
                  <div class="text-xs truncate relative px-2 py-1 rounded-full w-fit" :class="`text-${rank}`">
                    <span class="inset-x-0 inset-y-0 opacity-10 absolute" :class="`bg-${rank}`"></span>
                    {{ rankNumber }}
                  </div>
                </td>
                <!-- 👉 Validator -->
                <td>
                  <div class="flex items-center overflow-hidden" style="max-width: 300px">
                    <div class="avatar mr-4 relative w-8 h-8 rounded-full">
                      <div class="w-8 h-8 rounded-full bg-gray-400 absolute opacity-10"></div>
                      <div class="w-8 h-8 rounded-full">
                        <img v-if="logo" :src="logo" class="object-contain" @error="(e) => {
                            const identity = v.description?.identity;
                            if (identity) loadAvatar(identity);
                          }
                          " />
                        <Icon v-else class="text-3xl" :icon="`mdi-help-circle-outline`" />
                      </div>
                    </div>

                    <div class="flex flex-col">
                      <span class="text-sm text-primary dark:text-link whitespace-nowrap overflow-hidden">
                        <RouterLink :to="{
                          name: 'chain-staking-validator',
                          params: {
                            validator: v.operatorAddress,
                          },
                        }" class="font-weight-medium">
                          {{ v.description?.moniker }}
                        </RouterLink>
                      </span>
                      <span class="text-xs">{{
                        v.description?.website || v.description?.identity || '-'
                        }}</span>
                    </div>
                  </div>
                </td>

                <!-- 👉 Voting Power -->
                <td class="text-right">
                  <div class="flex flex-col">
                    <h6 class="text-sm font-weight-medium whitespace-nowrap">
                      {{
                        format.formatToken(
                        {
                        amount: parseInt(v.tokens).toString(),
                        denom: staking.params.bondDenom,
                        },
                        true,
                        '0,0'
                        )
                      }}
                    </h6>
                    <span class="text-xs">{{
                      format.calculatePercent(
                      v.delegatorShares,
                      staking.totalPower
                      )
                      }}</span>
                  </div>
                </td>
                <!-- 👉 Uptime  -->
                <td class="text-[#39DD47] text-right text-xs">
                  <span :class="Number(getUpTimeValidator(v)) && Number(getUpTimeValidator(v)) > 0.95 ? 'text-green-500' : 'text-red-500'
                    ">
                    <div class="tooltip">
                      {{ format.percent(Number(getUpTimeValidator(v))) }}
                    </div>
                  </span>
                </td>
                <!-- 👉 24h Changes -->
                <td class="text-right text-xs" :class="change24Color(v.consensusPubkey)">
                  {{ change24Text(v.consensusPubkey) }}
                </td>
                <!-- 👉 commission -->
                <td class="text-right text-xs">
                  {{ commission }}
                </td>
                <!-- 👉 Action -->
                <td class="text-center">
                  <div class="flex items-center justify-center">
                    <div v-if="v.jailed" class="badge badge-error gap-2 text-white">
                      {{ $t('staking.jailed') }}
                    </div>
                    <label v-else for="delegate" class="btn-third !py-1 !px-3 capitalize !h-[unset]" @click="
                      dialog.open('delegate', {
                        validator_address: v.operatorAddress,
                      })
                      ">{{ $t('account.btn_delegate') }}</label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row items-center">
          <div class="text-xs truncate relative py-2 px-4 rounded-md w-fit text-error mr-2">
            <span class="inset-x-0 inset-y-0 opacity-10 absolute bg-error"></span>
            {{ $t('staking.top') }} 33%
          </div>
          <div class="text-xs truncate relative py-2 px-4 rounded-md w-fit text-warning">
            <span class="inset-x-0 inset-y-0 opacity-10 absolute bg-warning"></span>
            {{ $t('staking.top') }} 67%
          </div>
          <div class="text-xs hidden md:!block pl-2">
            {{ $t('staking.description') }}
          </div>
        </div>
      </div>
      <div v-if="tab === 'uptime'">
        <div class="flex flex-row flex-wrap gap-x-4 mt-4 justify-center">
          <div v-for="({ v, signing, hex }, i) in listUptime" :key="i">
            <div class="flex items-center justify-between py-0 w-[298px]">
              <label class="truncate text-sm mb-1">
                <span class="ml-1 text-black dark:text-white">{{ i + 1 }}.{{ v.description.moniker }}</span>
              </label>
              <div v-if="Number(signing?.missed_blocks_counter || 0) > 10"
                class="badge badge-sm bg-transparent border-0 text-red-500 font-bold">
                {{ signing?.missed_blocks_counter }}
              </div>
              <div v-else class="badge badge-sm bg-transparent text-green-600 border-0 font-bold">
                {{ signing?.missed_blocks_counter }}
              </div>
            </div>
            <UptimeBar :blocks="commits2" :validator="hex" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'staking',
      order: 3
    }
  }
</route>

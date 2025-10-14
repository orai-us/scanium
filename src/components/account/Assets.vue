<script lang="ts" setup>
import { useBlockchain, useStakingStore } from '@/stores';
import { computed, onMounted, ref, watch } from 'vue';
import DonutChart from '../charts/DonutChart.vue';
import { Icon } from '@iconify/vue';
import {
  getCw20Balances,
  getPriceByIds,
  getPricePoolTokens,
} from '@/service/assetsService';
import { formatNumber, shortenDenom } from '@/utils';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps([
  'balances',
  'delegations',
  'rewards',
  'unbondingTotal',
  'address',
  'chain',
]);

const route = useRoute();
const router = useRouter();
const supportedAssets = computed(() => {
  const supported = route.query.supported === 'false' ? false : true;
  return supported;
});
const stakingStore = useStakingStore();
const blockchain = useBlockchain();

const totalValue = ref(0);
const totalAmountByCategory = ref([] as Array<any>);
const balancesChain = ref([] as Array<any>);
const priceBySymbol = ref({} as any);
const pricePoolTokensOraidex = ref({} as any);

const labels = ['Balance', 'Delegation', 'Reward', 'Unbonding'];

function changeStatusSupported(supported: boolean) {
  router.push({
    path: `/${props.chain}/account/${props.address}`,
    query: { ...route.query, supported: supported.toString() },
  });
}

async function fetchBalancesCw20() {
  const assets = blockchain.current?.assets;

  if (Array.isArray(assets)) {
    const assetCw20s = assets.filter(
      (item: any) => item?.type_asset === 'cw20'
    );
    if (!assetCw20s) return;
    const contractAddresses = [];
    for (const asset of assetCw20s) {
      if (!!asset) contractAddresses.push(asset.base);
    }

    const multiplyContract = await getCw20Balances(
      props.address,
      contractAddresses
    );

    if (!!multiplyContract && multiplyContract.data) {
      const returnData = multiplyContract.data.return_data;
      if (!!returnData) {
        const returnDataBalance = returnData.map(
          (rs: any) => JSON.parse(atob(rs.data)).balance
        );

        const balances = returnDataBalance
          ?.map((item: string, index: number) => ({
            denom: assetCw20s[index].denom_units[1].denom,
            amount: Number(item).toString(),
          }))
          .filter((balance: any) => balance?.amount != '0');
        if (!balances) return;
        balancesChain.value = balances;
      }
    }
  }
}

async function fetchPricePoolTokens() {
  try {
    const res = await getPricePoolTokens();
    pricePoolTokensOraidex.value = res;
  } catch (error) {
    console.log({ error });
  }
}

onMounted(async () => {
  fetchBalancesCw20();
  fetchPricePoolTokens();
});

watch([() => props.address], () => {
  fetchBalancesCw20();
  fetchPricePoolTokens();
});

const balancesAssets = computed(() => {
  const balances = [...props.balances, ...balancesChain.value];
  const assets = blockchain.current?.assets;
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  for (const balance of balances) {
    const denom = balance.denom;
    let id,
      exponent = 0;
    let display = denom.toUpperCase();
    if (Array.isArray(assets)) {
      const asset = assets.find(
        (item) => item.name === denom || item.base === denom
      );
      if (!!asset) {
        // @ts-ignore
        exponent = asset.exponent;
        display = asset.display;
        id = asset.coingecko_id;
      }
    }
    const amount = (balance.amount || 0) / 10 ** exponent;
    if (id) resultSupported.push({ amount, denom, display, id });
    else resultUnSupported.push({ amount, denom, display });
  }
  return supportedAssets.value ? resultSupported : resultUnSupported;
});

const delegatesAssets = computed(() => {
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  const assets = blockchain.current?.assets;
  for (let delegation of props.delegations) {
    const balance = delegation.balance;
    if (!!balance) {
      const denom = balance.denom;
      let id,
        exponent = 0;
      let display = denom?.toUpperCase();
      if (Array.isArray(assets)) {
        const asset = assets.find(
          (item) => item.name === denom || item.base === denom
        );
        if (!!asset) {
          // @ts-ignore
          exponent = asset.exponent;
          display = asset.display;
          id = asset.coingecko_id;
        }
      }
      const amount = (balance.amount || 0) / 10 ** exponent;
      if (id) resultSupported.push({ amount, denom, display, id });
      else resultUnSupported.push({ amount, denom, display });
    }
  }
  const resultDelegates = supportedAssets.value
    ? resultSupported
    : resultUnSupported;
  const groupDelegatesByDenom = resultDelegates.reduce(
    (accumulator, currentValue) => {
      if (accumulator[currentValue.denom]) {
        accumulator[currentValue.denom].amount += currentValue.amount;
      } else {
        accumulator[currentValue.denom] = currentValue;
      }
      return accumulator;
    },
    {}
  );
  return Object.values(groupDelegatesByDenom) as any;
});

const rewardsTotalAssets = computed(() => {
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  const assets = blockchain.current?.assets;
  const rewardsTotal = props.rewards?.total;
  if (Array.isArray(rewardsTotal)) {
    for (let reward of rewardsTotal) {
      const denom = reward.denom;
      let id,
        exponent = 0;
      let display = denom.toUpperCase();
      if (Array.isArray(assets)) {
        const asset = assets.find(
          (item) => item.name === reward.denom || item.base === reward.denom
        );
        if (asset) {
          // @ts-ignore
          exponent = asset.exponent;
          display = asset.display;
          id = asset.coingecko_id;
        }
      }
      const amount = (reward.amount || 0) / 10 ** 18 / 10 ** exponent;
      if (id) resultSupported.push({ amount, denom, display, id });
      else resultUnSupported.push({ amount, denom, display });
    }
  }
  return supportedAssets.value ? resultSupported : resultUnSupported;
});

const unbondingAssets = computed(() => {
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  const assets = blockchain.current?.assets;
  const totalUnbonding = Number(props.unbondingTotal);
  if (!!totalUnbonding) {
    const denom = stakingStore.params.bondDenom;
    let id,
      exponent = 0;
    let display = denom.toUpperCase();
    if (Array.isArray(assets)) {
      const asset = assets.find(
        (item) => item.name === denom || item.base === denom
      );
      if (asset) {
        // @ts-ignore
        exponent = asset.exponent;
        id = asset.coingecko_id;
        display = asset.display;
      }
    }
    const amount = totalUnbonding / 10 ** exponent;
    if (id) resultSupported.push({ amount, denom, display, id });
    else resultUnSupported.push({ amount, denom, display });
  }
  return supportedAssets.value ? resultSupported : resultUnSupported;
});

const assets = computed(() => {
  return [
    ...balancesAssets.value,
    ...delegatesAssets.value,
    ...rewardsTotalAssets.value,
    ...unbondingAssets.value,
  ];
});

watch(
  [() => assets.value.length, supportedAssets, balancesChain],
  async () => {
    const idSet = new Set();
    assets.value.forEach((item) => {
      idSet.add(item.id);
    });
    const ids = Array.from(idSet);
    const result: any = {};
    if (ids?.length > 0) {
      assets.value.forEach((item) => {
        if (pricePoolTokensOraidex.value[item.denom]) {
          result[item.id] = pricePoolTokensOraidex.value[item.denom];
        }
      });
      const promiseAllInfoToken = [];
      for (let i = 0; i < ids.length; i += 10) {
        promiseAllInfoToken.push(
          getPriceByIds({ ids: ids.slice(i, i + 10).join(',') })
        );
      }
      const infoTokens = await Promise.all(promiseAllInfoToken);
      if (Array.isArray(infoTokens)) {
        infoTokens.forEach((info) => {
          for (let item of Object.keys(info)) {
            result[item] = info[item]?.usd;
          }
        });
      }
      priceBySymbol.value = result;

      let total = 0;
      for (let item of assets.value) {
        if (result[item.id]) total += item.amount * result[item.id];
      }
      totalValue.value = total;
    } else {
      totalValue.value = 0;
    }

    let sumBalance = 0;
    let sumDelegate = 0;
    let sumReward = 0;
    let sumUnbonding = 0;

    for (let item of balancesAssets.value) {
      const price = result[item.id] ? result[item.id] : 1;
      sumBalance += item.amount * price;
    }

    for (let item of delegatesAssets.value) {
      const price = result[item.id] ? result[item.id] : 1;
      sumDelegate += item.amount * price;
    }

    for (let item of rewardsTotalAssets.value) {
      const price = result[item.id] ? result[item.id] : 1;
      sumReward += item.amount * price;
    }

    for (let item of unbondingAssets.value) {
      const price = result[item.id] ? result[item.id] : 1;
      sumUnbonding += item.amount * price;
    }

    totalAmountByCategory.value = [
      sumBalance,
      sumDelegate,
      sumReward,
      sumUnbonding,
    ];
  },
  { flush: 'post' }
);

let showCopyToast = ref(null as any);

const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = true;
    setTimeout(() => {
      showCopyToast.value = null;
    }, 1000);
  } catch (err) {
    showCopyToast.value = false;
    setTimeout(() => {
      showCopyToast.value = null;
    }, 1000);
  }
};

const tipMsg = computed(() => {
  return showCopyToast.value === false
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});
</script>

<template>
  <div
    class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]"
  >
    <div class="flex xl:flex-row flex-col justify-between">
      <h2 class="card-title mb-4 text-white">{{ $t('account.assets') }}</h2>
      <div class="flex gap-2 mb-4 w-full xl:w-[300px]">
        <button
          class="w-1/2 xl:text-sm text-xs py-2"
          :class="{ 'bg-base rounded-md text-white': supportedAssets }"
          @click="changeStatusSupported(true)"
        >
          Supported Assets
        </button>
        <button
          class="w-1/2 xl:text-sm text-xs py-2"
          :class="{ 'bg-base rounded-md text-white': !supportedAssets }"
          @click="changeStatusSupported(false)"
        >
          Unsupported Assets
        </button>
      </div>
    </div>

    <div class="grid md:!grid-cols-3">
      <div class="md:!col-span-1">
        <DonutChart :series="totalAmountByCategory" :labels="labels" />
      </div>
      <div class="mt-4 md:!col-span-2 md:!mt-0 md:!ml-4">
        <!-- list-->
        <div class="xl:max-h-80 md:max-h-60 overflow-scroll">
          <!--balances  -->
          <div
            class="flex items-center px-4 mb-2"
            v-for="(balanceItem, index) in balancesAssets"
            :key="index"
          >
            <div
              class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4"
            >
              <Icon icon="mdi-account-cash" class="text-info" size="20" />
              <div
                class="absolute top-0 bottom-0 left-0 right-0 bg-info opacity-20"
              ></div>
            </div>
            <div class="flex-1">
              <div
                class="xl:text-sm text-xs font-semibold"
                v-if="supportedAssets"
              >
                {{ formatNumber(balanceItem?.amount) }}
                {{ balanceItem?.display?.toUpperCase() }}
              </div>
              <div
                class="text-sm font-semibold flex gap-1 flex-col xl:flex-row"
                v-else
              >
                {{ formatNumber(balanceItem?.amount) }}
                <div
                  class="flex gap-1 items-center hover:cursor-pointer"
                  @click="copyWebsite(balanceItem?.denom?.toUpperCase() || '')"
                >
                  <span class="xl:text-sm text-xs font-semibold">{{
                    shortenDenom(balanceItem?.denom?.toUpperCase())
                  }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3" />
                </div>
              </div>
              <div class="text-xs">
                {{
                  formatNumber(
                    (((priceBySymbol[balanceItem?.id] || 0) *
                      balanceItem?.amount) /
                      totalValue) *
                      100
                  )
                }}%
              </div>
            </div>
            <div
              class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2"
            >
              ${{
                formatNumber(
                  (priceBySymbol[balanceItem?.id] || 0) * balanceItem?.amount
                )
              }}
            </div>
          </div>
          <!--delegations  -->
          <div
            class="flex items-center px-4 mb-2"
            v-for="(delegationItem, index) in delegatesAssets"
            :key="index"
          >
            <div
              class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4"
            >
              <Icon icon="mdi-user-clock" class="text-warning" size="20" />
              <div
                class="absolute top-0 bottom-0 left-0 right-0 bg-warning opacity-20"
              ></div>
            </div>
            <div class="flex-1">
              <div
                class="xl:text-sm text-xs font-semibold"
                v-if="supportedAssets"
              >
                {{ formatNumber(delegationItem?.amount) }}
                {{ delegationItem?.denom?.toUpperCase() }}
              </div>
              <div
                class="text-sm font-semibold flex gap-1 flex-col xl:flex-row"
                v-else
              >
                {{ formatNumber(delegationItem?.amount) }}
                <div
                  class="flex gap-1 items-center hover:cursor-pointer"
                  @click="
                    copyWebsite(delegationItem?.denom?.toUpperCase() || '')
                  "
                >
                  <span class="xl:text-sm text-xs font-semibold">{{
                    shortenDenom(delegationItem?.denom?.toUpperCase())
                  }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3" />
                </div>
              </div>
              <div class="text-xs">
                {{
                  formatNumber(
                    ((priceBySymbol[delegationItem?.id] *
                      delegationItem?.amount) /
                      totalValue) *
                      100
                  )
                }}%
              </div>
            </div>
            <div
              class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2"
            >
              ${{
                formatNumber(
                  priceBySymbol[delegationItem?.id] * delegationItem?.amount
                )
              }}
            </div>
          </div>
          <!-- rewards.total -->
          <div
            class="flex items-center px-4 mb-2"
            v-for="(rewardItem, index) in rewardsTotalAssets"
            :key="index"
          >
            <div
              class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4"
            >
              <Icon
                icon="mdi-account-arrow-up"
                class="text-success"
                size="20"
              />
              <div
                class="absolute top-0 bottom-0 left-0 right-0 bg-success opacity-20"
              ></div>
            </div>
            <div class="flex-1">
              <div
                class="xl:text-sm text-xs font-semibold"
                v-if="supportedAssets"
              >
                {{ formatNumber(rewardItem?.amount) }}
                {{ rewardItem?.denom?.toUpperCase() }}
              </div>
              <div
                class="text-sm font-semibold flex gap-1 flex-col xl:flex-row"
                v-else
              >
                {{ formatNumber(rewardItem?.amount) }}
                <div
                  class="flex gap-1 items-center hover:cursor-pointer"
                  @click="copyWebsite(rewardItem?.denom?.toUpperCase() || '')"
                >
                  <span class="xl:text-sm text-xs font-semibold">{{
                    shortenDenom(rewardItem?.denom?.toUpperCase())
                  }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3" />
                </div>
              </div>
              <div class="text-xs">
                {{
                  formatNumber(
                    (((priceBySymbol[rewardItem?.id] || 0) *
                      rewardItem?.amount) /
                      totalValue) *
                      100
                  )
                }}%
              </div>
            </div>
            <div
              class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2"
            >
              ${{
                formatNumber(
                  (priceBySymbol[rewardItem?.id] || 0) * rewardItem?.amount
                )
              }}
            </div>
          </div>
          <!-- mdi-account-arrow-right -->
          <div
            class="flex items-center px-4"
            v-if="unbondingAssets?.length > 0"
          >
            <div
              class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4"
            >
              <Icon
                icon="mdi-account-arrow-right"
                class="text-error"
                size="20"
              />
              <div
                class="absolute top-0 bottom-0 left-0 right-0 bg-error opacity-20"
              ></div>
            </div>
            <div class="flex-1">
              <div
                class="xl:text-sm text-xs font-semibold"
                v-if="supportedAssets"
              >
                {{ formatNumber(unbondingAssets[0]?.amount) }}
                {{ unbondingAssets[0]?.denom?.toUpperCase() }}
              </div>
              <div
                class="text-sm font-semibold flex gap-1 flex-col xl:flex-row"
                v-else
              >
                {{ formatNumber(unbondingAssets[0]?.amount) }}
                <div
                  class="flex gap-1 items-center hover:cursor-pointer"
                  @click="
                    copyWebsite(unbondingAssets[0]?.denom?.toUpperCase() || '')
                  "
                >
                  <span class="xl:text-sm text-xs font-semibold">{{
                    shortenDenom(unbondingAssets[0]?.denom?.toUpperCase())
                  }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3" />
                </div>
              </div>
              <div class="text-xs">
                {{
                  formatNumber(
                    (((priceBySymbol[unbondingAssets[0]?.id] || 0) *
                      unbondingAssets[0]?.amount) /
                      totalValue) *
                      100
                  )
                }}%
              </div>
            </div>
            <div
              class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2"
            >
              ${{
                formatNumber(
                  (priceBySymbol[unbondingAssets[0]?.id] || 0) *
                    unbondingAssets[0]?.amount
                )
              }}
            </div>
          </div>
        </div>
        <div
          class="mt-4 text-lg font-semibold mr-5 pl-5 border-t border-base-300 pt-4 text-right"
        >
          {{ $t('account.total_value') }}: ${{
            totalValue ? formatNumber(totalValue) : 0
          }}
        </div>
      </div>
    </div>
    <div class="toast z-10" v-show="showCopyToast === true">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast z-10" v-show="showCopyToast === false">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Assets',
};
</script>

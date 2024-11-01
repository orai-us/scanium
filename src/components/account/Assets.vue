<script lang="ts" setup>
import { useFormatter, useStakingStore } from '@/stores';
import { computed, ref, toRaw, watch, watchEffect } from 'vue';
import DonutChart from '../charts/DonutChart.vue';
import { Icon } from '@iconify/vue';
import { LIST_COIN } from '@/constants';
import { getPriceByIds } from '@/service/assetsService';
import numeral from 'numeral';

const props = defineProps(['balances', 'delegations', 'rewards', 'unbonding', 'unbondingTotal'])

type Asset = {
  amount: number,
  denom: string,
  amountDisplay: string,
  id: string
}

const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

const format = useFormatter();
const supportedAssets = ref(true);
const stakingStore = useStakingStore();

const balancesAssets = ref([] as Array<Asset>);
const delegatesAssets = ref([] as Array<Asset>);
const rewardsTotalAssets = ref([] as Array<Asset>);
const unbondingAssets = ref([] as Array<Asset>);
const totalValue = ref();
const totalAmountByCategory = ref();

const priceBySymbol = ref({} as any);

const labels = ['Balance', 'Delegation', 'Reward', 'Unbonding'];

function changeStatusSupported(supported: boolean) {
  supportedAssets.value = supported
}

watchEffect(() => {
  function getInfoBalancesAssets() {
    const resultSupported: Array<any> = [];
    const resultUnSupported: Array<any> = [];
    for (let balance of props.balances) {
      const formatToken = format.formatToken3(balance);
      const denom = formatToken.denom;
      const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
      if (coingeckoSymbols.includes(denom)) {
        resultSupported.push({ ...formatToken, id })
      } else {
        resultUnSupported.push({ ...formatToken, id })
      }
    }
    balancesAssets.value = supportedAssets.value ? resultSupported : resultUnSupported;
  }
  getInfoBalancesAssets()
})

watchEffect(() => {
  function getDelegationsAssets() {
    const resultSupported: Array<any> = [];
    const resultUnSupported: Array<any> = [];
    for (let delegation of props.delegations) {
      const formatToken = format.formatToken3(delegation.balance);
      const denom = formatToken.denom;
      const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
      if (coingeckoSymbols.includes(denom)) {
        resultSupported.push({ ...formatToken, id })
      } else {
        resultUnSupported.push({ ...formatToken, id })
      }
    }
    delegatesAssets.value = supportedAssets.value ? resultSupported : resultUnSupported;
  }
  getDelegationsAssets()
})

watchEffect(() => {
  function getRewardAssets() {
    const resultSupported: Array<any> = [];
    const resultUnSupported: Array<any> = [];
    if (!!props.rewards?.total) {
      for (let reward of props.rewards?.total) {
        const formatToken = format.formatToken3(reward, true, '0,0.[0]', 'local', 1e18);
        const denom = formatToken.denom;
        const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
        if (coingeckoSymbols.includes(denom)) {
          resultSupported.push({ ...formatToken, id })
        } else {
          resultUnSupported.push({ ...formatToken, id })
        }
      }
    }
    rewardsTotalAssets.value = supportedAssets.value ? resultSupported : resultUnSupported;
  }
  getRewardAssets()
})

watchEffect(() => {
  function getUnbondingAssets() {
    const resultSupported: Array<any> = [];
    const resultUnSupported: Array<any> = [];
    const formatToken = format.formatToken3(
      {
        amount: String(props.unbondingTotal),
        denom: stakingStore.params.bondDenom,
      },
      true, '0,0.[0]', 'local',
      1e18
    )
    const denom = formatToken.denom;
    const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
    if (coingeckoSymbols.includes(denom)) {
      resultSupported.push({ ...formatToken, id })
    } else {
      resultUnSupported.push({ ...formatToken, id })
    }
    unbondingAssets.value = supportedAssets.value ? resultSupported : resultUnSupported;
  }
  getUnbondingAssets()
})

watch([balancesAssets, delegatesAssets, rewardsTotalAssets, unbondingAssets], async () => {
  const assets = [...balancesAssets.value, ...delegatesAssets.value, ...rewardsTotalAssets.value, ...unbondingAssets.value]
  const ids = assets.map(item => item?.id)

  const result: any = {}
  if (ids.length > 0) {
    const res = await getPriceByIds({ ids: ids.join(",") });
    for (let item in res) {
      result[coingeckoSymbols[coingeckoIds.indexOf(item)]] = res[item]?.usd
    }
    priceBySymbol.value = result;

    let total = 0;
    for (let item of assets) {
      total += item.amount * result[item.denom];
    }
    totalValue.value = total;
  }

  let sumBalance = 0;
  let sumDelegate = 0;
  let sumReward = 0;
  let sumUnbonding = 0;

  for (let item of balancesAssets.value) {
    const price = result[item.denom] ? result[item.denom] : 1;
    sumBalance += item.amount * price;
  }

  for (let item of delegatesAssets.value) {
    const price = result[item.denom] ? result[item.denom] : 1;
    sumDelegate += item.amount * price;
  }

  for (let item of rewardsTotalAssets.value) {
    const price = result[item.denom] ? result[item.denom] : 1;
    sumReward += item.amount * price;
  }

  for (let item of unbondingAssets.value) {
    const price = result[item.denom] ? result[item.denom] : 1;
    sumUnbonding += item.amount * price;
  }

  totalAmountByCategory.value = [sumBalance, sumDelegate, sumReward, sumUnbonding]
})

function formatValue(amount: number, fmt = '0,0.[0]') {
  const result = `${numeral(amount).format(fmt)}`;
  return result === "NaN" ? 0 : result
}

</script>

<template>
  <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
    <div class="flex text-white justify-between">
      <h2 class="card-title mb-4">{{ $t('account.assets') }}</h2>
      <div class="flex gap-2 mb-4">
        <button :class="{ 'px-2 py-1 bg-base rounded-md': supportedAssets }" @click="changeStatusSupported(true)">
          Supported Assets
        </button>
        <button :class="{ 'px-2 py-1 bg-base rounded-md': !supportedAssets }" @click="changeStatusSupported(false)">
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
        <div class="">
          <!--balances  -->
          <div class="flex items-center px-4 mb-2" v-for="(balanceItem, index) in balancesAssets" :key="index">
            <div class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4">
              <Icon icon="mdi-account-cash" class="text-info" size="20" />
              <div class="absolute top-0 bottom-0 left-0 right-0 bg-info opacity-20"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">
                {{ balanceItem?.amountDisplay }} {{ balanceItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-xs">
                {{ formatValue((priceBySymbol[balanceItem?.denom] * balanceItem?.amount) / totalValue * 100) }}%
              </div>
            </div>
            <div class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2">
              ${{ formatValue(priceBySymbol[balanceItem?.denom] * balanceItem?.amount) }}
            </div>
          </div>
          <!--delegations  -->
          <div class="flex items-center px-4 mb-2" v-for="(delegationItem, index) in delegatesAssets" :key="index">
            <div class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4">
              <Icon icon="mdi-user-clock" class="text-warning" size="20" />
              <div class="absolute top-0 bottom-0 left-0 right-0 bg-warning opacity-20"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">
                {{ delegationItem?.amountDisplay }} {{ delegationItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-xs">
                {{ formatValue((priceBySymbol[delegationItem?.denom] * delegationItem?.amount) / totalValue * 100) }}%
              </div>
            </div>
            <div class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2">
              ${{ formatValue(priceBySymbol[delegationItem?.denom] * delegationItem?.amount) }}
            </div>
          </div>
          <!-- rewards.total -->
          <div class="flex items-center px-4 mb-2" v-for="(rewardItem, index) in rewardsTotalAssets" :key="index">
            <div class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4">
              <Icon icon="mdi-account-arrow-up" class="text-success" size="20" />
              <div class="absolute top-0 bottom-0 left-0 right-0 bg-success opacity-20"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">
                {{ rewardItem?.amountDisplay }} {{ rewardItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-xs">
                {{ formatValue((priceBySymbol[rewardItem?.denom] * rewardItem?.amount) / totalValue * 100) }}%
              </div>
            </div>
            <div class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2">
              ${{ formatValue(priceBySymbol[rewardItem?.denom] * rewardItem?.amount) }}
            </div>
          </div>
          <!-- mdi-account-arrow-right -->
          <div class="flex items-center px-4" v-if="unbondingAssets.length > 0">
            <div class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4">
              <Icon icon="mdi-account-arrow-right" class="text-error" size="20" />
              <div class="absolute top-0 bottom-0 left-0 right-0 bg-error opacity-20"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">
                {{ unbondingAssets[0]?.amount }} {{ unbondingAssets[0]?.denom?.toUpperCase() }}
              </div>
              <div class="text-xs">
                {{ formatValue((priceBySymbol[unbondingAssets[0]?.denom] * unbondingAssets[0]?.amount) / totalValue *
                  100) }}%
              </div>
            </div>
            <div class="text-xs truncate relative py-1 px-3 rounded-full w-fit text-primary dark:text-link mr-2">
              ${{ formatValue(priceBySymbol[unbondingAssets[0]?.denom] * unbondingAssets[0]?.amount) }}
            </div>
          </div>
        </div>
        <div class="mt-4 text-lg font-semibold mr-5 pl-5 border-t border-base-300 pt-4 text-right">
          {{ $t('account.total_value') }}: ${{
            totalValue ? formatValue(totalValue) : 0
          }}
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
<script lang="ts" setup>
import { useFormatter, useStakingStore } from '@/stores';
import { computed, onMounted, ref, watch } from 'vue';
import DonutChart from '../charts/DonutChart.vue';
import { Icon } from '@iconify/vue';
import { LIST_COIN } from '@/constants';
import { getCw20Balances, getListAsset, getPriceByIds } from '@/service/assetsService';
import numeral from 'numeral';
import { shortenDenom } from '@/utils';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps(['balances', 'delegations', 'rewards', 'unbondingTotal', 'address', 'chain']);

const coingeckoSymbols = Object.values(LIST_COIN);
const coingeckoIds = Object.keys(LIST_COIN);

const route = useRoute();
const router = useRouter();
const format = useFormatter();
const supportedAssets = computed(() => {
  const supported = route.query.supported === 'false' ? false : true;
  return supported;
});
const stakingStore = useStakingStore();

const totalValue = ref(0);
const totalAmountByCategory = ref([] as Array<any>);
const balancesChain = ref([] as Array<any>);

const priceBySymbol = ref({} as any);

const labels = ['Balance', 'Delegation', 'Reward', 'Unbonding'];

function changeStatusSupported(supported: boolean) {
  router.push({ path: `/${props.chain}/account/${props.address}`, query: { ...route.query, supported: supported.toString() } });
}

async function fetchBalancesCw20() {
  const assets = await getListAsset(props.chain);

  if (Array.isArray(assets)) {
    const assetCw20s = assets.filter((item: any) => item?.type_asset === "cw20");
    if (!assetCw20s) return;
    const denoms = [];
    for (const asset of assetCw20s) {
      if (!!asset) denoms.push(asset.address);
    }

    const multiplyContract = await getCw20Balances(props.address, denoms);
    if (!!multiplyContract && multiplyContract.data) {
      const returnData = multiplyContract.data.return_data;
      if (!!returnData) {
        const returnDataBalance = returnData.map((rs: any) => JSON.parse(atob(rs.data)).balance);
        const balances = returnDataBalance?.map((item: string, index: number) => ({
          denom: assetCw20s[index].denom_units[1].denom,
          amount: (Number(item) / 1e6).toString()
        })).filter((balance: any) => balance?.amount != '0');
        if (!balances) return;
        balancesChain.value = balances;
      }
    }
  }
}

onMounted(async () => {
  fetchBalancesCw20()
})

watch([() => props.address], () => {
  fetchBalancesCw20()
})

const balancesAssets = computed(() => {
  const balances = [...props.balances, ...balancesChain.value];
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  for (const balance of balances) {
    const formatToken = format.formatToken3(balance);
    const denom = formatToken.denom;
    const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
    if (coingeckoSymbols.includes(denom)) {
      resultSupported.push({ ...formatToken, id })
    } else {
      resultUnSupported.push({ ...formatToken, id })
    }
  }
  return supportedAssets.value ? resultSupported : resultUnSupported;
})

const delegatesAssets = computed(() => {
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
  return supportedAssets.value ? resultSupported : resultUnSupported;
})

const rewardsTotalAssets = computed(() => {
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
  return supportedAssets.value ? resultSupported : resultUnSupported;
})

const unbondingAssets = computed(() => {
  const resultSupported: Array<any> = [];
  const resultUnSupported: Array<any> = [];
  // const formatToken = format.formatToken3(
  //   {
  //     amount: String(props.unbondingTotal),
  //     denom: stakingStore.params.bondDenom,
  //   },
  //   true, '0,0.[0]', 'local',
  //   1e18
  // );
  const totalUnbonding = Number(props.unbondingTotal);
  if (!!totalUnbonding) {
    const formatToken = {
      amount: totalUnbonding / 1e6,
      denom: stakingStore.params.bondDenom,
      amountDisplay: String(totalUnbonding / 1e6)
    }
    const denom = formatToken.denom;
    const id = coingeckoIds[coingeckoSymbols.indexOf(denom)];
    if (coingeckoSymbols.includes(denom)) {
      resultSupported.push({ ...formatToken, id })
    } else {
      resultUnSupported.push({ ...formatToken, id })
    }
  }
  
  return supportedAssets.value ? resultSupported : resultUnSupported;
})

const assets = computed(()=>{
  return [...balancesAssets.value, ...delegatesAssets.value, ...rewardsTotalAssets.value, ...unbondingAssets.value];
})

watch([() => assets.value.length, supportedAssets, balancesChain], async () => {
  const ids = assets.value.map(item => item?.id);
  const result: any = {};
  if (ids?.length > 0) {
    const res = await getPriceByIds({ ids: ids.join(",") });
    for (let item in res) {
      if (coingeckoIds.indexOf(item) > -1) result[coingeckoSymbols[coingeckoIds.indexOf(item)] as string] = res[item]?.usd;
    }
    priceBySymbol.value = result;

    let total = 0;
    for (let item of assets.value) {
      if (result[item.denom])
        total += item.amount * result[item.denom];
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

  totalAmountByCategory.value = [sumBalance, sumDelegate, sumReward, sumUnbonding];
}, { flush: 'post' })

function formatValue(amount: number, fmt = '0,0.[0]') {
  const result = `${numeral(amount).format(fmt)}`;
  return result === "NaN" ? 0 : result
}

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
  <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
    <div class="flex xl:flex-row flex-col justify-between">
      <h2 class="card-title mb-4 text-white">{{ $t('account.assets') }}</h2>
      <div class="flex gap-2 mb-4 w-full xl:w-[300px]">
        <button class="w-1/2 xl:text-sm text-xs py-2" :class="{ 'bg-base rounded-md text-white': supportedAssets }" @click="changeStatusSupported(true)">
          Supported Assets
        </button>
        <button class="w-1/2 xl:text-sm text-xs py-2" :class="{ 'bg-base rounded-md text-white': !supportedAssets }" @click="changeStatusSupported(false)">
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
              <div class="xl:text-sm text-xs font-semibold" v-if="supportedAssets">
                {{ balanceItem?.amountDisplay }} {{ balanceItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-sm font-semibold flex gap-1 flex-col xl:flex-row" v-else>
                {{ balanceItem?.amountDisplay }} 
                <div class="flex gap-1 items-center hover:cursor-pointer" @click="copyWebsite(balanceItem?.denom?.toUpperCase() || '')" >
                  <span class="xl:text-sm text-xs font-semibold">{{ shortenDenom(balanceItem?.denom?.toUpperCase()) }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3" />
                </div>
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
              <div class="xl:text-sm text-xs font-semibold" v-if="supportedAssets">
                {{ delegationItem?.amountDisplay }} {{ delegationItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-sm font-semibold flex gap-1 flex-col xl:flex-row" v-else>
                {{ delegationItem?.amountDisplay }} 
                <div class="flex gap-1 items-center hover:cursor-pointer" @click="copyWebsite(delegationItem?.denom?.toUpperCase() || '')" >
                  <span class="xl:text-sm text-xs font-semibold">{{ shortenDenom(delegationItem?.denom?.toUpperCase()) }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3"/>
                </div>
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
              <div class="xl:text-sm text-xs font-semibold" v-if="supportedAssets">
                {{ rewardItem?.amountDisplay }} {{ rewardItem?.denom?.toUpperCase() }}
              </div>
              <div class="text-sm font-semibold flex gap-1 flex-col xl:flex-row" v-else>
                {{ rewardItem?.amountDisplay }} 
                <div class="flex gap-1 items-center hover:cursor-pointer" @click="copyWebsite(rewardItem?.denom?.toUpperCase() || '')" >
                  <span class="xl:text-sm text-xs font-semibold">{{ shortenDenom(rewardItem?.denom?.toUpperCase()) }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3"/>
                </div>
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
          <div class="flex items-center px-4" v-if="unbondingAssets?.length > 0">
            <div class="w-9 h-9 rounded overflow-hidden flex items-center justify-center relative mr-4">
              <Icon icon="mdi-account-arrow-right" class="text-error" size="20" />
              <div class="absolute top-0 bottom-0 left-0 right-0 bg-error opacity-20"></div>
            </div>
            <div class="flex-1">
              <div class="xl:text-sm text-xs font-semibold" v-if="supportedAssets">
                {{ unbondingAssets[0]?.amount }} {{ unbondingAssets[0]?.denom?.toUpperCase() }}
              </div>
              <div class="text-sm font-semibold flex gap-1 flex-col xl:flex-row" v-else>
                {{ unbondingAssets[0]?.amountDisplay }} 
                <div class="flex gap-1 items-center hover:cursor-pointer" @click="copyWebsite(unbondingAssets[0]?.denom?.toUpperCase() || '')" >
                  <span class="xl:text-sm text-xs font-semibold">{{ shortenDenom(unbondingAssets[0]?.denom?.toUpperCase()) }}</span>
                  <Icon icon="mdi:content-copy" class="cursor-pointer w-3"/>
                </div>
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

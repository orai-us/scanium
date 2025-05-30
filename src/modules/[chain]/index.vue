<script lang="ts" setup>
import MdEditor from 'md-editor-v3';
import PriceMarketChart from '@/components/charts/PriceMarketChart.vue';

import { Icon } from '@iconify/vue';
import {
  useBlockchain,
  useFormatter,
  useTxDialog,
  useWalletStore,
  useStakingStore,
  useParamStore,
} from '@/stores';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useIndexModule, colorMap } from './indexStore';

import CardStatisticsVertical from '@/components/CardStatisticsVertical.vue';
import CopyAddress from '@/layouts/components/CopyAddress.vue';
import ProposalListItem from '@/components/ProposalListItem.vue';
import ArrayObjectElement from '@/components/dynamic/ArrayObjectElement.vue';
import BlockSocket from '@/components/blocks/BlockSocket.vue';
import sendImg from '../../assets/images/svg/send.svg';
import delegateImg from '../../assets/images/svg/delegate.svg';
import { NETWORK_TYPE } from '@/config';
import { useBaseStoreOrai } from '@/stores/useBaseStoreOrai';
import { useI18n } from 'vue-i18n';
import { useLangStore } from '@/stores/useLangStore';
const props = defineProps(['chain']);
const blockchain = useBlockchain();
const store = useIndexModule();
const walletStore = useWalletStore();
const format = useFormatter();
const dialog = useTxDialog();
const stakingStore = useStakingStore();
const paramStore = useParamStore();
const baseStoreOrai = useBaseStoreOrai();
const descriptionOraichainVI = "Oraichain là nền tảng blockchain Layer 1 đầu tiên được thiết kế chuyên biệt cho Trí tuệ nhân tạo (AI), kết hợp công nghệ oracle để tích hợp AI vào hợp đồng thông minh một cách đáng tin cậy. Với khả năng tối ưu về tốc độ, khả năng tương tác và bảo mật, Oraichain cung cấp cơ sở hạ tầng lý tưởng để phát triển các ứng dụng AI phi tập trung (AI dApps). Hệ sinh thái sản phẩm nổi bật bao gồm Thesis.io, Distilled AI, LFG!!!, OWallet, OraiDEX và nhiều công cụ hỗ trợ Web3 khác, góp phần thúc đẩy việc ứng dụng AI một cách thực tiễn và đáng tin cậy trong thế giới Web3.";

const coinInfo = computed(() => {
  const isOraichain = props.chain.toLowerCase() === 'oraichain'
  return {
    ...store.coinInfo,
    description: {
      ...store.coinInfo.description,
     vi: isOraichain ? descriptionOraichainVI : store.coinInfo?.description?.en
    }
  }
})

onMounted(() => {
  store.loadDashboard();
  walletStore.loadMyAsset();
  paramStore.handleAbciInfo();
  if (props.chain.toLowerCase() === 'oraichain') {
    baseStoreOrai.initial()
  }
  // if(!(coinInfo.value && coinInfo.value.name)) {
  // }
});
const ticker = computed(() => store.coinInfo.tickers[store.tickerIndex]);
const langStore = useLangStore();
let lang = ref(langStore.lang as 'en' | 'vi' | 'id' | 'cn');
watch(langStore, (newLang) => {
  lang.value = newLang.lang as 'en' | 'vi' | 'id' | 'cn';
});

const currName = ref('');
blockchain.$subscribe((m, s) => {
  if (s.chainName !== currName.value) {
    currName.value = s.chainName;
    store.loadDashboard();
    walletStore.loadMyAsset();
    paramStore.handleAbciInfo();
  }
});
function shortName(name: string, id: string) {
  return name.toLowerCase().startsWith('ibc/') ||
    name.toLowerCase().startsWith('0x')
    ? id
    : name;
}

const comLinks = [
  {
    name: 'Website',
    icon: 'mdi-web',
    href: store.homepage,
  },
  {
    name: 'Twitter',
    icon: 'mdi-twitter',
    href: store.twitter,
  },
  {
    name: 'Telegram',
    icon: 'mdi-telegram',
    href: store.telegram,
  },
  {
    name: 'Github',
    icon: 'mdi-github',
    href: store.github,
  },
];

// wallet box
const change = computed(() => {
  const token = walletStore.balanceOfStakingToken;
  return token ? format.priceChanges(token.denom) : 0;
});
const color = computed(() => {
  switch (true) {
    // case change.value > 0:
    //   return 'text-green-600';
    // case change.value === 0:
    //   return 'text-grey-500';
    // case change.value < 0:
    //   return 'text-red-600';
    default:
      return 'text-[#83838A]';
  }
});

function updateState() {
  walletStore.loadMyAsset();
}

function trustColor(v: string) {
  return `text-${colorMap(v)}`;
}

const quantity = ref(100);
const qty = computed({
  get: () => {
    return parseFloat(quantity.value.toFixed(6));
  },
  set: (val) => {
    quantity.value = val;
  },
});
const amount = computed({
  get: () => {
    return quantity.value * ticker.value.converted_last.usd || 0;
  },
  set: (val) => {
    quantity.value = val / ticker.value.converted_last.usd || 0;
  },
});
</script>

<template>
  <div>
    <div v-if="coinInfo && coinInfo.name" class="rounded shadow border-b border-base-300">
      <div class="grid grid-cols-2 md:grid-cols-3 p-4">
        <div class="col-span-2 md:col-span-1">
          <div class="text-xl font-semibold text-main">
            {{ coinInfo.name }} (<span class="uppercase">{{
              coinInfo.symbol
              }}</span>)
          </div>
          <div class="flex flex-wrap items-center">
            <div class="text-xs my-2">
              {{ $t('index.rank') }}:
              <div class="badge text-xs rounded bg-[#fcebea] dark:bg-[#CBAEFF] text-base font-semibold h-[22px]">
                #{{ coinInfo.market_cap_rank }}
              </div>
            </div>

            <div class="my-2 flex flex-wrap items-center">
              <a v-for="(item, index) of comLinks" :key="index" :href="item.href"
                class="link link-primary px-2 py-1 rounded-sm no-underline hover:bg-gray-100 dark:hover:bg-base-300 flex items-center text-white hover:text-white">
                <Icon :icon="item?.icon" />
                <span class="ml-1 text-sm capitalize text-[14px] font-normal">{{
                  item?.name
                  }}</span>
              </a>
            </div>
          </div>

          <div>
            <div class="dropdown dropdown-hover w-full">
              <label>
                <div
                  class="bg-gray-100 dark:bg-base flex flex-col items-center justify-between px-4 py-2 cursor-pointer rounded-lg border border-base-300">
                  <div class="flex justify-between gap-2 text-[#B4B7BB] font-normal text-[14px] w-full">
                    <span> {{ $t('index.select_exchange') }} </span>
                    <span>
                      {{ shortName(ticker?.base, ticker?.coin_id) }}{{ ' ' }}
                      {{ $t('index.price') }}
                    </span>
                  </div>
                  <div class="w-full flex items-center justify-between mt-1">
                    <div>
                      <div class="font-semibold text-xl text-[#666] dark:text-white flex items-center gap-1">
                        {{ ticker?.market?.name || '' }}
                        <Icon icon="mdi:chevron-down" width="20" height="20" />
                      </div>
                      <div class="text-link text-sm">
                        {{ shortName(ticker?.base, ticker?.coin_id) }}/{{
                        shortName(ticker?.target, ticker?.target_coin_id)
                        }}
                      </div>
                    </div>

                    <div class="text-right">
                      <div class="text-xl font-semibold text-[#666] dark:text-white">
                        ${{ ticker?.converted_last?.usd }}
                      </div>
                      <div class="text-sm" :class="store.priceColor">
                        {{ store.priceChange }}%
                      </div>
                    </div>
                  </div>
                </div>
              </label>
              <div class="dropdown-content pt-1 z-20 max-w-320px">
                <div class="h-64 overflow-auto w-full shadow rounded">
                  <ul class="menu w-full bg-gray-100 rounded dark:bg-base-200 max-w-320px">
                    <li v-for="(item, index) in store.coinInfo.tickers" :key="index" @click="store.selectTicker(index)">
                      <div class="flex items-center justify-between hover:bg-base-300 max-w-320px">
                        <div class="flex-1">
                          <div class="text-main text-sm text-link">
                            <!-- :class="trustColor(item.trust_score)" -->
                            {{ item?.market?.name }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ shortName(item?.base, item?.coin_id) }}/{{
                            shortName(item?.target, item?.target_coin_id)
                            }}
                          </div>
                        </div>
                        primary
                        <div class="text-base text-main">
                          ${{ item?.converted_last?.usd }}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="flex">
              <a class="my-5 !text-white btn grow bg-primary border-0 hover:brightness-150 hover:bg-primary" :class="{
                  // 'bg-primary border-0 filter hover:brightness-150 ':
                  //   store.trustColor === 'green',
                  // '!btn-warning': store.trustColor === 'yellow',
                }" :href="ticker.trade_url" target="_blank">
                {{ $t('index.buy') }} {{ coinInfo.symbol || '' }}
              </a>
              <label class="btn !px-1 my-5 ml-2 rounded-lg border border-base-300 bg-base h-[44px] w-[44px]"
                for="calculator">
                <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                    <line x1="8" x2="16" y1="6" y2="6"></line>
                    <line x1="16" x2="16" y1="14" y2="18"></line>
                    <path d="M16 10h.01"></path>
                    <path d="M12 10h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M8 14h.01"></path>
                    <path d="M12 18h.01"></path>
                    <path d="M8 18h.01"></path>
                  </g>
                </svg>
              </label>
              <!-- Put this part before </body> tag -->
              <input type="checkbox" id="calculator" class="modal-toggle" />
              <div class="modal">
                <div class="modal-box">
                  <h3 class="text-lg font-bold">
                    {{ $t('index.price_calculator') }}
                  </h3>
                  <div class="flex flex-col w-full mt-5">
                    <div class="grid h-20 flex-grow card rounded-box place-items-center">
                      <div class="join w-full">
                        <label class="join-item btn">
                          <span class="uppercase">{{ coinInfo.symbol }}</span>
                        </label>
                        <input type="number" v-model="qty" min="0" placeholder="Input a number"
                          class="input grow input-bordered join-item" />
                      </div>
                    </div>
                    <div class="divider">=</div>
                    <div class="grid h-20 flex-grow card rounded-box place-items-center">
                      <div class="join w-full">
                        <label class="join-item btn">
                          <span>USD</span>
                        </label>
                        <input type="number" v-model="amount" min="0" placeholder="Input amount"
                          class="join-item grow input input-bordered" />
                      </div>
                    </div>
                  </div>
                </div>
                <label class="modal-backdrop" for="calculator">{{
                  $t('index.close')
                  }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-2">
          <PriceMarketChart />
        </div>
      </div>
      <!-- <div class="h-[1px] w-full bg-gray-100 dark:bg-[#384059]"></div> -->
    </div>

    <div class="grid grid-cols-1 gap-4 lg:!grid-cols-2">
      <div>
        <div class="px-6 py-4 text-lg font-semibold text-main">
          {{ $t('index.about') }} {{ coinInfo.name }}
        </div>
        <div class="mx-4 flex flex-wrap items-center">
          <div v-for="tag in coinInfo.categories"
            class="mr-2 mb-2 text-xs bg-gray-100 dark:bg-[rgba(180,183,187,0.10)] px-3 rounded py-1">
            {{ tag }}
          </div>
        </div>
        <div class="max-h-[250px] overflow-auto p-4 text-sm mb-4">
          <MdEditor :model-value="coinInfo?.description?.[lang]" previewOnly></MdEditor>
        </div>
        <div v-if="!coinInfo?.description?.[lang] && coinInfo?.categories?.length === 0" class="text-center">
          {{ $t('index.no_information') }}
        </div>
      </div>
      <div class="border-none lg:border-solid lg:border-l border-base-300">
        <div class="px-6 py-4 text-lg font-semibold text-main">
          {{ $t('index.metric') }}
        </div>
        <div class="grid grid-cols-1 gap-4 md:!grid-cols-3 p-6 pt-0 items-stretch">
          <div v-if="props.chain.toLowerCase() !== 'oraichain'" v-for="(item, key) in store.stats" :key="key" class="border border-[#383B40] rounded-lg p-4">
            <CardStatisticsVertical v-bind="item" />
          </div>
          <div v-if="props.chain.toLowerCase() === 'oraichain'" v-for="(item, key) in store.statsOraichain" :key="key" class="border border-[#383B40] rounded-lg p-4">
            <CardStatisticsVertical v-bind="item" />
          </div>
        </div>
      </div>
    </div>
    <BlockSocket v-if="props.chain.toLowerCase() === 'oraichain' && NETWORK_TYPE === 0" />
    <div v-if="blockchain.supportModule('governance')" class="border-t border-base-300">
      <div class="px-4 pt-4 pb-2 text-lg font-semibold text-main">
        {{ $t('index.active_proposals') }}
      </div>
      <div class="px-4 pb-4">
        <ProposalListItem :proposals="store?.proposals" />
      </div>
      <div class="pb-8 text-center" v-if="store.proposals?.proposals?.length === 0">
        {{ $t('index.no_active_proposals') }}
      </div>
    </div>

    <div class="rounded mt-4 border-t border-base-300">
      <div class="flex flex-wrap justify-between items-center px-4 pt-4 pb-2 text-lg font-semibold text-main">
        <div class="flex-1">
          <p class="text-[18px] text-[#f7f7f7] font-semibold">{{ $t('wallet.my_wallet') }}</p>

          <div class="flex gap-2 items-center">
            <p class="truncate max-w-[calc(100%-10px)] sm:w-[unset] text-link text-[14px] font-normal">
              {{ walletStore.currentAddress || $t('wallet.wallet_not_connect') }}
            </p>
            <CopyAddress v-if="walletStore.currentAddress" :fillSvg="'#B999F3'" />
          </div>
        </div>
        <RouterLink v-if="walletStore.currentAddress"
          class="float-right inline-flex text-sm cursor-pointer link link-primary no-underline font-medium text-link"
          :to="`/${chain}/account/${walletStore.currentAddress}`">
          {{ $t('index.more') }}
          <Icon icon="mdi:arrow-right" width="20" height="20" />
        </RouterLink>
      </div>
      <div class="grid grid-cols-1 md:!grid-cols-3 auto-cols-auto gap-4 px-4 pb-6">
        <div class="boxWithBg rounded-lg px-4 py-3 border border-base-300">
          <div class="text-sm mb-1">{{ $t('account.balance') }}</div>
          <div class="text-lg font-semibold text-main">
            {{ format.formatToken(walletStore.balanceOfStakingToken) }}
          </div>
          <div class="text-sm" :class="color">
            ${{ format.tokenValue(walletStore.balanceOfStakingToken) }}
          </div>

          <div>
            <label for="PingTokenConvert" class="btn btn-third mr-4">
              <Icon icon="mdi:swap-vertical" width="20" height="20" />
              {{ $t('index.btn_swap') }}
            </label>
            <label for="send" class="btn btn-third" @click="dialog.open('send', {}, updateState)">
              <img :src="sendImg" alt="sendIcon" width="20" height="20" />
              {{ $t('account.btn_send') }}
            </label>
          </div>
        </div>
        <div class="boxWithBg boxRewardWithImg rounded-lg px-4 py-3 border border-base-300">
          <div class="text-sm mb-1">{{ $t('index.reward') }}</div>
          <div class="text-lg font-semibold text-main">
            {{ format.formatToken(walletStore.rewardAmount, true, '0,0.[0000000]', "local", 1e18) }}
          </div>
          <div class="text-sm" :class="color">
            ${{ format.tokenValue(walletStore.rewardAmount, 1e18) }}
          </div>

          <label for="delegate" class="btn btn-third" @click="dialog.open('delegate', {}, updateState)">
            <img :src="delegateImg" alt="delegate" width="20" height="20" />
            {{ $t('account.btn_delegate') }}</label>
        </div>
        <div>
          <div
            class="bg-gray-100 dark:bg-transparent rounded-lg px-4 py-3 border border-base-300 flex flex-col justify-center items-center">
            <div class="text-sm mb-1">{{ $t('module.staking') }}</div>
            <div class="text-lg font-semibold text-main">
              {{ format.formatToken(walletStore.stakingAmount) }}
            </div>
            <div class="text-sm" :class="color">
              ${{ format.tokenValue(walletStore.stakingAmount) }}
            </div>
          </div>
          <div
            class="bg-gray-100 dark:bg-transparent rounded-lg px-4 py-3 mt-4 border border-base-300 flex flex-col justify-center items-center">
            <div class="text-sm mb-1">{{ $t('index.unbonding') }}</div>
            <div class="text-lg font-semibold text-main">
              {{ format.formatToken(walletStore.unbondingAmount) }}
            </div>
            <div class="text-sm" :class="color">
              ${{ format.tokenValue(walletStore.unbondingAmount) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="walletStore.delegations?.length > 0" class="px-4 pb-4 overflow-auto">
        <table class="table table-compact w-full table-zebra">
          <thead>
            <tr>
              <th>{{ $t('account.validator') }}</th>
              <th>{{ $t('account.delegations') }}</th>
              <th>{{ $t('account.rewards') }}</th>
              <th>{{ $t('staking.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in walletStore.delegations" :key="index">
              <td>
                <RouterLink class="link link-primary no-underline text-link hover:brightness-150 hover:text-link"
                  :to="`/${chain}/staking/${item?.delegation?.validatorAddress}`">
                  {{
                  format.validatorFromBech32(
                  item?.delegation?.validatorAddress
                  )
                  }}
                </RouterLink>
              </td>
              <td>{{ format.formatToken(item?.balance) }}</td>
              <td>
                {{
                format.formatTokens(
                walletStore?.rewards?.rewards?.find(
                (el) =>
                el?.validatorAddress ===
                item?.delegation?.validatorAddress
                )?.reward, true, '0,0.[0000000]', "local", 1e18
                )
                }}
              </td>
              <td class="!break-normal">
                <div class="flex">
                  <label for="delegate"
                    class="text-link rounded mr-3 font-semibold filter hover:brightness-150 capitalize cursor-pointer"
                    @click="
                      dialog.open(
                        'delegate',
                        { validator_address: item.delegation.validatorAddress },
                        updateState
                      )
                    ">
                    {{ $t('account.btn_delegate') }}
                  </label>
                  <label for="withdraw"
                    class="text-link rounded mr-2 font-semibold filter hover:brightness-150 capitalize cursor-pointer"
                    @click="
                      dialog.open(
                        'withdraw',
                        { validator_address: item.delegation.validatorAddress },
                        updateState
                      )
                    ">
                    {{ $t('index.btn_claim') }}
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- <div class="grid grid-cols-3 gap-4 px-4 pb-6 mt-4">
        <label for="PingTokenConvert" class="btn btn-primary text-white">
          <Icon icon='mdi:swap-vertical'/>
          {{
          $t('index.btn_swap')
        }}</label>
        <label
          for="send"
          class="btn !bg-yes !border-yes text-white"
          @click="dialog.open('send', {}, updateState)"
          >
          <Icon icon='mdi:send-variant-outline'/>
          {{ $t('account.btn_send') }}</label
        >
        <label
          for="delegate"
          class="btn !bg-info !border-info text-white"
          @click="dialog.open('delegate', {}, updateState)"
          >

          {{ $t('account.btn_delegate') }}</label
        >
        <RouterLink
          to="/wallet/receive"
          class="btn !bg-info !border-info text-white hidden"
          >{{ $t('index.receive') }}</RouterLink
        >
      </div> -->
      <Teleport to="body">
        <ping-token-convert :chain-name="blockchain?.current?.prettyName" :endpoint="blockchain?.endpoint?.address"
          :hd-path="walletStore?.connectedWallet?.hdPath"></ping-token-convert>
      </Teleport>
    </div>

    <div class="rounded mt-4 p-4 border-t border-base-300">
      <div class="pt-4 pb-2 text-lg font-semibold text-main">
        {{ $t('index.app_versions') }}
      </div>
      <!-- Application Version -->
      <ArrayObjectElement :value="paramStore.appVersion?.items" :thead="false" />
      <div class="h-4"></div>
    </div>

    <div v-if="!store.coingeckoId" class="bg-base-100 rounded mt-4">
      <div class="px-4 pt-4 pb-2 text-lg font-semibold text-main">
        {{ $t('index.node_info') }}
      </div>
      <ArrayObjectElement :value="paramStore.nodeVersion?.items" :thead="false" />
      <div class="h-4"></div>
    </div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'dashboard',
      order: 1,
    }
  }
</route>

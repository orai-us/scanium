import {
  useBankStore,
  useBaseStore,
  useBlockchain,
  useCoingecko,
  useFormatter,
  useGovStore,
} from '@/stores';
import { useBaseStoreOrai } from '@/stores/useBaseStoreOrai';
import { useDistributionStore } from '@/stores/useDistributionStore';
import { useMintStore } from '@/stores/useMintStore';
import { useStakingStore } from '@/stores/useStakingStore';
import type { Tally } from '@/types';
import { formatNumber } from '@/utils';
import type { Coin } from '@cosmjs/stargate';
import numeral from 'numeral';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';
export function colorMap(color: string) {
  switch (color) {
    case 'yellow':
      return 'warning';
    case 'green':
      return 'success';
    default:
      return 'secondary';
  }
}

export const useIndexModule = defineStore('module-index', {
  state: () => {
    return {
      days: 14,
      tickerIndex: 0,
      coinInfo: {
        name: '',
        symbol: '',
        description: {
          en: '',
          vi: '',
          id: '',
          cn: '',
        },
        categories: [] as string[],
        market_cap_rank: 0,
        links: {
          twitter_screen_name: '',
          homepage: [] as string[],
          repos_url: {
            github: [],
          },
          telegram_channel_identifier: '',
        },
        market_data: {
          price_change_percentage_24h: 0,
        },
        tickers: [] as {
          market: {
            name: string;
            identifier: string;
          };
          coin_id: string;
          target_coin_id: string;
          trust_score: string;
          trade_url: string;
          converted_last: {
            btc: number;
            eth: number;
            usd: number;
          };
          base: string;
          target: string;
        }[],
      },
      marketData: {
        market_caps: [],
        prices: [] as number[],
        total_volumes: [] as number[],
      },
      communityPool: [] as { amount: string; denom: string }[],
      tally: {} as Record<string, Tally>,
    };
  },
  getters: {
    blockchain() {
      const chain = useBlockchain();
      return chain.current;
    },
    coingecko() {
      return useCoingecko();
    },
    bankStore() {
      return useBankStore();
    },
    twitter(): string {
      if (!this.coinInfo?.links?.twitter_screen_name) return '';
      return `https://twitter.com/${this.coinInfo?.links.twitter_screen_name}`;
    },
    homepage(): string {
      if (!this.coinInfo?.links?.homepage) return '';
      const [page1, page2, page3] = this.coinInfo?.links?.homepage;
      return page1 || page2 || page3;
    },
    github(): string {
      if (!this.coinInfo?.links?.repos_url) return '';
      const [page1, page2, page3] = this.coinInfo?.links?.repos_url?.github;
      return page1 || page2 || page3;
    },
    telegram(): string {
      if (!this.coinInfo?.links?.homepage) return '';
      return `https://t.me/${this.coinInfo?.links.telegram_channel_identifier}`;
    },

    priceChange(): string {
      if (!this.coinInfo?.market_data?.price_change_percentage_24h) return '';
      const change =
        this.coinInfo?.market_data?.price_change_percentage_24h || 0;
      return numeral(change).format('+0.[00]');
    },

    priceColor(): string {
      if (!this.coinInfo?.market_data?.price_change_percentage_24h) return '';
      const change =
        this.coinInfo?.market_data?.price_change_percentage_24h || 0;
      switch (true) {
        case change > 0:
          return 'text-success';
        case change < 0:
          return 'text-error';
        default:
          return '';
      }
    },
    trustColor(): string {
      if (!this.coinInfo?.tickers) return '';
      const change = this.coinInfo?.tickers[this.tickerIndex]?.trust_score;
      return change;
    },

    pool() {
      const staking = useStakingStore();
      return staking.pool;
    },

    proposals() {
      const gov = useGovStore();
      return gov.proposals['2'];
    },

    stats() {
      const base = useBaseStore();
      const bank = useBankStore();
      const staking = useStakingStore();
      const mintStore = useMintStore();
      const formatter = useFormatter();
      const { t } = useI18n();
      return [
        {
          title: t('account.height'),
          color: 'primary',
          icon: 'mdi-pound',
          stats: String(base?.latest?.block?.header?.height || 0),
          change: 0,
        },
        {
          title: t('uptime.validators'),
          color: 'error',
          icon: 'mdi-human-queue',
          stats: String(
            base?.latest?.block?.lastCommit?.signatures.length || 0
          ),
          change: 0,
        },
        {
          title: t('module.supply'),
          color: 'success',
          icon: 'mdi-currency-usd',
          stats: formatter.formatToken(bank.supply!),
          change: 0,
        },
        {
          title: t('staking.total_bonded'),
          color: 'warning',
          icon: 'mdi-lock',
          stats: formatter.formatToken({
            // @ts-ignore
            amount: this.pool.bondedTokens,
            denom: staking.params.bondDenom,
          }),
          change: 0,
        },
        {
          title: t('staking.inflation'),
          color: 'success',
          icon: 'mdi-chart-multiple',
          stats: formatter.formatDecimalToPercent(mintStore.inflation),
          change: 0,
        },
        {
          title: t('staking.community_pool'),
          color: 'primary',
          icon: 'mdi-bank',
          stats: formatter.formatToken(
            // @ts-ignore
            this?.communityPool?.find(
              (x: Coin) => x.denom === staking.params.bondDenom
            ),
            undefined,
            undefined,
            undefined,
            1e18
          ),
          change: 0,
        },
      ];
    },


    statsOraichain() {
      const base = useBaseStoreOrai();
      const { t } = useI18n();
      return [
        {
          title: t('index.market_cap'),
          color: 'primary',
          icon: 'mdi-bank',
          stats: "$" + String(formatNumber(base.market_cap)),
        },
        {
          title: t('index.trading_volume'),
          color: 'primary',
          icon: 'mdi-swap-horizontal',
          stats: "$" + String(formatNumber(base.trading_volume))
        },
        {
          title: t('block.total_blocks'),
          color: 'primary',
          icon: 'mdi-block-helper',
          stats: String(formatNumber(base.total_blocks)),
        },
        {
          title: t('tx.total_transactions'),
          color: 'primary',
          icon: 'mdi-pound',
          stats: String(formatNumber(base.transaction_count)),
        },
        {
          title: t('uptime.number_of_validators'),
          color: 'primary',
          icon: 'mdi-human-queue',
          stats: String(base.number_of_validators),
        },
        {
          title: t('block.block_time'),
          color: 'primary',
          icon: 'mdi-clock',
          stats: String(formatNumber(base.block_time)),
        },
      ];
    },

    coingeckoId() {
      this.tickerIndex = 0;
      // @ts-ignore
      const [firstAsset] = this.blockchain?.assets || [];
      return firstAsset?.coingecko_id;
    },
  },
  actions: {
    async loadDashboard() {
      this.$reset();
      this.initCoingecko();
      useMintStore().fetchInflation();
      useDistributionStore()
        .fetchCommunityPool()
        .then((x) => {
          this.communityPool = x?.pool
            ?.filter((t) => t.denom.length < 10)
            ?.map((t) => ({
              amount: String(parseInt(t.amount)),
              denom: t.denom,
            }));
        });
      // const gov = useGovStore();
      // gov.fetchProposals('2').then((x) => {
      //   this.proposals = x;
      // });
    },
    tickerColor(color: string) {
      return colorMap(color);
    },
    initCoingecko() {
      this.tickerIndex = 0;
      const [firstAsset] = this.blockchain?.assets || [];
      if (firstAsset && firstAsset.coingecko_id) {
        this.coingecko.getCoinInfo(firstAsset.coingecko_id).then((x) => {
          this.coinInfo = x;
        });
        this.coingecko
          .getMarketChart(this.days, firstAsset.coingecko_id)
          .then((x) => {
            this.marketData = x;
          });
      }
    },
    selectTicker(i: number) {
      this.tickerIndex = i;
    },
  },
});

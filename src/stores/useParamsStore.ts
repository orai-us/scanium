import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';
import { percent, formatNumber, formatTokenAmount } from '@/libs/utils';
import { DEFAULT_SDK_VERSION } from '@/libs/client';
import { toAscii } from '@cosmjs/encoding';
export interface stakingItem {
  unbonding_time: string;
  max_validators: number;
  max_entries: number;
  historical_entries: number;
  bond_denom: string;
  min_commission_rate: string;
  min_self_delegation: string;
}

export const useParamStore = defineStore('paramstore', {
  state: () => ({
    latestTime: '',
    chain: {
      title: '',
      class: 'border-primary',
      items: [
        {
          subtitle: 'account.height',
          icon: 'BoxIcon',
          color: 'light-success',
          value: '-',
        },
        {
          subtitle: 'staking.bonded_and_supply',
          icon: 'DollarSignIcon',
          color: 'light-danger',
          value: '-',
        },
        {
          subtitle: 'staking.bonded_ratio',
          icon: 'PercentIcon',
          color: 'light-warning',
          value: '-',
        },
        {
          subtitle: 'staking.inflation',
          icon: 'TrendingUpIcon',
          color: 'light-primary',
          value: '-',
        },
      ],
    },
    mint: {
      title: 'staking.mint_parameters',
      items: [] as Array<any>,
    },
    staking: {
      title: 'staking.staking_parameters',
      items: [] as Array<any>,
    },
    distribution: {
      title: 'staking.distribution_parameters',
      items: [] as Array<any>,
    },
    slashing: {
      title: 'staking.slashing_parameters',
      items: [] as Array<any>,
    },
    gov: {
      title: 'gov.governance_parameters',
      items: [] as Array<any>,
    },
    appVersion: {
      title: 'staking.application_version',
      items: [] as Array<any>,
    },
    nodeVersion: {
      title: 'staking.node_information',
      items: [] as Array<any>,
    },
  }),
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    initial() {
      this.handleBaseBlockLatest();
      // this.handleMintParam()
      this.handleStakingParams();
      this.handleSlashingParams();
      this.handleDistributionParams();
      this.handleGovernanceParams();
      this.handleAbciInfo();
    },
    async handleBaseBlockLatest() {
      try {
        const res = await this.getBaseTendermintBlockLatest();
        const height = this.chain.items.findIndex(
          (x) => x.subtitle === 'account.height'
        );
        this.chain.title = `Chain ID: ${res.block.header.chainId}`;
        this.chain.items[height].value = res.block.header.height.toString();
        // if (timeIn(res.block.header.time, 3, 'm')) {
        //   this.syncing = true
        // } else {
        //   this.syncing = false
        // }
        // this.latestTime = toDay(res.block.header.time, 'long')
        this.latestTime = res.block.header.time.toDateString();
      } catch (error) {
        console.error(error);
      }
    },
    async handleStakingParams() {
      const res = await this.getStakingParams();
      if (!res) return;
      const bond_denom = res?.params.bondDenom;
      this.staking.items = Object.entries(res.params)
        .map(([key, value]) => ({ subtitle: `staking.${key}`, value: value }))
        .filter((item: any) => {
          if (
            !['min_commission_rate', 'min_self_delegation'].includes(
              item.subtitle
            )
          )
            return item;
        });
      Promise.all([this.getStakingPool(), this.getBankTotal(bond_denom)]).then(
        (resArr) => {
          const pool = resArr[0]?.pool;
          if (!pool) return;
          const amount = resArr[1]?.amount;
          const assets = this.blockchain.current?.assets;
          const bondedAndSupply = this.chain.items.findIndex(
            (x) => x.subtitle === 'staking.bonded_and_supply'
          );
          this.chain.items[bondedAndSupply].value = `${formatNumber(
            formatTokenAmount(assets, pool.bondedTokens, 2, bond_denom, false),
            true,
            0
          )}/${formatNumber(
            formatTokenAmount(assets, amount, 2, bond_denom, false),
            true,
            0
          )}`;
          const bondedRatio = this.chain.items.findIndex(
            (x) => x.subtitle === 'bonded_ratio'
          );
          this.chain.items[bondedRatio].value = `${percent(
            Number(pool.bondedTokens) / Number(amount)
          )}%`;
        }
      );
    },
    async handleMintParam() {
      const excludes = this.blockchain.current?.excludes;
      if (excludes && excludes.indexOf('mint') > -1) {
        return;
      }
      // this.getMintingInflation().then(res => {
      //     const chainIndex = this.chain.items.findIndex(x => x.subtitle === 'inflation')
      //     this.chain.items[chainIndex].value = `${percent(res)}%`
      // })
      // const res = await this.getMintParam();
    },
    async handleSlashingParams() {
      const res = await this.getSlashingParams();
      this.slashing.items = Object.entries(res.params).map(([key, value]) => ({
        subtitle: `staking.${key}`,
        value: value,
      }));
    },
    async handleDistributionParams() {
      const res = await this.getDistributionParams();
      // try to convert to ascii
      this.distribution.items = Object.entries(res.params).map(
        ([key, value]) => ({
          subtitle: `staking.${key}`,
          value: typeof value === 'string' ? toAscii(value) : value,
        })
      );
    },
    async handleGovernanceParams() {
      const excludes = this.blockchain.current?.excludes;
      if (excludes && excludes.indexOf('governance') > -1) {
        return;
      }
      Promise.all([
        this.getGovParamsVoting(),
        this.getGovParamsDeposit(),
        this.getGovParamsTally(),
      ]).then((resArr) => {
        const govParams = {
          ...resArr[0]?.votingParams,
          ...resArr[1]?.depositParams,
          ...resArr[2]?.tallyParams,
        };
        this.gov.items = Object.entries(govParams).map(([key, value]) => ({
          subtitle: `gov.${key}`,
          value: value,
        }));
      });
    },
    async handleAbciInfo() {
      const res = await this.fetchAbciInfo();

      if (!res) return;

      localStorage.setItem(
        `sdk_version_${this.blockchain.chainName}`,
        res.applicationVersion?.cosmosSdkVersion ?? DEFAULT_SDK_VERSION
      );

      this.appVersion.items = Object.entries(res.applicationVersion ?? {}).map(
        ([key, value]) => ({ subtitle: key, value: value })
      );

      this.nodeVersion.items = Object.entries(res.defaultNodeInfo ?? {}).map(
        ([key, value]) => ({ subtitle: key, value: value })
      );
    },
    async getBaseTendermintBlockLatest() {
      return await this.blockchain.rpc?.getBaseBlockLatest();
    },
    async getMintParam() {
      return await this.blockchain.rpc?.getMintParam();
    },
    async getStakingParams() {
      return await this.blockchain.rpc?.getStakingParams();
    },
    async getStakingPool() {
      return await this.blockchain.rpc?.getStakingPool();
    },
    async getBankTotal(denom: string) {
      return await this.blockchain.rpc?.getBankSupplyByDenom(denom);
      // if (compareVersions(this.config.sdk_version, '0.46.2') > 0) {
      //     return this.get(`/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`).then(data => commonProcess(data).amount)
      //   }
      //   if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      //     return this.get(`/supply/total/${denom}`).then(data => ({ amount: commonProcess(data), denom }))
      //   }
      //   return this.get(`/cosmos/bank/v1beta1/supply/${denom}`).then(data => commonProcess(data).amount)
    },
    async getSlashingParams() {
      return await this.blockchain.rpc?.getSlashingParams();
    },
    async getDistributionParams() {
      return await this.blockchain.rpc?.getDistributionParams();
    },
    async getGovParamsVoting() {
      return await this.blockchain.rpc?.getGovParamsVoting();
    },
    async getGovParamsDeposit() {
      return await this.blockchain.rpc?.getGovParamsDeposit();
    },
    async getGovParamsTally() {
      return await this.blockchain.rpc?.getGovParamsTally();
    },
    async fetchAbciInfo() {
      return this.blockchain.rpc?.getBaseNodeInfo();
    },
  },
});

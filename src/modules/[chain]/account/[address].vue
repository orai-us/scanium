<script lang="ts" setup>
import {
  useBlockchain,
  useFormatter,
  useStakingStore,
  useTxDialog,
  useWalletStore,
} from '@/stores';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';

import {
  PageRequest,
} from '@/types';

import type { Coin } from '@cosmjs/amino';
import type {
  DelegationResponse,
  UnbondingDelegation,
} from 'cosmjs-types/cosmos/staking/v1beta1/staking';
import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth';
import type { ExtraTxResponse } from '@/libs/client';
import type { QueryDelegationTotalRewardsResponse } from 'cosmjs-types/cosmos/distribution/v1beta1/query';
import TransactionsHistory from '@/components/account/TransactionsHistory.vue';
import Assets from "@/components/account/Assets.vue";
import TransactionAccountRpc from '@/components/account/TransactionAccountRpc.vue';

const props = defineProps(['address', 'chain']);

const walletStore = useWalletStore();
const blockchain = useBlockchain();
const stakingStore = useStakingStore();
const dialog = useTxDialog();
const format = useFormatter();
const staking = useStakingStore();
const account = ref({} as BaseAccount | undefined);
const txs = ref({} as ExtraTxResponse[]);
const delegations = ref([] as DelegationResponse[]);
const rewards = ref({} as QueryDelegationTotalRewardsResponse);
const balances = ref([] as Coin[]);
const recentReceived = ref([] as ExtraTxResponse[]);
const unbonding = ref([] as UnbondingDelegation[]);
const unbondingList = ref([] as any);
const unbondingTotal = ref(0);

const isBalancesLoaded = ref(false);
const isDelegationLoaded = ref(false);
const isRewardLoaded = ref(false);
const isUnbodingLoaded = ref(false);

onMounted(() => {
  loadAccount(props.address);
});
watchEffect(() => {
  loadAccount(props.address);
})

function loadAccount(address: string) {
  blockchain.rpc.getAuthAccount(address).then((x) => {
    account.value = BaseAccount.decode(x?.value!);
  });
  blockchain.rpc.getTxsBySender(address).then((x) => {
    txs.value = x.txs;
  });
  blockchain.rpc.getDistributionDelegatorRewards(address).then((x) => {
    rewards.value = x;
    isRewardLoaded.value = true;
  });
  blockchain.rpc.getStakingDelegations(address).then((x) => {
    delegations.value = x.delegationResponses;
    isDelegationLoaded.value = true;
  });
  blockchain.rpc.getBankBalances(address).then((x) => {
    balances.value = x;
    isBalancesLoaded.value = true;
  });
  const resultUnbondingList: any = [];
  let totalUnbond = 0;
  blockchain.rpc.getStakingDelegatorUnbonding(address).then((x) => {
    if (!!x.unbondingResponses) {
      unbonding.value = x.unbondingResponses;
      x.unbondingResponses.forEach((y) => {
        y.entries.forEach((z) => {
          totalUnbond += Number(z.balance);
        });
      });
      unbondingTotal.value = totalUnbond;

      for (const unbond of x.unbondingResponses) {
        if (!!unbond) {
          for (const entries of unbond.entries) {
            resultUnbondingList.push({
              ...entries,
              validatorAddress: unbond.validatorAddress
            })
          }
        }
      }
      unbondingList.value = resultUnbondingList
    }
    isUnbodingLoaded.value = true;
  });

  blockchain.rpc
    .getTxs(
      [
        {
          key: 'coin_received.receiver',
          value: address,
        },
      ],
      new PageRequest(5, true)
    )
    .then((x) => {
      recentReceived.value = x.txs;
    });
}

function updateEvent() {
  loadAccount(props.address);
}

// function mapAmount(events: readonly Event[]) {
//   if (!events) return [];
//   return events
//     .find((x) => x.type === 'coin_received')
//     ?.attributes.filter((x) => x.key === 'amount')
//     .map((x) => x.value);
// }

const isOwnerWallet = computed(() => {
  return walletStore.currentAddress === props.address
})

function getNameValidator(validatorAddress: string) {
  let name = ""
  const validators = staking?.validators;
  if (Array.isArray(validators)) {
    const validator = validators.filter((item: any) => item?.operatorAddress === validatorAddress)[0];
    if (!!validator) name = validator.description?.moniker
  }
  return name;
}

</script>
<template>
  <div v-if="account">
    <!-- address -->
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="flex items-center">
        <!-- img -->
        <!-- <div class="inline-flex relative w-11 h-11 rounded-md">
          <div
            class="w-11 h-11 absolute rounded-md opacity-10 bg-primary"
          ></div>
          <div
            class="w-full inline-flex items-center align-middle flex-none justify-center"
          >
            <Icon
              icon="mdi-qrcode"
              class="text-primary"
              style="width: 27px; height: 27px"
            />
          </div>
        </div> -->
        <!-- content -->
        <div class="flex flex-1 flex-col truncate pl-4">
          <h2 class="text-sm card-title">
            {{ $t('account.address') }}
          </h2>
          <span class="truncate text-lg text-white"> {{ address }}</span>
        </div>
        <!-- button -->
        <!-- <div class="flex justify-end mb-4 pr-5">
          <label for="send" class="btn btn-third-sm btn-sm mr-2" @click="dialog.open('send', {}, updateEvent)">{{
            $t('account.btn_send') }}</label>
          <label for="transfer" class="btn btn-third-sm btn-sm" @click="
              dialog.open(
                'transfer',
                {
                  chain_name: blockchain.current?.prettyName,
                },
                updateEvent
              )
            ">{{ $t('account.btn_transfer') }}</label>
        </div> -->
      </div>
    </div>

    <!-- Assets -->
    <div v-if="isBalancesLoaded && isDelegationLoaded && isRewardLoaded && isUnbodingLoaded">
      <Assets :balances="balances" :delegations="delegations" :rewards="rewards" :unbonding="unbonding"
        :unbondingTotal="unbondingTotal" :address="address" :chain="chain" />
    </div>

    <!-- Delegations -->
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="flex justify-between">
        <h2 class="card-title mb-4 text-white">
          {{ $t('account.delegations') }}
        </h2>
        <div>
          <div class="flex justify-end mb-4" v-if="walletStore.currentAddress">
            <label for="delegate" class="bg-base rounded-md text-white p-2 mr-2 xl:text-sm text-xs hover:cursor-pointer"
              :class="!isOwnerWallet && 'opacity-50 hover:cursor-default'"
              @click="() => { if (!isOwnerWallet) return; dialog.open('delegate', {}, updateEvent) }">{{
              $t('account.btn_delegate') }}</label>
            <label for="withdraw" class="bg-base rounded-md text-white p-2 xl:text-sm text-xs hover:cursor-pointer"
              :class="!isOwnerWallet && 'opacity-50 hover:cursor-default'"
              @click="() => { if (!isOwnerWallet) return; dialog.open('withdraw', {}, updateEvent) }">Claim
              Reward</label>
          </div>
          <div v-if="!walletStore.currentAddress">
            <label
              class="rounded-lg bg-[#7332E7] text-white text-[14px] font-medium cursor-pointer hover:filter hover:brightness-125 transition-all duration-500 px-3 py-[11px] md:px-6 truncate !inline-flex text-xs md:!text-sm"
              :for="!walletStore.currentAddress ? 'PingConnectWallet' : ''">Connect wallet</label>
          </div>
        </div>

      </div>
      <div class="overflow-x-auto">
        <table class="table w-full text-sm table-zebra">
          <thead>
            <tr>
              <th class="py-3">{{ $t('account.validator') }}</th>
              <th class="py-3">{{ $t('account.delegation') }}</th>
              <th class="py-3">{{ $t('account.rewards') }}</th>
              <th class="py-3">{{ $t('account.action') }}</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="delegations.length === 0">
              <td colspan="10">
                <div class="text-center">
                  {{ $t('account.no_delegations') }}
                </div>
              </td>
            </tr>
            <tr v-for="(v, index) in delegations" :key="index">
              <td class="text-caption text-link py-3 !break-normal">
                <RouterLink :to="`/${chain}/staking/${v.delegation.validatorAddress}`">{{
                  format.validatorFromBech32(v.delegation.validatorAddress) ||
                  v.delegation.validatorAddress
                  }}</RouterLink>
              </td>
              <td class="py-3 !break-normal">
                {{ format.formatToken(v.balance, true, '0,0.[000000]') }}
              </td>
              <td class="py-3 !break-normal">
                {{
                format.formatTokens(
                rewards?.rewards?.find(
                (x) =>
                x.validatorAddress === v.delegation.validatorAddress
                )?.reward,
                undefined,
                undefined,
                undefined,
                1e18
                )
                }}
              </td>
              <td class="py-3 !break-normal">
                <div>
                  <div v-if="v.balance && walletStore.currentAddress" class="flex justify-start">
                    <label for="delegate" class="text-link cursor-pointer hover:brightness-150 font-semibold mr-2"
                      :class="!isOwnerWallet && 'opacity-50 hover:cursor-default'" @click="() => {
                          if (!isOwnerWallet) return;
                          dialog.open(
                            'delegate',
                            {
                              validator_address: v.delegation.validatorAddress,
                            },
                            updateEvent
                          )
                        }
                        ">{{ $t('account.btn_delegate') }}</label>
                    <label for="redelegate" class="text-link cursor-pointer hover:brightness-150 font-semibold mr-2"
                      :class="!isOwnerWallet && 'opacity-50 hover:cursor-default'" @click="() => {
                          if (!isOwnerWallet) return;
                          dialog.open(
                            'redelegate',
                            {
                              validator_address: v.delegation.validatorAddress,
                            },
                            updateEvent
                          )
                        }
                        ">{{ $t('account.btn_redelegate') }}</label>
                    <label for="unbond" class="text-link cursor-pointer hover:brightness-150 font-semibold"
                      :class="!isOwnerWallet && 'opacity-50 hover:cursor-default'" @click="() => {
                          if (!isOwnerWallet) return;
                          dialog.open(
                            'unbond',
                            {
                              validator_address: v.delegation.validatorAddress,
                            },
                            updateEvent
                          )
                        }
                        ">{{ $t('account.btn_unbond') }}</label>
                  </div>
                  <div v-if="!walletStore.currentAddress">
                    <label :for="!walletStore.currentAddress ? 'PingConnectWallet' : ''"
                      class="rounded-lg bg-[#7332E7] text-white text-[14px] font-medium cursor-pointer hover:filter hover:brightness-125 transition-all duration-500 px-3 py-[11px] md:px-6 truncate !inline-flex text-xs md:!text-sm">Connect
                      wallet</label>
                  </div>
                </div>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Unbonding Delegations -->
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]"
      v-if="unbonding && unbonding.length > 0">
      <h2 class="card-title mb-4 text-white">
        {{ $t('account.unbonding_delegations') }}
      </h2>
      <div class="overflow-x-auto">
        <table class="table text-sm w-full">
          <thead>
            <tr>
              <th class="py-3">Validator</th>
              <th class="py-3">Amount</th>
              <th class="py-3">Unbond Completed By</th>
            </tr>
          </thead>
          <tbody class="text-sm" v-for="(v, index) in unbondingList" :key="index">
            <tr>
              <td class="text-caption py-3 text-link">
                <RouterLink :to="`/${chain}/staking/${v.validatorAddress}`">{{
                  getNameValidator(v.validatorAddress)
                }}</RouterLink>
              </td>
              <td class="text-caption py-3">
                {{
                format.formatToken(
                {
                amount: v.initialBalance,
                denom: stakingStore.params.bondDenom,
                },
                true,
                '0,0.[00]'
                )
                }}
              </td>
              <td class="text-caption py-3">
                <span v-if="!isNaN(Number(v.completionTime?.seconds))">{{ format.toLocaleDate(new
                  Date(Number(v.completionTime.seconds) * 1000)) }}</span>
                <span v-else>-</span>
              </td>
            </tr>
            <!-- <tr v-for="entry in v.entries">
              <td class="py-3">{{ entry.creationHeight }}</td>
              <td class="py-3">
                {{
                format.formatToken(
                {
                amount: entry.initialBalance,
                denom: stakingStore.params.bondDenom,
                },
                true,
                '0,0.[00]'
                )
                }}
              </td>
              <td class="py-3">
                {{
                format.formatToken(
                {
                amount: entry.balance,
                denom: stakingStore.params.bondDenom,
                },
                true,
                '0,0.[00]',
                undefined,
                1e18
                )
                }}
              </td>
              <td class="py-3">
                <Countdown :time="entry.completionTime &&
                  fromTimestamp(entry.completionTime).getTime() -
                  new Date().getTime()
                  " />
              </td>
            </tr> -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Transactions -->
    <TransactionsHistory :address="address" :chain="chain" :txs="txs" />
    <!-- Received -->
    <!-- <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <h2 class="card-title mb-4 text-white">{{ $t('account.received') }}</h2>
      <div class="overflow-x-auto">
        <table class="table w-full text-sm">
          <thead>
            <tr>
              <th class="py-3">{{ $t('account.height') }}</th>
              <th class="py-3">{{ $t('account.hash') }}</th>
              <th class="py-3">{{ $t('account.amount') }}</th>
              <th class="py-3">{{ $t('account.time') }}</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="recentReceived.length === 0">
              <td colspan="10">
                <div class="text-center">
                  {{ $t('account.no_transactions') }}
                </div>
              </td>
            </tr>
            <tr v-for="(v, index) in recentReceived" :key="index">
              <td class="text-sm py-3">
                <RouterLink :to="`/${chain}/block/${v.height}`" class="text-primary dark:text-link">{{ v.height }}
                </RouterLink>
              </td>
              <td class="truncate py-3" style="max-width: 200px">
                <RouterLink :to="`/${chain}/tx/${toHex(v.hash)}`" class="text-primary dark:text-link">
                  {{ toHex(v.hash) }}
                </RouterLink>
              </td>
              <td class="flex items-center py-3">
                <div class="mr-2">
                  {{ mapAmount(v.result.events)?.join(', ') }}
                </div>
                <Icon v-if="v.result.code === 0" icon="mdi-check" class="text-success text-lg" />
                <Icon v-else icon="mdi-multiply" class="text-error text-lg" />
              </td>
              <td class="py-3">
                <span v-if="v.timestamp" class="text-xs">({{ format.toDay(v.timestamp, 'from') }})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div> -->

    <!-- Account -->
    <!-- <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <h2 class="card-title mb-4 text-white">{{ $t('account.acc') }}</h2>
      <DynamicComponent :value="account" />
    </div> -->
  </div>
  <div v-else class="text-no text-sm">{{ $t('account.error') }}</div>
</template>

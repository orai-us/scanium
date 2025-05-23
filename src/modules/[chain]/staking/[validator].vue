<script setup lang="ts">
import { decodeProto } from '@/components/dynamic';
import PaginationBar from '@/components/PaginationBar.vue';
import CommissionRate from '@/components/ValidatorCommissionRate.vue';
import {
  consensusPubkeyToHexAddress,
  operatorAddressToAccount,
  pubKeyToValcons,
  valoperToPrefix,
  decodeKey,
} from '@/libs';
import type { ExtraTxResponse, ExtraTxSearchResponse } from '@/libs/client';
import {
  useBlockchain,
  useFormatter,
  useMintStore,
  useStakingStore,
  useTxDialog,
} from '@/stores';
import { PageRequest } from '@/types';
import { toHex } from '@cosmjs/encoding';
import type { Coin } from '@cosmjs/stargate';
import type { Event } from 'cosmjs-types/tendermint/abci/types';
import { Icon } from '@iconify/vue';
import type { QueryValidatorDelegationsResponse } from 'cosmjs-types/cosmos/staking/v1beta1/query';
import {
  bondStatusToJSON,
  type DelegationResponse,
  type Validator,
} from 'cosmjs-types/cosmos/staking/v1beta1/staking';
import { fromTimestamp } from 'cosmjs-types/helpers';
import { computed, onMounted, ref } from 'vue';
import TransactionStakingRpc from '@/components/staking/TransactionStakingRpc.vue';
import { CHAIN_INDEXS } from '@/constants';
import TransactionAccountIndexs from '@/components/account/TransactionAccountIndexs.vue';

const props = defineProps({
  validator: {
    type: String,
    required: true,
  },
  chain: {
    type: String,
  },
});

const staking = useStakingStore();
const blockchain = useBlockchain();
const format = useFormatter();
const dialog = useTxDialog();
const page = new PageRequest();

const validator: string = props.validator;

const v = ref({} as Validator);
const cache = JSON.parse(localStorage.getItem('avatars') || '{}');
const avatars = ref(cache || {});
const identity = ref('');
const rewards = ref([] as Coin[] | undefined);
const commission = ref([] as Coin[] | undefined);
const delegations = ref({} as QueryValidatorDelegationsResponse);
const addresses = ref(
  {} as {
    account: string;
    operAddress: string;
    hex: string;
    valCons: string;
  }
);
const selfBonded = ref({} as DelegationResponse | undefined);

addresses.value.account = operatorAddressToAccount(validator);
// load self bond
staking
  .fetchValidatorDelegation(validator, addresses.value.account)
  .then((x) => {
    if (x) {
      selfBonded.value = x.delegationResponse!;
    }
  });

const txs = ref({} as ExtraTxSearchResponse);

blockchain.rpc.getTxsBySender(addresses.value.account).then((x) => {
  txs.value = x;
});

const consensusPubkey = computed(() => {
  return v.value.consensusPubkey
    ? decodeKey(v.value.consensusPubkey)
    : undefined;
});

const apr = computed(() => {
  const rate = Number(v.value?.commission?.commissionRates.rate || 0) / 1e18;
  const inflation = useMintStore().inflation;
  if (Number(inflation)) {
    return format.percent((1 - Number(rate)) * Number(inflation));
  }
  return '-';
});

const selfRate = computed(() => {
  if (!selfBonded.value) return '-';

  if (selfBonded.value.balance?.amount) {
    return format.calculatePercent(
      selfBonded.value.balance.amount,
      v.value.tokens
    );
  }
  return '-';
});

const logo = (identity?: string) => {
  if (!identity) return '';
  const url = avatars.value[identity] || '';
  return url.startsWith('http')
    ? url
    : `https://s3.amazonaws.com/keybase_processed_uploads/${url}`;
};

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
        } else throw new Error(`failed to fetch avatar for ${identity}.`);
      })
      .catch((error) => {
        // console.error(error); // uncomment this if you want the user to see if the avatar failed to load.
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

onMounted(() => {
  if (validator) {
    staking.fetchValidator(validator).then((res) => {
      if (!res?.validator) return;
      v.value = res.validator;
      identity.value = res.validator?.description?.identity || '';
      if (identity.value && !avatars.value[identity.value])
        loadAvatar(identity.value);

      const prefix = valoperToPrefix(v.value.operatorAddress) || '<Invalid>';
      addresses.value.hex = consensusPubkeyToHexAddress(
        v.value.consensusPubkey
      );
      addresses.value.valCons = pubKeyToValcons(
        v.value.consensusPubkey!,
        prefix
      );
    });
    blockchain.rpc
      .getDistributionValidatorOutstandingRewards(validator)
      .then((res) => {
        if (!res) return;
        rewards.value = res.rewards?.rewards?.sort(
          (a, b) => Number(b.amount) - Number(a.amount)
        );
        res.rewards?.rewards?.forEach((x) => {
          if (x.denom.startsWith('ibc/')) {
            format.fetchDenomTrace(x.denom);
          }
        });
      });
    blockchain.rpc.getDistributionValidatorCommission(validator).then((res) => {
      if (!res) return;
      commission.value = res.commission?.commission?.sort(
        (a, b) => Number(b.amount) - Number(a.amount)
      );
      res.commission?.commission?.forEach((x) => {
        if (x.denom.startsWith('ibc/')) {
          format.fetchDenomTrace(x.denom);
        }
      });
    });

    // Disable delegations due to its bad performance
    // Comment out the following code if you want to enable it
    // pageload(1)
  }
});
let showCopyToast = ref(0);
const copyWebsite = async (url: string) => {
  if (!url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showCopyToast.value = 1;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  } catch (err) {
    showCopyToast.value = 2;
    setTimeout(() => {
      showCopyToast.value = 0;
    }, 1000);
  }
};
const tipMsg = computed(() => {
  return showCopyToast.value === 2
    ? { class: 'error', msg: 'Copy Error!' }
    : { class: 'success', msg: 'Copy Success!' };
});

function pageload(p: number) {
  page.setPage(p);
  page.limit = 10;

  blockchain.rpc
    .getStakingValidatorsDelegations(validator, page)
    .then((res) => {
      delegations.value = res;
    });
}

const events = ref({} as ExtraTxSearchResponse);

enum EventType {
  Delegate = 'delegate',
  Unbond = 'unbond',
}

const selectedEventType = ref(EventType.Delegate);

function loadPowerEvents(p: number, type: EventType) {
  selectedEventType.value = type;
  page.setPage(p);
  blockchain.rpc
    .getTxs(
      [
        {
          key: `${selectedEventType.value}.validator`,
          value: validator,
        },
      ],
      page
    )
    .then((res) => {
      res.txs.forEach((tx) => {
        tx.txRaw.body.messages = tx.txRaw.body.messages.map(decodeProto);
      });
      events.value = res;
    });
}

function pagePowerEvents(page: number) {
  loadPowerEvents(page, selectedEventType.value);
}

pagePowerEvents(1);

function mapAmounts(tx: ExtraTxResponse) {
  const amounts = tx.txRaw.body?.messages
    .map((x: any) => {
      // amount from blockchain
      if (x.grantee) {
        return x.msgs
          .filter(
            (msg: any) => msg.amount && msg.validatorAddress === validator
          )
          .reduce((a: number, msg: any) => a + Number(msg.amount.amount), 0);
      }
      if (x.contract) {
        return x.funds[0]?.amount;
      }
      // default
      return x?.amount?.amount;
    })
    .filter(Boolean);
  if (amounts.length) return amounts;
  // fallback from event
  return filterEvents(tx.result.events).map((x) =>
    x.attributes.find((a) => a.key === 'amount')?.value.replace(/[^\d]+/g, '')
  );
}

function filterEvents(events: readonly Event[]) {
  const attributes = events
    .filter((x) => x.type === selectedEventType.value)
    .filter((x) =>
      x.attributes.some((attr) => {
        return attr.value === validator;
      })
    );

  return attributes;
}

function mapDelegators(tx: ExtraTxResponse) {
  const { messages } = tx.txRaw.body;
  if (!messages) return [];

  const delegators = Array.from(
    new Set(
      messages.map((x: any) => x.delegatorAddress || x.grantee || x.contract)
    )
  ).filter(Boolean);

  if (delegators.length) return delegators;
  // fallback from event
  return filterEvents(tx.result.events)
    .map((x) => x.attributes.find((a) => a.key === 'validator')?.value)
    .filter(Boolean);
}
</script>
<template>
  <div>
    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="flex flex-col lg:!flex-row pb-1">
        <div class="flex-1">
          <div class="flex">
            <div class="avatar mr-4 relative w-24 rounded-lg overflow-hidden">
              <div class="w-24 rounded-lg absolute opacity-10"></div>
              <div class="w-24 rounded-lg">
                <img v-if="identity && avatars[identity] !== 'undefined'" v-lazy="logo(identity)" class="object-contain"
                  @error="
                    (e) => {
                      loadAvatar(identity);
                    }
                  " />
                <Icon v-else class="text-8xl" :icon="`mdi-help-circle-outline`" />
              </div>
            </div>
            <div class="mx-2">
              <h4>{{ v.description?.moniker }}</h4>
              <div class="text-sm mb-4">
                {{ v.description?.identity || '-' }}
              </div>
              <label for="delegate" class="btn btn-primary btn-sm w-full" @click="
                  dialog.open('delegate', {
                    validator_address: v.operatorAddress,
                  })
                ">{{ $t('account.btn_delegate') }}</label>
            </div>
          </div>
          <div class="m-4 ml-0 text-sm">
            <p class="text-sm mb-3 font-medium">{{ $t('staking.about_us') }}</p>
            <div class="card-list">
              <div class="flex items-center mb-2">
                <Icon icon="mdi-web" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.website') }}:
                </span>
                <a :href="v?.description?.website || '#'" :class="
                    v?.description?.website
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  ">
                  {{ v.description?.website || '-' }}
                </a>
              </div>
              <div class="flex items-center">
                <Icon icon="mdi-email-outline" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.contact') }}:
                </span>
                <a v-if="v.description?.securityContact" :href="'mailto:' + v.description.securityContact || '#'"
                  class="cursor-pointer">
                  {{ v.description?.securityContact || '-' }}
                </a>
              </div>
            </div>
            <p class="text-sm mt-4 mb-3 font-medium">
              {{ $t('staking.validator_status') }}
            </p>
            <div class="card-list">
              <div class="flex items-center mb-2">
                <Icon icon="mdi-shield-account-outline" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.status') }}: </span><span class="capitalize">
                  {{
                  bondStatusToJSON(v.status)
                  .toLowerCase()
                  .replace(/^bond_status/, '')
                  .replaceAll(/_(.)/g, ' $1')
                  .trim()
                  }}
                </span>
              </div>
              <div class="flex items-center">
                <Icon icon="mdi-shield-alert-outline" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.jailed') }}: </span>
                <span> {{ v.jailed ?? '-' }} </span>
              </div>
            </div>
            <p class="text-sm mt-4 mb-3 font-medium">
              {{ $t('staking.liquid_staking') }}
            </p>
            <div class="card-list">
              <div class="flex items-center mb-2">
                <Icon icon="mdi-lock" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.validator_bond_share') }}:
                </span>
                <span>
                  {{
                  format.formatToken(
                  {
                  amount: v.delegatorShares,
                  denom: staking.params.bondDenom,
                  },
                  true,
                  undefined,
                  undefined,
                  1e18
                  )
                  }}
                </span>
              </div>
              <div class="flex items-center">
                <Icon icon="mdi-waves-arrow-right" class="text-xl mr-1" />
                <span class="font-bold mr-2">{{ $t('staking.liquid_staking_shares') }}:
                </span>
                <span>
                  {{
                  format.formatToken(
                  {
                  amount: v.delegatorShares,
                  denom: staking.params.bondDenom,
                  },
                  true,
                  undefined,
                  undefined,
                  1e18
                  )
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex flex-col mt-10">
            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi-coin" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4>
                  {{
                  format.formatToken2({
                  amount: v.tokens,
                  denom: staking.params.bondDenom,
                  })
                  }}
                </h4>
                <span class="text-sm">{{ $t('staking.total_bonded') }}</span>
              </div>
            </div>
            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi-percent" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center" v-if="selfBonded?.balance">
                <h4>
                  {{ format.formatToken(selfBonded.balance) }} ({{ selfRate }})
                </h4>
                <span class="text-sm">{{ $t('staking.self_bonded') }}</span>
              </div>
            </div>

            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi-account-tie" class="text-3xl" />
              </div>

              <div class="ml-3 flex flex-col">
                <h4>
                  {{ v.minSelfDelegation }} {{ staking.params.bondDenom }}
                </h4>
                <span class="text-sm">{{ $t('staking.min_self') }}</span>
              </div>
            </div>
            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi-finance" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4>{{ apr }}</h4>
                <span class="text-sm">{{ $t('staking.annual_profit') }}</span>
              </div>
            </div>

            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi:arrow-down-bold-circle-outline" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4>{{ Number(v.unbondingHeight) || '-' }}</h4>
                <span class="text-sm">{{
                  $t('staking.unbonding_height')
                  }}</span>
              </div>
            </div>

            <div class="flex mb-2">
              <div class="flex items-center justify-center rounded w-10 h-10" style="border: 1px solid #666">
                <Icon icon="mdi-clock" class="text-3xl" />
              </div>
              <div class="ml-3 flex flex-col justify-center">
                <h4 v-if="
                    v.unbondingTime &&
                    fromTimestamp(v.unbondingTime).getFullYear() > 1970
                  ">
                  {{ format.toDay(v.unbondingTime, 'from') }}
                </h4>
                <h4 v-else>-</h4>
                <span class="text-sm">{{ $t('staking.unbonding_time') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-sm pt-3 border-t border-base-300">
        {{ v.description?.details }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 md:!grid-cols-3 gap-4 mx-4 md:mx-6">
      <CommissionRate :commission="v.commission"></CommissionRate>
      <div class="bg-[#141416] border border-[#242627] rounded-[16px] shadow relative overflow-auto">
        <div class="text-lg font-semibold text-main px-4 pt-4">
          {{ $t('staking.commissions_&_rewards') }}
        </div>
        <div class="px-4 mt-1 flex flex-col justify-between pb-4 max-h-72" style="height: calc(100% - 50px)">
          <div class="overflow-auto flex-1">
            <div class="text-sm mb-2">{{ $t('staking.commissions') }}</div>
            <div v-for="(i, k) in commission" :key="`reward-${k}`" color="info" label variant="outlined"
              class="mr-1 mb-1 badge text-xs">
              {{ format.formatToken2(i, 1e18) }}
            </div>
            <div class="text-sm mb-2 mt-2">
              {{ $t('staking.outstanding') }} {{ $t('account.rewards') }}
            </div>
            <div v-for="(i, k) in rewards" :key="`reward-${k}`" class="mr-1 mb-1 badge text-xs">
              {{ format.formatToken2(i, 1e18) }}
            </div>
          </div>
          <div class="">
            <label for="withdraw_commission" class="btn btn-primary w-full capitalize" @click="
                dialog.open('withdraw_commission', {
                  validator_address: v.operatorAddress,
                })
              ">{{ $t('account.btn_withdraw') }}</label>
          </div>
        </div>
      </div>
      <div class="bg-[#141416] border border-[#242627] rounded-[16px] shadow overflow-x-auto">
        <div class="px-4 pt-4 mb-2 text-main font-lg font-semibold">
          {{ $t('staking.addresses') }}
        </div>
        <div class="px-4 pb-4">
          <div class="mb-3">
            <div class="text-sm flex">
              {{ $t('staking.account_addr') }}
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="addresses.account"
                @click="copyWebsite(addresses.account || '')" />
            </div>
            <RouterLink class="text-xs text-link" :to="`/${chain}/account/${addresses.account}`">
              {{ addresses.account }}
            </RouterLink>
          </div>
          <div class="mb-3">
            <div class="text-sm flex">
              {{ $t('staking.operator_addr') }}
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="v.operatorAddress"
                @click="copyWebsite(v.operatorAddress || '')" />
            </div>
            <div class="text-xs">
              {{ v.operatorAddress }}
            </div>
          </div>
          <div class="mb-3">
            <div class="text-sm flex">
              {{ $t('staking.hex_addr') }}
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="addresses.hex"
                @click="copyWebsite(addresses.hex || '')" />
            </div>
            <div class="text-xs">{{ addresses.hex }}</div>
          </div>
          <div class="mb-3">
            <div class="text-sm flex">
              {{ $t('staking.signer_addr') }}
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="addresses.valCons"
                @click="copyWebsite(addresses.valCons || '')" />
            </div>
            <div class="text-xs">{{ addresses.valCons }}</div>
          </div>
          <div>
            <div class="text-sm flex">
              {{ $t('staking.consensus_pub_key') }}
              <Icon icon="mdi:content-copy" class="ml-2 cursor-pointer" v-show="v.consensusPubkey"
                @click="copyWebsite(JSON.stringify(consensusPubkey) || '')" />
            </div>
            <div class="text-xs">{{ consensusPubkey }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="delegations.delegationResponses"
      class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="text-lg mb-4 font-semibold text-white">
        {{ $t('account.delegations') }}
        <span class="float-right">
          {{ delegations.delegationResponses?.length || 0 }} /
          {{ delegations.pagination?.total || 0 }}
        </span>
      </div>
      <div class="rounded overflow-auto">
        <table class="table validatore-table w-full">
          <thead>
            <th class="text-left pl-4" style="position: relative; z-index: 2">
              {{ $t('account.delegator') }}
            </th>
            <th class="text-left pl-4">{{ $t('account.delegation') }}</th>
          </thead>
          <tbody>
            <tr v-for="{ balance, delegation } in delegations.delegationResponses">
              <td class="text-sm text-link">
                {{ delegation.delegatorAddress }}
              </td>
              <td class="truncate text-link">
                {{ format.formatToken(balance) }}
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar :total="delegations.pagination?.total.toString()" :limit="page.limit" :callback="pageload" />
      </div>
    </div>

    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="text-lg mb-4 font-semibold text-white">
        {{ $t('account.transactions') }}
      </div>
      <!-- <div class="rounded overflow-auto">
        <table class="table validatore-table w-full">
          <thead>
            <th class="text-left pl-4" style="position: relative; z-index: 2">
              {{ $t('account.height') }}
            </th>
            <th class="text-left pl-4">{{ $t('account.hash') }}</th>
            <th class="text-left pl-4" width="40%">
              {{ $t('account.messages') }}
            </th>
            <th class="text-left pl-4">{{ $t('account.time') }}</th>
          </thead>
          <tbody>
            <tr v-for="(item, i) in txs.txs">
              <td class="text-sm text-link">
                <RouterLink :to="`/${props.chain}/block/${item.height}`">{{
                  item.height
                }}</RouterLink>
              </td>
              <td class="truncate text-link" style="max-width: 200px">
                <RouterLink :to="`/${props.chain}/tx/${toHex(item.hash)}`">
                  {{ toHex(item.hash) }}
                </RouterLink>
              </td>
              <td>
                <div class="flex items-center">
                  <span class="mr-2">{{
                    format.messages(item.txRaw.body.messages)
                  }}</span>
                  <Icon
                    v-if="item.result.code === 0"
                    icon="mdi-check"
                    class="text-yes"
                  />
                  <Icon v-else icon="mdi-multiply" class="text-no" />
                </div>
              </td>
              <td width="150">{{ format.toDay(item.timestamp, 'from') }}</td>
            </tr>
          </tbody>
        </table>
      </div> -->
      <div v-if="CHAIN_INDEXS.includes(chain || '')">
        <TransactionAccountIndexs :chain="chain" :address="addresses.account" />
      </div>
      <div v-else>
        <TransactionStakingRpc :txs="txs" :chain="chain" />
      </div>
    </div>

    <div class="m-4 md:m-6 mb-4 p-4 md:p-6 rounded-[16px] shadow bg-[#141416] border border-[#242627]">
      <div class="text-lg mb-4 font-semibold text-white">
        <div class="tabs tabs-boxed bg-transparent">
          <span class="mr-10">Voting Power Events: </span>
          <a class="tab text-gray-400" :class="{ 'tab-active': selectedEventType === EventType.Delegate }"
            @click="loadPowerEvents(1, EventType.Delegate)">{{ $t('account.btn_delegate') }}</a>
          <a class="tab text-gray-400" :class="{ 'tab-active': selectedEventType === EventType.Unbond }"
            @click="loadPowerEvents(1, EventType.Unbond)">{{ $t('account.btn_unbond') }}</a>
        </div>
      </div>
      <div class="rounded overflow-auto">
        <table class="table validatore-table w-full">
          <thead>
            <th class="text-left pl-4">{{ $t('account.delegator') }}</th>
            <th class="text-left pl-4">{{ $t('account.amount') }}</th>
            <th class="text-left pl-4">
              {{ $t('account.height') }} / {{ $t('account.time') }}
            </th>
          </thead>
          <tbody>
            <tr v-for="(item, i) in events.txs">
              <td class="pr-2 truncate text-link" style="max-width: 250px">
                <RouterLink v-for="d in mapDelegators(item)" :to="`/${props.chain}/account/${d}`">
                  {{ d }}
                </RouterLink>
              </td>
              <td>
                <div class="flex items-center" :class="{
                    'text-yes': selectedEventType === EventType.Delegate,
                    'text-no': selectedEventType === EventType.Unbond,
                  }">
                  <RouterLink :to="`/${props.chain}/tx/${toHex(item.hash)}`">
                    <span class="mr-2">
                      {{ selectedEventType === EventType.Delegate ? '+' : '-' }}
                      {{ mapAmounts(item).map((i) => (i / 10 ** 6).toLocaleString("en-US", {})).join(', ') }}</span>
                  </RouterLink>
                  <Icon v-if="item.result.code === 0" icon="mdi-check" class="text-yes" />
                  <Icon v-else icon="mdi-multiply" class="text-no" />
                </div>
              </td>
              <td width="150">
                <RouterLink class="text-link mb-0" :to="`/${props.chain}/block/${item.height}`">{{ item.height }}
                </RouterLink><br />
                <span class="text-xs pt-0 mt-0">{{
                  format.toDay(item.timestamp, 'from')
                  }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar :total="events.totalCount?.toString() || '0'" :limit="page.limit" :callback="pagePowerEvents" />
      </div>
    </div>
    <!-- end -->
    <div class="toast" v-show="showCopyToast === 1">
      <div class="alert alert-success">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
    <div class="toast" v-show="showCopyToast === 2">
      <div class="alert alert-error">
        <div class="text-xs md:!text-sm">
          <span>{{ tipMsg.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

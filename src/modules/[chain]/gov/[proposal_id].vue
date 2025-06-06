<script lang="ts" setup>
import Countdown from '@/components/Countdown.vue';
import { decodeProto } from '@/components/dynamic';
import ObjectElement from '@/components/dynamic/ObjectElement.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import { tokenMap } from '@/libs/amm-v3';
import {
  useBaseStore,
  useBlockchain,
  useFormatter,
  useGovStore,
  useStakingStore,
  useTxDialog,
} from '@/stores';
import { PageRequest } from '@/types';
import { formatSmallNumber } from '@/utils';
import { fromBech32, toHex } from '@cosmjs/encoding';
import type { PageResponse } from 'cosmjs-types/cosmos/base/query/v1beta1/pagination';
import type { Params } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import type { Proposal, TallyResult, Vote } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  ProposalStatus,
  proposalStatusToJSON,
  voteOptionToJSON,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import type { QueryDepositsResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';
import type { ParameterChangeProposal } from 'cosmjs-types/cosmos/params/v1beta1/params';
import type { MsgSoftwareUpgrade } from 'cosmjs-types/cosmos/upgrade/v1beta1/tx';
import type { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
import { fromTimestamp } from 'cosmjs-types/helpers';
import MdEditor from 'md-editor-v3';
import { computed, onMounted, reactive, ref, toRaw, watch, watchEffect } from 'vue';

export type ExtraProposal = {
  title: string,
  content: any;
  status: ProposalStatus;
  finalTallyResult: TallyResult;
  submitTime: Timestamp;
  depositEndTime: Timestamp;
  votingStartTime: Timestamp;
  votingEndTime: Timestamp;
  contentProto: any
};

const props = defineProps(['proposal_id', 'chain']);
const proposal = ref({} as ExtraProposal);
const format = useFormatter();
const store = useGovStore();
const dialog = useTxDialog();
const stakingStore = useStakingStore();
const chainStore = useBlockchain();
const summary = ref();
const blockTime = ref(1);
const votingPowers = ref({} as any);

store.fetchProposal(props.proposal_id).then((res) => {
  if (!res.content?.content?.description) summary.value = res.summary;
  let changeProposal
  try {
    if (res.contentProto) changeProposal = decodeProto(
      res.contentProto as any
    ) as ParameterChangeProposal;
  } catch (error) {
    console.log({ error });
  }
  if (changeProposal) Object.assign(res.contentProto!, changeProposal);
  proposal.value = res;
  // when status under the voting, final_tally_result are no data, should request fetchTally
  if (res.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD) {
    // 'PROPOSAL_STATUS_VOTING_PERIOD') {
    store.fetchTally(props.proposal_id).then((tallRes) => {
      proposal.value = { ...proposal.value, finalTallyResult: tallRes.tally };
    });
  }
 
  // load origin params if the proposal is param change
  if (changeProposal?.changes) {
    changeProposal.changes.forEach((item) => {
      chainStore.rpc.getParams(item.subspace, item.key).then((res) => {
        if (proposal.value.content && res?.params) {
          if (proposal.value.content.current) {
            proposal.value.content.current.push(res.params);
          } else {
            proposal.value.content.current = [res.params];
          }
        }
      });
    });
  }
});

const proposalRest = computed(() => {
  if (!proposal.value.content) return;
  const { title, description, plan, typeUrl, ...rest } = proposal.value.content;
  return rest;
});

const color = computed(() => {
  if (proposal.value.status === ProposalStatus.PROPOSAL_STATUS_PASSED) {
    // 'PROPOSAL_STATUS_PASSED') {
    return 'success';
  } else if (
    proposal.value.status === ProposalStatus.PROPOSAL_STATUS_REJECTED
  ) {
    return 'error';
  }
  return '';
});
const status = computed(() => {
  if (proposal.value.status) {
    return proposalStatusToJSON(proposal.value.status)
      .toLowerCase()
      .replace(/^proposal_status/, '')
      .replaceAll(/_(.)/g, (m, g) => ' ' + g.toUpperCase())
      .trim();
  }
  return '';
});

const deposit = ref({} as QueryDepositsResponse);
store.fetchProposalDeposits(props.proposal_id).then((x) => (deposit.value = x));

const votes = ref({} as Vote[]);
const pageRequest = ref(new PageRequest());
const pageResponse = ref({} as PageResponse | undefined);

store.fetchProposalVotes(props.proposal_id).then((x) => {
  votes.value = x.votes;
  pageResponse.value = x.pagination;
});

watchEffect(async () => {
  const result: any = {};
  const totalPower = stakingStore.totalPower;
  const promiseAll = [];
  if (Array.isArray(votes.value)) {
    for (let item of votes.value) {
      // const { data } = fromBech32(item.voter);
      // const hex = toHex(data);
      // const v = stakingStore.validators.find(
      //   (x) => toHex(fromBech32(x.operatorAddress).data) === hex
      // );
      // if (!!v) {
      //   const votingPowerValidator = format.calculatePercent(
      //     v.delegatorShares,
      //     totalPower
      //   );
      //   result[item.voter] = votingPowerValidator;
      // } else {
      //   promiseAll.push(chainStore.rpc.getStakingDelegations(item.voter));
      // }
      promiseAll.push(chainStore.rpc.getStakingDelegations(item.voter));
    }
  }
  if (promiseAll.length) {
    const delegations = await Promise.all(promiseAll);
    if (Array.isArray(delegations)) {
      for (let delegation of delegations) {
        const { delegationResponses } = delegation;
        for (let delegationResponse of delegationResponses) {
          let totalAmount = 0;
          let voter = "";
          const { balance, delegation } = delegationResponse;
          const tokenInfo = tokenMap[balance.denom];
          if(tokenInfo){
            const { coinDecimals } = tokenInfo
            totalAmount += Number(balance.amount) / 10 ** coinDecimals;
          }
          voter = delegation.delegatorAddress
          result[voter] = formatSmallNumber(((totalAmount / (totalPower / 10 ** 24)) / 100)) + "%";
        }
      }
    }
  }
  votingPowers.value = result;
})

function shortTime(v: string | Date | Timestamp) {
  if (v) {
    return format.toDay(v, 'from');
  }
  return '';
}

const votingCountdown = computed((): number => {
  const now = new Date();
  const end = proposal.value.votingEndTime
    ? fromTimestamp(proposal.value.votingEndTime)
    : new Date();
  return end.getTime() - now.getTime();
});

const upgradeCountdown = computed((): number => {
  // @ts-ignore
  const upgradeSoftware = proposal.value.content as MsgSoftwareUpgrade;
  const height = Number(upgradeSoftware.plan?.height || 0);
  if (height > 0) {
    const base = useBaseStore();
    const current = Number(base.latest?.block?.header?.height || 0);
    return (height - current) * blockTime.value * 1000;
  }
  const now = new Date();
  const end = upgradeSoftware.plan?.time
    ? fromTimestamp(upgradeSoftware.plan?.time || '')
    : new Date();
  return end.getTime() - now.getTime();
});

const total = computed(() => {
  const tally = proposal.value.finalTallyResult;
  let sum = 0;
  if (tally) {
    sum += Number(tally.abstain || 0);
    sum += Number(tally.yes || 0);
    sum += Number(tally.no || 0);
    sum += Number(tally.noWithVeto || 0);
  }
  return sum;
});

const turnout = computed(() => {
  if (total.value > 0) {
    const bonded = stakingStore.pool?.bondedTokens || '1';
    return format.percent(total.value / Number(bonded));
  }
  return 0;
});

const yes = computed(() => {
  if (total.value > 0) {
    const yes = proposal.value?.finalTallyResult?.yes || 0;
    return format.percent(Number(yes) / total.value);
  }
  return 0;
});

const no = computed(() => {
  if (total.value > 0) {
    const value = proposal.value?.finalTallyResult?.no || 0;
    return format.percent(Number(value) / total.value);
  }
  return 0;
});

const veto = computed(() => {
  if (total.value > 0) {
    const value = proposal.value?.finalTallyResult?.noWithVeto || 0;
    return format.percent(Number(value) / total.value);
  }
  return 0;
});

const abstain = computed(() => {
  if (total.value > 0) {
    const value = proposal.value?.finalTallyResult?.abstain || 0;
    return format.percent(Number(value) / total.value);
  }
  return 0;
});
const processList = computed(() => {
  return [
    { name: 'Turnout', value: turnout.value, class: 'bg-info' },
    { name: 'Yes', value: yes.value, class: 'bg-success' },
    { name: 'No', value: no.value, class: 'bg-error' },
    { name: 'Veto', value: veto.value, class: 'bg-red-800' },
    { name: 'Abstain', value: abstain.value, class: 'bg-warning' },
  ];
});

function showValidatorName(voter: string) {
  const { data } = fromBech32(voter);
  const hex = toHex(data);
  const v = stakingStore.validators.find(
    (x) => toHex(fromBech32(x.operatorAddress).data) === hex
  );
  return v ? v.description.moniker : voter;
}

function pageload(p: number) {
  pageRequest.value.setPage(p);
  store.fetchProposalVotes(props.proposal_id, pageRequest.value).then((x) => {
    votes.value = x.votes;
    pageResponse.value = x.pagination;
  });
}

function metaItem(metadata: string | undefined): {
  title: string;
  summary: string;
} {
  return metadata ? JSON.parse(metadata) : {};
}

onMounted(async() => {
  const base = useBaseStore();
  const currentHeight = Number(base.latest?.block?.header?.height || 0);
  if(!!currentHeight){
    const preHeight = currentHeight - 1000;
    const [blockNew, blockOld] = await Promise.all([
      base.fetchBlock(currentHeight),
      base.fetchBlock(preHeight),
    ]);
    const blockTimeNew = new Date(blockNew.block?.header?.time?.toString()).getTime();
    const blockTimeOld = new Date(blockOld.block?.header?.time?.toString()).getTime();
    if (!isNaN(blockTimeNew) && !isNaN(blockTimeOld)) blockTime.value = (blockTimeNew - blockTimeOld) / (1000 * 1000);
  }
  
})

</script>

<template>
  <div class="px-6">
    <div class="px-4 pt-3 pb-4 rounded mb-4 shadow">
      <h2 class="card-title flex flex-col md:!justify-between md:!flex-row mb-2 text-white">
        <p class="truncate w-full">
          #{{ proposal_id }}
          {{ proposal.content?.title || proposal.title }}
        </p>
        <!-- <div class="badge badge-ghost" :class="color === 'success'
            ? 'text-yes'
            : color === 'error'
              ? 'text-no'
              : 'text-info'
          ">
          {{ proposal.status }}
        </div> -->
      </h2>

      <!-- <div v-if="proposal.content?.description">
        <MdEditor :model-value="format.multiLine(proposal.content?.description)" previewOnly class="md-editor-recover">
        </MdEditor>
      </div>
      <div v-if="proposalRest">
        <ObjectElement :value="proposalRest" />
      </div> -->

      <div v-if="proposal.content">
        <ObjectElement :value="proposal.content" />
      </div>
      
      <div v-if="summary && !proposal.content?.description">
        <MdEditor :model-value="format.multiLine(summary)" previewOnly class="md-editor-recover">
        </MdEditor>
      </div>
    </div>

    <!-- grid lg:!!grid-cols-3 auto-rows-max-->
    <!-- flex-col lg:!!flex-row flex -->
    <div class="gap-4 mb-4 grid lg:!!grid-cols-3 auto-rows-max">
      <!-- flex-1 -->
      <div class="section">
        <h2 class="card-title mb-1 text-white">
          {{ $t('gov.tally') }}
        </h2>
        <div class="mb-1" v-for="(item, index) of processList" :key="index">
          <label class="block text-sm mb-1">{{ item.name }}</label>
          <div class="h-5 w-full relative">
            <div
              class="absolute inset-x-0 inset-y-0 w-full opacity-10 rounded-sm"
              :class="`${item.class}`"
            ></div>
            <div
              class="absolute inset-x-0 inset-y-0 rounded-sm"
              :class="`${item.class}`"
              :style="`width: ${
                item.value === '-' || item.value === 'NaN%' ? '0%' : item.value
              }`"
            ></div>
            <p
              class="absolute inset-x-0 inset-y-0 text-center text-sm text-[#666] dark:text-[#eee] flex items-center justify-center"
            >
              {{ item.value }}
            </p>
          </div>
        </div>
        <div class="mt-6 grid grid-cols-2"
          v-if="proposal.status !== ProposalStatus.PROPOSAL_STATUS_PASSED && proposal.status !== ProposalStatus.PROPOSAL_STATUS_REJECTED">
          <label for="vote" class="btn btn-primary float-right btn-sm mx-1"
            @click="dialog.open('vote', { proposal_id })">{{ $t('gov.btn_vote') }}</label>
          <label for="deposit"
            class="btn btn-primary rounded-lg float-right btn-sm mx-1 bg-[#2E2E33] border border-[#383B40]"
            @click="dialog.open('deposit', { proposal_id })">{{ $t('gov.btn_deposit') }}</label>
        </div>
      </div>

      <div class="section">
        <h2 class="card-title text-white">{{ $t('gov.timeline') }}</h2>

        <div class="px-1">
          <div class="flex items-center mb-4 mt-2">
            <div class="w-2 h-2 rounded-full bg-error mr-3"></div>
            <div class="text-base flex-1 text-main">
              {{ $t('gov.submit_at') }}:
              {{ format.toDay(proposal.submitTime) }}
            </div>
            <div class="text-sm">
              {{ shortTime(proposal.submitTime) }}
            </div>
          </div>
          <div class="flex items-center mb-4">
            <div class="w-2 h-2 rounded-full bg-primary mr-3"></div>
            <div class="text-base flex-1 text-main">
              {{ $t('gov.deposited_at') }}:
              {{
              format.toDay(
              proposal.status ===
              ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD
              ? proposal.depositEndTime
              : proposal.votingStartTime
              )
              }}
            </div>
            <div class="text-sm">
              {{
              shortTime(
              proposal.status ===
              ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD
              ? proposal.depositEndTime
              : proposal.votingStartTime
              )
              }}
            </div>
          </div>
          <div class="mb-4">
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full bg-yes mr-3"></div>
              <div class="text-base flex-1 text-main">
                {{ $t('gov.vote_start_from') }}:
                {{ format.toDay(proposal.votingStartTime) }}
              </div>
              <div class="text-sm">
                {{ shortTime(proposal.votingStartTime) }}
              </div>
            </div>
            <div class="pl-5 text-sm mt-2"
              v-if="proposal.status !== ProposalStatus.PROPOSAL_STATUS_PASSED && proposal.status !== ProposalStatus.PROPOSAL_STATUS_REJECTED">
              <Countdown :time="votingCountdown" />
            </div>
          </div>
          <div>
            <div class="flex items-center mb-1">
              <div class="w-2 h-2 rounded-full bg-success mr-3"></div>
              <div class="text-base flex-1 text-main">
                {{ $t('gov.vote_end') }}:
                {{ format.toDay(proposal.votingEndTime) }}
              </div>
              <div class="text-sm">
                {{ shortTime(proposal.votingEndTime) }}
              </div>
            </div>
            <div class="pl-5 text-sm" v-if="typeof proposal.status === 'number'">
              {{ $t('gov.current_status') }}:
              {{
              $t(
              `gov.proposal_statuses.${proposalStatusToJSON(
              proposal.status
              )}`
              )
              }}
            </div>
            <div class="pl-5 text-sm" v-else>
              {{ $t('gov.current_status') }}:
              {{ $t(`gov.proposal_statuses.${proposal.status}`) }}
            </div>
          </div>

          <div class="mt-4" v-if="
            proposal?.content?.typeUrl?.endsWith('SoftwareUpgradeProposal')
          ">
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full bg-warning mr-3"></div>
              <div class="text-base flex-1 text-main">
                {{ $t('gov.upgrade_plan') }}:
                <span v-if="Number(proposal.content.plan?.height || '0') > 0">
                  (EST)</span>
                <span v-else>{{
                  format.toDay(proposal.content?.plan?.time)
                  }}</span>
              </div>
              <div class="text-sm">
                {{ shortTime(proposal.votingEndTime) }}
              </div>
            </div>
            <div class="pl-5 text-sm mt-2"
              v-if="proposal.status !== ProposalStatus.PROPOSAL_STATUS_PASSED && proposal.status !== ProposalStatus.PROPOSAL_STATUS_REJECTED">
              <Countdown :time="upgradeCountdown" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section" v-if="proposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD">
      <h2 class="card-title text-white">{{ $t('gov.votes') }}</h2>
      <div class="overflow-x-auto">
        <table class="table w-full table-zebra">
          <tbody>
            <tr v-for="(item, index) of votes" :key="index">
              <td class="py-2 text-sm">{{ showValidatorName(item.voter) }}</td>
              <!-- <td v-if="item.option" class="py-2 text-sm" :class="{
                'text-yes': item.option === VoteOption.VOTE_OPTION_YES,
                'text-gray-400':
                  item.option === VoteOption.VOTE_OPTION_ABSTAIN,
              }">
                {{
                voteOptionToJSON(item.option)
                .toLowerCase()
                .replace(/^vote_option/, '')
                .replaceAll(/_(.)/g, (m, g) => ' ' + g.toUpperCase())
                .trim()
                }}
              </td> -->
              <td v-if="item.options" class="py-2 text-sm">
                {{
                  item.options
                    .map((x:any) => {
                      const result = `${voteOptionToJSON(x.option)
                        .toLowerCase()
                        .replace(/^vote_option/, '')
                        .replaceAll(/_(.)/g, (m, g) => ' ' + g.toUpperCase())
                        .trim()}`
                      if (result === "No With Veto") return "Veto"
                    return result}).join(', ')
                }}
              </td>
              <td class="flex justify-end">
                <span v-html="votingPowers[item.voter] || '0%'"></span>
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar :limit="pageRequest.limit" :total="pageResponse?.total?.toString()" :callback="pageload" />
      </div>
    </div>
  </div>
</template>

<style scoped>
::v-deep span {
  background-color: #18181A !important;
  color: white !important;
}
</style>

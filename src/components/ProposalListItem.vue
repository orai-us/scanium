<script lang="ts" setup>
import {
  useBlockchain,
  useFormatter,
  useStakingStore,
  useTxDialog,
} from '@/stores';
import { select } from '@/components/dynamic/index';
import ProposalProcess from './ProposalProcess.vue';
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import {
  ProposalStatus,
  VoteOption,
  voteOptionToJSON,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import type { ExtraQueryProposalsResponse } from '@/libs/client';
const dialog = useTxDialog();
defineProps({
  proposals: { type: Object as PropType<ExtraQueryProposalsResponse> },
});

const format = useFormatter();
const staking = useStakingStore();
const chain = useBlockchain();
function showType(v: string) {
  if (v) {
    return v.substring(v.lastIndexOf('.') + 1);
  }
  return v;
}

const statusMap: Record<string, string> = {
  [ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD]: 'VOTING',
  [ProposalStatus.PROPOSAL_STATUS_PASSED]: 'PASSED',
  [ProposalStatus.PROPOSAL_STATUS_REJECTED]: 'REJECTED',
};
const voterStatusMap: Record<string, string> = {
  VOTE_OPTION_NO_WITH_VETO: '',
  VOTE_OPTION_YES: 'success',
  VOTE_OPTION_NO: 'error',
  VOTE_OPTION_ABSTAIN: 'warning',
};

const proposalInfo = ref();

function metaItem(metadata: string | undefined): {
  title: string;
  summary: string;
} {
  return metadata ? JSON.parse(metadata) : {};
}
</script>
<template>
  <div class="bg-white dark:bg-transparent rounded-lg text-sm">
    <table class="table-compact w-full table-fixed hidden lg:!table">
      <tbody>
        <tr
          v-for="(item, index) in proposals?.proposals"
          :key="index"
          class="hover:bg-[#47474B] cursor-pointer border-b border-b-[#242627] px-4 rounded"
        >
          <td class="px-4 w-20">
            <label for="proposal-detail-modal" class="text-main text-base">
              #{{ item?.proposalId }}</label
            >
          </td>
          <td class="w-full">
            <div>
              <RouterLink
                :to="`/${chain.chainName}/gov/${item?.proposalId}`"
                class="text-base mb-1 block text-indigo-400 truncate"
              >
                {{ item?.title }}
              </RouterLink>
              <div
                v-if="item.content"
                class="bg-[#f6f2ff] text-[#9c6cff] dark:bg-gray-600 dark:text-gray-300 inline-block rounded-full px-2 py-[1px] text-xs mb-1"
              >
                {{ showType(item.content.typeUrl) }}
              </div>
            </div>
          </td>
          <td class="w-60">
            <ProposalProcess
              :pool="staking.pool"
              :tally="item.finalTallyResult"
            ></ProposalProcess>
          </td>
          <td class="w-36">
            <div class="pl-4">
              <div
                class="flex items-center"
                :class="
                  item?.status === ProposalStatus.PROPOSAL_STATUS_PASSED
                    ? 'text-yes'
                    : item?.status === ProposalStatus.PROPOSAL_STATUS_REJECTED
                    ? 'text-no'
                    : 'text-info'
                "
              >
                <div
                  class="w-1 h-1 rounded-full mr-2"
                  :class="
                    item?.status === ProposalStatus.PROPOSAL_STATUS_PASSED
                      ? 'bg-yes'
                      : item?.status === ProposalStatus.PROPOSAL_STATUS_REJECTED
                      ? 'bg-no'
                      : 'bg-info'
                  "
                ></div>
                <div class="text-xs">
                  {{ statusMap?.[item?.status] || item?.status }}
                </div>
              </div>
              <div
                class="truncate col-span-2 md:!col-span-1 text-xs text-gray-500 dark:text-gray-400 text-right md:!flex md:!justify-start"
              >
                {{ format.toDay(item.votingEndTime, 'from') }}
              </div>
            </div>
          </td>

          <td v-if="statusMap?.[item?.status] === 'VOTING'" class="w-40">
            <div class="">
              <label
                for="vote"
                class="btn btn-xs btn-primary rounded-sm"
                @click="
                  dialog.open('vote', {
                    proposal_id: item?.proposalId,
                  })
                "
              >
                <!-- <span
                  v-if="
                    item?.voterStatus !== VoteOption.VOTE_OPTION_NO_WITH_VETO
                  "
                  >{{
                    voteOptionToJSON(item?.voterStatus)
                      .toLowerCase()
                      .replace(/^vote_option/, '')
                      .replaceAll(/_(.)/g, (m, g) => ' ' + g.toUpperCase())
                      .trim()
                  }}</span
                >

                <span v-else>Vote</span> -->
                <span>{{ $t('gov.voting') }}</span>
              </label>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="lg:!hidden">
      <div
        v-for="(item, index) in proposals?.proposals"
        :key="index"
        class="px-4 py-4"
      >
        <div
          class="text-main text-base mb-1 flex justify-between hover:text-indigo-400"
        >
          <RouterLink
            v-if="item?.proposalId"
            :to="`/${chain.chainName}/gov/${item.proposalId.toString()}`"
            class="flex-1 w-0 truncate mr-4"
            >{{ item?.title }}</RouterLink
          >
          <label for="proposal-detail-modal" class="text-main text-base">
            <!-- @click="proposalInfo = item" -->
            <!-- hover:text-indigo-400 cursor-pointer -->
            #{{ item?.proposalId }}</label
          >
        </div>

        <div class="grid grid-cols-4 mt-2 mb-2">
          <div class="col-span-2">
            <div
              v-if="item.content"
              class="bg-[#f6f2ff] text-[#9c6cff] dark:bg-gray-600 dark:text-gray-300 inline-block rounded-full px-2 py-[1px] text-xs mb-1"
            >
              {{ showType(item.content.typeUrl) }}
            </div>
          </div>

          <div
            class="truncate text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end"
          >
            {{ format.toDay(item.votingEndTime, 'from') }}
          </div>
        </div>

        <div>
          <ProposalProcess
            :pool="staking.pool"
            :tally="item.finalTallyResult"
          ></ProposalProcess>
        </div>

        <div class="mt-4" v-if="statusMap?.[item?.status] === 'VOTING'">
          <div class="flex justify-between">
            <div
              class="flex items-center"
              :class="
                item?.status === ProposalStatus.PROPOSAL_STATUS_PASSED
                  ? 'text-yes'
                  : item?.status === ProposalStatus.PROPOSAL_STATUS_REJECTED
                  ? 'text-no'
                  : 'text-info'
              "
            >
              <div
                class="w-1 h-1 rounded-full mr-2"
                :class="
                  item?.status === ProposalStatus.PROPOSAL_STATUS_PASSED
                    ? 'bg-yes'
                    : item?.status === ProposalStatus.PROPOSAL_STATUS_REJECTED
                    ? 'bg-no'
                    : 'bg-info'
                "
              ></div>
              <div class="text-xs flex items-center">
                {{ statusMap?.[item?.status] || item?.status }}
              </div>
            </div>
            <label
              for="vote"
              class="btn btn-xs btn-primary rounded-sm"
              @click="
                dialog.open('vote', {
                  proposal_id: item?.proposalId,
                })
              "
            >
              <span
                v-if="item?.voterStatus !== VoteOption.VOTE_OPTION_NO_WITH_VETO"
                >{{
                  voteOptionToJSON(item?.voterStatus)
                    .toLowerCase()
                    .replace(/^vote_option/, '')
                    .replaceAll(/_(.)/g, (m, g) => ' ' + g.toUpperCase())
                    .trim()
                }}</span
              >

              <span v-else>Vote</span></label
            >
          </div>
        </div>
      </div>
    </div>

    <!-- <input type="checkbox" id="proposal-detail-modal" class="modal-toggle" /> -->
    <!-- <label for="proposal-detail-modal" class="modal">
      <label class="modal-box !w-11/12 !max-w-5xl" for="">
        <label
          for="proposal-detail-modal"
          class="btn btn-sm btn-circle absolute right-2 top-2"
          >✕</label
        >
        <h3 class="font-bold text-lg">Description</h3>
        <p class="py-4">
          <Component
            v-if="
              proposalInfo?.content?.description ||
              proposalInfo?.summary ||
              metaItem(proposalInfo?.metadata)?.summary
            "
            :is="
              select(
                proposalInfo?.content?.description ||
                  proposalInfo?.summary ||
                  metaItem(proposalInfo?.metadata)?.summary,
                'horizontal'
              )
            "
            :value="
              proposalInfo?.content?.description ||
              proposalInfo?.summary ||
              metaItem(proposalInfo?.metadata)?.summary
            "
          >
          </Component>
        </p>
      </label>
    </label> -->
  </div>
</template>

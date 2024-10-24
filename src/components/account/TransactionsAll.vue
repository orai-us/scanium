<script lang="ts" setup>
import { useFormatter } from "@/stores";
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reactive } from "vue";
import Pagination from "../pagination/Pagination.vue";
import { shortenTxHash } from "@/utils";

const props = defineProps(['txs', 'chain'])
const format = useFormatter();

// Transaction in contract
const transactions = ref([
  {
    "__typename": "Transaction",
    "id": "D1CECE1DB35AE55C81F28E99B2B36BCAC9BA181DB6E3B1CEE0DAA5413C0ADE0E",
    "blockNumber": "36000000",
    "gasUsed": "65995",
    "timestamp": "1728833537678",
    "sender": "orai1za07jsxl9hhwmu3kth3u93sq8jstzd5mvrpvqk",
    "messages": {
      "__typename": "TransactionMessagesConnection",
      "nodes": [
        {
          "__typename": "TransactionMessage",
          "type": "/cosmwasm.wasm.v1.MsgExecuteContract",
          "subType": "propose"
        }
      ]
    }
  },
  {
    "__typename": "Transaction",
    "id": "D639DCCA140E9AE65B2221D77322C346EA5E04D3BBDD409858B91BBA67C16B73",
    "blockNumber": "36000001",
    "gasUsed": "65995",
    "timestamp": "1728833538368",
    "sender": "orai18rr2d53nl56nweanpnkg65dyj7ulua6myh4xvn",
    "messages": {
      "__typename": "TransactionMessagesConnection",
      "nodes": [
        {
          "__typename": "TransactionMessage",
          "type": "/cosmwasm.wasm.v1.MsgExecuteContract",
          "subType": "propose"
        }
      ]
    }
  },
  {
    "__typename": "Transaction",
    "id": "A4888C7F496D5F525C0B24D74A345973A2317FED8512986E2CA48A23FFADD0BF",
    "blockNumber": "36000007",
    "gasUsed": "66085",
    "timestamp": "1728833542913",
    "sender": "orai18rr2d53nl56nweanpnkg65dyj7ulua6myh4xvn",
    "messages": {
      "__typename": "TransactionMessagesConnection",
      "nodes": [
        {
          "__typename": "TransactionMessage",
          "type": "/cosmwasm.wasm.v1.MsgExecuteContract",
          "subType": "vote"
        }
      ]
    }
  },
  {
    "__typename": "Transaction",
    "id": "6AB1DEAE8C93B8D2E973690B3334E7C2E08125FBE0CB2E94996B8261C088920F",
    "blockNumber": "36000009",
    "gasUsed": "66085",
    "timestamp": "1728833544641",
    "sender": "orai1gu0vpuv4vkyhzllqqnxmkkehdqvtmltu9gkrpe",
    "messages": {
      "__typename": "TransactionMessagesConnection",
      "nodes": [
        {
          "__typename": "TransactionMessage",
          "type": "/cosmwasm.wasm.v1.MsgExecuteContract",
          "subType": "vote"
        }
      ]
    }
  },
  {
    "__typename": "Transaction",
    "id": "F2697067DB3615B3A9835738D7062B4885CAFF98E6BC8AFF3FF958DE05117003",
    "blockNumber": "36000015",
    "gasUsed": "66058",
    "timestamp": "1728833549056",
    "sender": "orai1hf2x7qu24qp5efh76ndcuc66e2qms2gk96ssqu",
    "messages": {
      "__typename": "TransactionMessagesConnection",
      "nodes": [
        {
          "__typename": "TransactionMessage",
          "type": "/cosmwasm.wasm.v1.MsgExecuteContract",
          "subType": "propose"
        }
      ]
    }
  }
]);
const totalCount = ref();
const pagination = reactive({
  limit: 10,
  offset: 0
})

const query = gql`
      query GetTransactions($filter: TransactionFilter!, $orderBy: [TransactionsOrderBy!], $first: Int!, $offset: Int!) {
        transactions(filter: $filter, orderBy: $orderBy, first: $first, offset:$offset) {
          results: nodes {
            id
            blockNumber
            gasUsed
            timestamp
            sender
            fee
            messages {
              nodes {
                type
                subType
              }
            }
          }
          totalCount
        }
      }
    `;

const variables = computed(() => {
  return {
    filter: {
      messages: {
        some: {
          account: {
            equalTo: "orai1zhmkqz936xupt34rq3scrg5j7tv6recq04d44t",
          },
        },
      },
    },
    orderBy: "BLOCK_NUMBER_ASC",
    first: pagination.limit,
    offset: pagination.offset
  }
})

const { result, refetch } = useQuery(query, variables);

watchEffect(() => {
  if (result.value) {
    transactions.value = result.value.transactions.results;
    totalCount.value = result.value.transactions.totalCount;
  }
})

function handlePagination(page: number) {
  pagination.offset = page * pagination.limit
  refetch()
}

</script>

<template>
  <div>
    <table class="table table-compact w-full text-sm">
      <thead>
        <tr>
          <th>Tx Hash</th>
          <th>Result</th>
          <th>Message</th>
          <th>Height</th>
          <th>Amount</th>
          <th>Fee</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(tx) in transactions" :key="tx.id">
          <td class="truncate text-link">
            <RouterLink :to="`/${props.chain}/tx/${tx.id}`">
              {{ shortenTxHash(tx.id) }}
            </RouterLink>
          </td>
          <td>Success</td>
          <td>
            <span class="bg-[rgba(180,183,187,0.10)] rounded px-2 py-[1px]">{{
              format.messages(tx.messages?.nodes.map((item: any) =>
                ({ "@type": item.type, typeUrl: item.type })
              )) }}</span>
          </td>
          <td class="truncate text-link">
            <RouterLink :to="`/${props.chain}/block/${tx.blockNumber}`">
              {{ tx.blockNumber }}
            </RouterLink>
          </td>
          <td>{{ tx.gasUsed }}</td>
          <!-- <td>{{ tx.fee[0]?.amount/10e6 }} {{ tx.fee[0]?.denom?.toUpperCase()}}</td> -->
          <td>0.000076 ORAI</td>
          <td>{{ format.toLocaleDate(new Date(Number(tx.timestamp))) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="text-center mt-4">
      <Pagination :totalItems="totalCount" :limit="pagination.limit" :onPagination="handlePagination" />
    </div>
  </div>
</template>
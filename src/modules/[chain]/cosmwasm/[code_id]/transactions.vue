<script lang="ts" setup>
import { fromUtf8 } from '@cosmjs/encoding';
import { JsonViewer } from 'vue3-json-viewer';
import DynamicComponent from '@/components/dynamic/DynamicComponent.vue';
import {
  useBaseStore,
  useBlockchain,
  useFormatter,
  useTxDialog,
} from '@/stores';
import { PageRequest } from '@/types';
import { onMounted, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useWasmStore } from '../WasmStore';
// if you used v1.0.5 or latster ,you should add import "vue3-json-viewer/dist/index.css"
import type { ExtraTxSearchResponse } from '@/libs/client';
import type { Coin } from '@cosmjs/stargate';
import type { QueryAllContractStateResponse } from 'cosmjs-types/cosmwasm/wasm/v1/query';
import type { ContractInfo } from 'cosmjs-types/cosmwasm/wasm/v1/types';
import 'vue3-json-viewer/dist/index.css';
import TransactionContractIndexs from '@/components/contracts/TransactionContractIndexs.vue';
import TransactionContractRpc from '@/components/contracts/TransactionContractRpc.vue';
import { CHAIN_INDEXS } from '@/constants';
import { decodeBuffer } from '@/libs/utils';

const props = defineProps(['chain'])
const chainStore = useBlockchain();
const wasmStore = useWasmStore();
const baseStore = useBaseStore();
const format = useFormatter();
const route = useRoute();
const pageRequest = ref(new PageRequest());

const txs = ref<ExtraTxSearchResponse>({ txs: [], totalCount: 0 });

const dialog = useTxDialog();
const info = ref({} as ContractInfo | undefined);
const state = ref({} as QueryAllContractStateResponse | undefined);
const selected = ref('');
const balances = ref({} as Coin[]);
const query = ref('');
const result = ref({});

const contractAddress = ref(String(route.query.contract));

watchEffect(() => {
  contractAddress.value = String(route.query.contract)
  const address = String(route.query.contract)
  wasmStore.wasmClient.getWasmContractInfo(address).then((x) => {
    info.value = x;
  });
})

onMounted(() => {
  const address = contractAddress.value;
  wasmStore.wasmClient.getWasmContractInfo(address).then((x) => {
    info.value = x;
  });
  // chainStore.rpc
  //   .getTxs(
  //     [
  //       {
  //         key: 'wasm._contract_address',
  //         value: address,
  //       },
  //     ],
  //     page.value
  //   )
  //   .then((res) => {
  //     txs.value = res;
  //   });
});

// function pageload(pageNum: number) {
//   page.value.setPage(pageNum);
//   const address = String(route.query.contract);
//   chainStore.rpc
//     .getTxs(
//       [
//         {
//           key: 'wasm._contract_address',
//           value: address,
//         },
//       ],
//       page.value
//     )
//     .then((res) => {
//       txs.value = res;
//     });
// }

function showFunds() {
  const address = String(route.query.contract);
  chainStore.rpc.getBankBalances(address).then((res) => {
    balances.value = res;
  });
}
function showState() {
  const address = String(route.query.contract);
  selected.value = address;
  pageloadState(1);
}

function pageloadState(p: number) {
  pageRequest.value.setPage(p);
  wasmStore.wasmClient
    .getWasmContractStates(selected.value, pageRequest.value)
    .then((x) => {
      state.value = x;
    });
}

function showQuery() {
  query.value = '';
  result.value = '';
}

function queryContract() {
  try {
    (
      selectedRadio.value === 'raw' ?
        wasmStore.wasmClient.getWasmContractRawQuery(contractAddress.value, query.value) :
        wasmStore.wasmClient.getWasmContractSmartQuery(contractAddress.value, query.value)
    ).then((x) => {
      const valueStr = fromUtf8(x.data);
      try {
        result.value = JSON.parse(valueStr);
      } catch (e) {
        result.value = valueStr;
      }
    })
      .catch((err) => {
        result.value = JSON.stringify(err.message);
      });
  } catch (err) {
    result.value = JSON.stringify(err); // not works for now
  }
  // TODO: show error in the result.
}

const radioContent = [
  {
    title: 'Raw Query',
    desc: 'Return raw result',
    value: 'raw',
  },
  {
    title: 'Smart Query',
    desc: 'Return structure result if possible',
    value: 'smart',
  },
];

const selectedRadio = ref('raw');
</script>
<template>
  <div class="p-5">
    <div class="bg-base-100 px-4 pt-3 pb-4 rounded mb-4 shadow">
      <h2 class="card-title truncate w-full">
        {{ $t('cosmwasm.contract_detail') }}
      </h2>
      <DynamicComponent :value="info" />
    </div>

    <div class="text-center mb-4">
      <RouterLink to="contracts"><span class="btn btn-xs text-xs mr-2"> Back </span>
      </RouterLink>
      <label @click="showFunds()" for="modal-contract-funds" class="btn btn-primary btn-xs text-xs mr-2">{{
        $t('cosmwasm.btn_funds') }}</label>
      <label class="btn btn-primary btn-xs text-xs mr-2" for="modal-contract-states" @click="showState()">
        {{ $t('cosmwasm.btn_states') }}
      </label>
      <label for="modal-contract-query" class="btn btn-primary btn-xs text-xs mr-2" @click="showQuery()">
        {{ $t('cosmwasm.btn_query') }}
      </label>
      <label for="wasm_execute_contract" class="btn btn-primary btn-xs text-xs mr-2" @click="
          dialog.open('wasm_execute_contract', { contract: contractAddress })
        ">
        {{ $t('cosmwasm.btn_execute') }}
      </label>

      <label for="wasm_migrate_contract" class="btn btn-primary btn-xs text-xs mr-2" @click="
          dialog.open('wasm_migrate_contract', { contract: contractAddress })
        ">
        {{ $t('cosmwasm.btn_migrate') }}
      </label>

      <label for="wasm_update_admin" class="btn btn-primary btn-xs text-xs mr-2"
        @click="dialog.open('wasm_update_admin', { contract: contractAddress })">
        {{ $t('cosmwasm.btn_update_admin') }}
      </label>

      <label for="wasm_clear_admin" class="btn btn-primary btn-xs text-xs mr-2"
        @click="dialog.open('wasm_clear_admin', { contract: contractAddress })">
        {{ $t('cosmwasm.btn_clear_admin') }}
      </label>
    </div>

    <div class="bg-base-100 px-4 pt-3 pb-4 rounded mb-4 shadow flex flex-col gap-4">

      <h2 class="card-title truncate w-full">
        Transaction
      </h2>
      <div class="w-full h-[1px] bg-[#242627] my-2"></div>
      <div v-if="CHAIN_INDEXS.includes(chain)">
        <TransactionContractIndexs :chain="chain" :address="contractAddress" />
      </div>
      <div v-else>
        <TransactionContractRpc :chain="chain" :address="contractAddress" />
      </div>
    </div>

    <!-- <div class="bg-base-100 px-4 pt-3 pb-4 rounded mb-4 shadow">
      <h2 class="card-title truncate w-full mt-4">Transactions</h2>
      <table class="table">
        <thead>
          <tr>
            <td>{{ $t('ibc.height') }}</td>
            <td>{{ $t('ibc.txhash') }}</td>
            <td>{{ $t('ibc.messages') }}</td>
            <td>{{ $t('ibc.time') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resp in txs?.txs">
            <td>{{ resp.height }}</td>
            <td>
              <div class="text-xs truncate text-primary dark:invert">
                <RouterLink
                  :to="`/${chainStore.chainName}/tx/${toHex(resp.hash)}`"
                  >{{ toHex(resp.hash) }}
                </RouterLink>
              </div>
            </td>
            <td>
              <div class="flex">
                {{ format.messages(resp.txRaw.body.messages) }}
                <Icon
                  v-if="resp.result.code === 0"
                  icon="mdi-check"
                  class="text-success text-lg"
                />
                <Icon v-else icon="mdi-multiply" class="text-error text-lg" />
              </div>
            </td>
            <td>{{ format.toLocaleDate(resp?.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :limit="page.limit"
        :total="txs.totalCount.toString()"
        :callback="pageload"
      />
    </div> -->

    <!-- <WasmVerification :contract="contractAddress" /> -->

    <div>
      <input type="checkbox" id="modal-contract-funds" class="modal-toggle" />
      <label for="modal-contract-funds" class="modal cursor-pointer">
        <label class="modal-box relative p-2" for="">
          <div>
            <div class="flex items-center justify-between px-3 pt-2">
              <div class="text-lg">{{ $t('cosmwasm.contract_balances') }}</div>
              <label for="modal-contract-funds" class="btn btn-sm btn-circle"
                >✕</label
              >
            </div>
            <ul class="menu mt-5">
              <li v-for="b in balances">
                <a class="flex justify-between"
                  ><span>{{ format.formatToken(b) }}</span> {{ b.amount }}
                </a>
              </li>
              <li v-if="balances.length === 0" class="my-10 text-center">
                {{ $t('cosmwasm.no_escrowed_assets') }}
              </li>
            </ul>
          </div>
        </label>
      </label>

      <input type="checkbox" id="modal-contract-states" class="modal-toggle" />
      <label for="modal-contract-states" class="modal cursor-pointer">
        <label class="modal-box !w-11/12 !max-w-5xl" for="">
          <div>
            <div class="flex items-center justify-between px-3 pt-2 mb-4">
              <div class="text-lg">{{ $t('cosmwasm.contract_states') }}</div>
              <label for="modal-contract-states" class="btn btn-sm btn-circle"
                >✕</label
              >
            </div>
            <div class="overflow-auto">
              <JsonViewer
                :value="
                  state?.models?.map((v) => ({
                    key: decodeBuffer(v.key),
                    value: decodeBuffer(v.value),
                  })) || []
                "
                :theme="baseStore.theme || 'dark'"
                style="background: transparent"
                copyable
                boxed
                sort
                :expand-depth="5"
              />
              <PaginationBar
                :limit="pageRequest.limit"
                :total="
                  state?.pagination?.total
                    ? state.pagination.total.toString()
                    : '0'
                "
                :callback="pageloadState"
              />
            </div>
          </div>
        </label>
      </label>

      <input type="checkbox" id="modal-contract-query" class="modal-toggle" />
      <label for="modal-contract-query" class="modal cursor-pointer">
        <label class="modal-box !w-11/12 !max-w-5xl" for="">
          <div>
            <div class="flex items-center justify-between px-3 pt-2 mb-4">
              <div class="text-lg font-semibold">
                {{ $t('cosmwasm.query_contract') }}
              </div>
              <label for="modal-contract-query" class="btn btn-sm btn-circle"
                >✕</label
              >
            </div>
            <div class="px-3">
              <div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div
                    class="form-control border rounded px-4"
                    v-for="(item, index) of radioContent"
                    :key="index"
                    :class="{ 'pt-2': index === 0 }"
                  >
                    <label
                      class="label cursor-pointer justify-start"
                      @click="selectedRadio = item?.value"
                    >
                      <input
                        type="radio"
                        name="radio-10"
                        class="radio radio-sm radio-primary mr-4"
                        :checked="item?.value === selectedRadio"
                        style="border: 1px solid #d2d6dc"
                      />
                      <div>
                        <div class="text-base font-semibold">
                          {{ item?.title }}
                        </div>
                        <div class="text-xs">{{ item?.desc }}</div>
                      </div>
                    </label>
                  </div>
                </div>
                <textarea
                  v-model="query"
                  placeholder="Query String, {}"
                  label="Query String"
                  class="my-2 textarea textarea-bordered w-full"
                />

                <JsonViewer
                  :value="result"
                  :theme="baseStore.theme"
                  style="background: transparent"
                  copyable
                  boxed
                  sort
                  :expand-depth="5"
                />
              </div>
              <div class="mt-4 mb-4 text-center">
                <button
                  class="btn btn-primary px-4 text-white"
                  @click="queryContract()"
                >
                  {{ $t('cosmwasm.query_contract') }}
                </button>
              </div>
            </div>
          </div>
        </label>
      </label>
    </div>
  </div>
</template>

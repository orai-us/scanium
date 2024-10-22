<script lang="ts" setup>
import { ref } from 'vue';

const TRANSACTION_TYPE = {
  ALL: "Transactions",
  QUERIES: "Queries",
  EXECUTES: "Executes",
  HISTORY: "History",
  STATES: "States"
}

const tabTransaction = ref(TRANSACTION_TYPE.ALL);

</script>

<template>
  <div class="box-content flex flex-col gap-4">
    <div class="tabs tabs-boxed customTabV2 bg-transparent mb-4 p-6 pb-0">
      <a v-for="(value) of TRANSACTION_TYPE" class="tab text-gray-400 capitalize !pb-3" :key="value"
        :class="{ 'tab-active': tabTransaction === value }" @click="tabTransaction = value">{{ value }}</a>
    </div>

    <div>
      <table class="table table-compact w-full text-sm">
        <thead>
          <tr>
            <th style="position: relative; z-index: 2">Hash</th>
            <th>Msgs</th>
            <th>Memo</th>
          </tr>
        </thead>
        <tbody>

        </tbody>
      </table>
    </div>
  </div>
</template>
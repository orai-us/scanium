<script lang="ts" setup>
import type { Block } from '@cosmjs/tendermint-rpc';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { computed, type PropType } from 'vue';
import { hashTx } from '@/libs';
import { useBlockchain, useFormatter } from '@/stores';
import type { DecodedTxRaw } from '@cosmjs/proto-signing';

const props = defineProps({
  value: { type: Object as PropType<Block> },
});

const txs = computed(() => {
  return (
    props.value?.txs?.map((x) => {
      const tx = {
        hash: hashTx(x),
        tx: {} as DecodedTxRaw,
      };
      try {
        // @ts-ignore
        tx.tx = decodeTxRaw(x);
      } catch { }

      return tx;
    }) || []
  );
});

const format = useFormatter();
const chain = useBlockchain();
</script>
<template>
  <div class="overflow-x-auto mt-4">
    <table class="table w-full" density="compact" v-if="txs?.length > 0">
      <thead>
        <tr>
          <th style="position: relative; z-index: 2">Hash</th>
          <th>Msgs</th>
          <th>Memo</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="item in txs">
          <td>
            <RouterLink :to="`/${chain.chainName}/tx/${item.hash}`" class="text-primary dark:invert">{{ item.hash }}
            </RouterLink>
          </td>
          <td>
            {{
              item.tx?.body
                ? format.messages(
                  item.tx?.body.messages.map((x: any) => ({ '@type': x.typeUrl }))
                )
                : ''
            }}
          </td>
          <td>{{ item.tx?.body?.memo }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center">No Transactions</div>
  </div>
</template>

<script lang="ts" setup>
import { useIBCModule } from '@/modules/[chain]/ibc/connStore';
import { useBlockchain, useDashboard } from '@/stores';
import ChainRegistryClient from '@ping-pub/chain-registry-client';
import { computed, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { State } from 'cosmjs-types/ibc/core/channel/v1/channel';

const props = defineProps(["commonIBCs"]);

const dashboardStore = useDashboard();
const ibcStore = useIBCModule();
const client = new ChainRegistryClient();
const chainStore = useBlockchain();

const route = useRoute();

const statusIbc = ref({} as any);
const channelObj = ref({} as any);

const ibcs = computed(() => {
  const originChain = route.params.chain?.toString().toLowerCase();
  return props.commonIBCs.map((ibc: any) => {
    let chainName = ibc.from;
    if (chainName === originChain) chainName = ibc.to;
    const path = ibc.path;
    const conf = dashboardStore.chains[chainName] || {};
    const logo = conf.logo;

    return {
      chainName: chainName.toUpperCase(),
      logo,
      path,
      ...ibc
    };
  });
});

watchEffect(async () => {
  for (let ibc of ibcs.value) {
    const path = ibc.path;
    const resIbcPathInfo = await client.fetchIBCPathInfo(path);
    const connId =
      resIbcPathInfo.chain_1.chain_name === chainStore.current?.prettyName ||
        chainStore.chainName
        ? resIbcPathInfo.chain_1.connection_id
        : resIbcPathInfo.chain_2.connection_id;
    let channels: Array<any> = [];
    let registryChannels = resIbcPathInfo.channels;
    try {
      const resIbcChannel = await chainStore.rpc.getIBCConnectionsChannels(connId);
      channels = [...registryChannels, ...resIbcChannel.channels];
    } catch (error) {
      channels = registryChannels;
    }

    const channelOpen = channels.filter((item: any) => item?.state === State.STATE_OPEN);
    const numChannelOpen = channelOpen?.length || 0;
    const channelWellKnown = channelOpen[0]?.channelId || "-";
    channelObj.value[ibc.chainName] = {
      channel: `${numChannelOpen}/${channels.length}`,
      channelWellKnown
    };

    let connection = null;
    try {
      const resIbcConnection = await chainStore.rpc.getIBCConnectionsById(connId);
      connection = resIbcConnection.connection;

    } catch (error) {
      console.log({ error });
    }
    statusIbc.value[ibc.chainName] = connection;
  }
});
</script>
<template>
  <div class="overflow-x-auto w-full">
    <table class="table w-full">
      <thead>
        <tr class="text-base text-white">
          <td>Chain</td>
          <td>Status</td>
          <td>Well-Known</td>
          <td>Channels</td>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(ibc, index) in ibcs" :key="index" @click="ibcStore.fetchConnection(ibc.path)">
          <td class="cursor-pointer">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full overflow-hidden dark:bg-white">
                <img :src="ibc.logo" />
              </div>
              <span>{{ ibc.chainName }}</span>
            </div>
          </td>
          <td>
            <div
              :class="{ 'text-[#39DD47]': statusIbc[ibc.chainName]?.state === State.STATE_OPEN, 'text-error': statusIbc[ibc.chainName]?.state !== State.STATE_OPEN }"
              class="inline-flex gap-2 whitespace-nowrap">
              <div class="text-center">
                {{ statusIbc[ibc.chainName]?.state !== State.STATE_OPEN ? 'Failed' : 'Open' }}
              </div>
            </div>
          </td>
          <td>
            <div
              :class="{ 'text-[#39DD47]': statusIbc[ibc.chainName]?.state === State.STATE_OPEN, 'text-error': statusIbc[ibc.chainName]?.state !== State.STATE_OPEN }"
              class="inline-flex gap-2 whitespace-nowrap">
              <div class="text-center">
                {{ channelObj[ibc.chainName]?.channelWellKnown }}
              </div>
            </div>
          </td>
          <td>
            {{ channelObj[ibc.chainName]?.channel }}
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

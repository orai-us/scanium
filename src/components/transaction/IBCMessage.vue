<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { select } from '../dynamic';
import { useBlockchain } from '@/stores';
import { formatNumber } from '@/utils';

const props = defineProps(['value', 'type']);
const data = ref({} as any);
const blockchain = useBlockchain();
const assets = blockchain.current?.assets;

const TOKEN_IBCS = [
  {
    base: "oraib0x55d398326f99059fF775485246999027B3197955",
    denom: "oraib0x55d398326f99059fF775485246999027B3197955",
    display: "USDT BSC",
    exponent: 18
  },
  {
    base: "oraib0xA325Ad6D9c92B55A3Fc5aD7e412B1518F96441C0",
    denom: "oraib0xA325Ad6D9c92B55A3Fc5aD7e412B1518F96441C0",
    display: "ORAI BSC",
    exponent: 18
  },
  {
    base: "oraib0x7e2A35C746F2f7C240B664F1Da4DD100141AE71F",
    denom: "oraib0x7e2A35C746F2f7C240B664F1Da4DD100141AE71F",
    display: "AIRI BSC",
    exponent: 18
  },
  {
    base: "oraib0x257a8d1E03D17B8535a182301f15290F11674b53",
    denom: "oraib0x257a8d1E03D17B8535a182301f15290F11674b53",
    display: "KWT BSC",
    exponent: 18
  },
  {
    base: "eth-mainnet0X4C11249814F11B9346808179CF06E71AC328C1B5",
    denom: "eth-mainnet0X4C11249814F11B9346808179CF06E71AC328C1B5",
    display: "ORAI ERC20",
    exponent: 18
  },
  {
    base: "uosmo",
    denom: "uosmo",
    display: "OSMO",
    exponent: 6
  },
]

watchEffect(async () => {
  const decoder = new TextDecoder('utf-8');
  const value = props.value;
  switch (props.type) {
    case "Update Client":
      data.value = {
        signer: props.value?.signer,
        clientId: props.value?.clientId,
      };
      break;
    case "Recv Packet":
    case "Acknowledgement":
      const packet = props.value?.packet;
      const dataPacket = packet?.data;
      const parseData = JSON.parse(decoder.decode(dataPacket));
      const amountOrigin = parseData?.amount;
      const originDenom = parseData?.denom;
      let newAssets = Array.isArray(assets) ? [...assets, ...TOKEN_IBCS] : TOKEN_IBCS;
      const asset = newAssets.find((asset: any) => asset.base === originDenom || (Array.isArray(asset.traces) && asset.traces[0]?.chain?.path === originDenom));
      let exponent = 0;
      if (asset) {
        // @ts-ignore
        const decimals = asset.exponent;
        const display = asset.display;
        if (decimals) {
          exponent = Number(decimals);
        } else {
          // @ts-ignore
          const denomUnits = asset.denom_units;
          if (Array.isArray(denomUnits)) {
            exponent = denomUnits.find((denomUnit: any) => denomUnit.denom === display)?.exponent;
          }
        }
      }
      let amount = formatNumber(Number(amountOrigin) / 10 ** exponent);
      const denomAmount =  asset?.display || originDenom;
      data.value = {
        sequence: formatNumber(packet?.sequence),
        amount: `${amount} ${denomAmount}`,
        originAmount: formatNumber(amountOrigin),
        originDenom,
        receiver: parseData?.receiver,
        sender: parseData?.sender,
        sourcePort: packet?.sourcePort,
        sourceChannel: packet?.sourceChannel,
        destinationPort: packet?.destinationPort,
        destinationChannel: packet?.destinationChannel,
        signer: props.value?.signer,
      };
      break;
    case "Transfer":
      data.value = {
        sender: value?.sender,
        receiver: value?.receiver,
        sourceChannel: value?.sourceChannel,
        port: value?.sourcePort,
        amount: value.token,
        originAmount: `${formatNumber(value.token?.amount)}`,
        originDenom: `${value.token?.denom}`,
      };
      break;
    default:
      break;
  }
})

</script>

<template>
  <Component :is="select(value)" :value="data"></Component>
</template>

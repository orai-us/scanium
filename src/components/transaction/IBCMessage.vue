<script lang="ts" setup>
import { ref, toRaw, watchEffect } from 'vue';
import { select } from '../dynamic';

const props = defineProps(['value', 'type']);
const data = ref({} as any);

function formatNumber(number: string | number, options = {}) {
  const result = Number(number);
  if (isNaN(result)) return "-";
  return result.toLocaleString("en-US", options);
}

watchEffect(() => {
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
      const amount = formatNumber(parseData?.amount);
      const denom = parseData?.denom;
      data.value = {
        sequence: formatNumber(packet?.sequence),
        amount: { amount: parseData?.amount, denom },
        originAmount: amount,
        originDenom: denom,
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

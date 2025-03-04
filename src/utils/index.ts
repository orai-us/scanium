import { LABELING_ADDRESS } from "@/constants";
import { tokenMap } from "@/libs/amm-v3";

export const shortenTxHash = (txHash: string) => {
  const prefixHash = txHash.slice(0, 6);
  const suffixHash = txHash.slice(-6);
  return `${prefixHash} . . . ${suffixHash}`;
};

export const labelInOutTxs = (txs: Array<any>, addAccount: string) => {
  return txs.map((item) => {
    let state = null;
    const nodes = item.messages?.nodes;
    if (Array.isArray(nodes)) {
      if (
        nodes[0]?.type === '/cosmos.bank.v1beta1.MsgSend' ||
        nodes[0]?.subType === 'send'
      ) {
        if (item.sender === addAccount) state = 'OUT';
        else state = 'IN';
      }
      if (nodes[0]?.type?.includes('ibc')) {
        const tokenTransfers = item.tokenTransfers?.nodes;
        if (Array.isArray(tokenTransfers)) {
          let numberTxOut = 0, numberTxIn = 0;
          numberTxOut = tokenTransfers.filter((item) => item.from === addAccount).length;
          numberTxIn = tokenTransfers.filter((item) => item.to === addAccount).length;
          if (numberTxOut > numberTxIn)
            state = 'OUT';
          else if(numberTxOut < numberTxIn)
            state = 'IN';
        }
      }
    }

    return {
      ...item,
      state,
    };
  });
}

export const shortenDenom = (denom: string) => {
  if (denom.length <= 10) return denom;
  const prefixHash = denom.slice(0, 10);
  const suffixHash = denom.slice(-10);
  return `${prefixHash} . . . ${suffixHash}`;
};

export function formatNumber(number: string | number) {
  const result = Number(number);
  if (result === 0 || result < 0.00001) return 0;
  if (isNaN(result)) return "-";
  if (Math.abs(result) < 1) {
    return result.toLocaleString("en-US", {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  }
  return result.toLocaleString("en-US");
}

export function labelingForAddress(address: string) {
  const tokenInfo = tokenMap[address];
  if (!!tokenInfo) return tokenInfo.coinDenom;
  if (LABELING_ADDRESS[address]) return LABELING_ADDRESS[address];
  return;
}

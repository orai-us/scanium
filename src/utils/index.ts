import { MAX_TOKEN } from "@/constants";

export const shortenTxHash = (txHash: string) => {
  const prefixHash = txHash.slice(0, 6);
  const suffixHash = txHash.slice(-6);
  return `${prefixHash} . . . ${suffixHash}`;
};

export const formatAmountToken = (formatToken: any) => {
  if (formatToken.denom === MAX_TOKEN.base) {
    const amount = formatToken.amount / Math.pow(10, MAX_TOKEN.exponent);
    return {
      denom: MAX_TOKEN.display,
      amount,
      amountDisplay: amount.toString(),
    };
  }
  return {
    ...formatToken,
    denom: formatToken.denom.substring(0, 10),
  };
};

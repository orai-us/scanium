export const shortenTxHash = (txHash: string) => {
  const prefixHash = txHash.slice(0, 6);
  const suffixHash = txHash.slice(-6);
  return `${prefixHash} . . . ${suffixHash}`;
};

export const shortenDenom = (denom: string) => {
  if (denom.length <= 10) return denom;
  const prefixHash = denom.slice(0, 10);
  const suffixHash = denom.slice(-10);
  return `${prefixHash} . . . ${suffixHash}`;
};

export const convertNewAssetToToken = (
  newAssets: Array<{ coingecko_id: string; display: string }>
) => {
  const token: any = {};
  for (let asset of newAssets) {
    token[asset.coingecko_id] = asset.display;
  }
  return token;
};

export function formatNumber(number: string | number) {
  const result = Number(number);
  if (isNaN(result)) return "-";
  if (Math.abs(result) < 1) {
    return result.toLocaleString("en-US", {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  }
  return result.toLocaleString("en-US");
}

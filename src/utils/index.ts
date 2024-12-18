export const shortenTxHash = (txHash: string) => {
  const prefixHash = txHash.slice(0, 6);
  const suffixHash = txHash.slice(-6);
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

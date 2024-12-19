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
          if (tokenTransfers.find((item: any) => item.from === addAccount))
            state = 'OUT';
          if (tokenTransfers.find((item: any) => item.to === addAccount))
            state = 'IN';
        }
      }
    }

    return {
      ...item,
      state,
    };
  });
};

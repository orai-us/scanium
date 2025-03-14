import { api, METHODS } from './api';

const baseUrlOraidex = 'https://tx-history-backend.oraidex.io';
const baseUrlOptimalQueriesScanium = 'https://api-optimal-queries.scanium.io';

export interface ParamsGetHistoryTxs {
  addrByNetworks: string;
  limit?: number;
  offset?: number;
}

export interface ParamsGetTx {
  page: number;
  limit: number;
}

const urlTxsHistory = "/v1/txs-history/";
export const getHistoryTxs = async (params: ParamsGetHistoryTxs) => {
  const config = {
    baseURL: baseUrlOraidex,
    url: urlTxsHistory,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

const urlTxsByAccount = "/v1/transaction/by-account";
export const getTxsByAccount = async (
  addressAcc: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsByAccount}/${addressAcc}`,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

export const countTxsByAccount = async (
  addressAcc: string,
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsByAccount}/${addressAcc}/count`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

const urlTxsByDenom = '/v1/transaction/by-denom';
export const getTxsByDenom = async (denom: string, params: ParamsGetTx) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsByDenom}/${denom}`,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

export const countTxsByDenom = async (denom: string) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsByDenom}/${denom}/count`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

const urlTxsOnContract = "/v1/transaction/on-contract";
export const getTxsOnContract = async (
  contract: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsOnContract}/${contract}`,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

export const countTxsOnContract = async(contract: string,)=>{
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsOnContract}/${contract}/count`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
}

export const mergeTxsOptimalAndIndexer = (
  txsOptimal: Array<any>,
  txsIndexer: Array<any>
) => {
  return txsOptimal?.map((txOptimal: any) => {
    const searchTx = txsIndexer?.find(
      (txIndexer: any) => txIndexer.id === txOptimal.id
    );
    const messages = searchTx?.messages;
    return {
      ...txOptimal,
      messages,
    };
  });
};

const urlTxsTokenTransfer = "/v1/token-transfer/by-account";
export const getTxsTokenTransfer = async (
  address: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsTokenTransfer}/${address}`,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

const urlTxsEvmByAccount = '/v1/evm-transaction/by-account';
export const getTxsEvmByAccount = async (
  address: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsEvmByAccount}/${address}`,
    method: METHODS.GET,
    params,
  };
  const res = await api.request(config);
  return res?.data;
};

export const countTxsEvmByAccount = async (address: string)=>{
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsEvmByAccount}/${address}/count`,
    method: METHODS.GET,
  }
  const res = await api.request(config);
  return res?.data;
}

const urlTxsEvmTokenTransfer = "/v1/evm-token-transfer";
export const getTxsEvmTokenTransfers = async (
  contractAddress: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsEvmTokenTransfer}`,
    method: METHODS.GET,
    params: {
      contractAddress,
      ...params
    }
  };
  const res = await api.request(config);
  return res?.data;
};

export const countTxsEvmTokenTransfers = async (contractAddress: string)=>{
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlTxsEvmTokenTransfer}/count`,
    method: METHODS.GET,
    params: {
      contractAddress
    }
  }
  const res = await api.request(config);
  return res?.data;
}

const urlEvmContract = '/v1/evm-contract';
export const getListEvmContract = async (
  address: string,
  params: ParamsGetTx
) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlEvmContract}`,
    method: METHODS.GET,
    params: {
      address,
      ...params,
    },
  };
  const res = await api.request(config);
  return res?.data;
};

export const countEvmContract = async (address: string) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlEvmContract}/count`,
    method: METHODS.GET,
    params: {
      address,
    },
  };
  const res = await api.request(config);
  return res?.data;
};

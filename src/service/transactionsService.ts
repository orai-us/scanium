import { api, METHODS } from './api';

const baseUrlOraidex = 'https://tx-history-backend.oraidex.io';
const baseUrlOptimalQueriesScanium = 'https://api-optimal-queries.scanium.io';

export interface ParamsGetHistoryTxs {
  addrByNetworks: string;
  limit?: number;
  offset?: number;
}

export interface ParamsGetTxsAccount {
  page: number;
  limit: number,
  count: boolean
}

const urlTxsHistory = "/v1/txs-history/"
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

const urlTxsByAccount = "/v1/transaction/by-account"
export const getTxsAccount = async (
  addressAcc: string,
  params: ParamsGetTxsAccount
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

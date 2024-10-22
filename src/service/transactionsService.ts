import { api, METHODS } from './api';

const baseUrlOraidex = import.meta.env.VITE_APP_BASE_URL_ORAIDEX;

export interface ParamsGetHistoryTxs {
  addrByNetworks: string;
  limit?: number;
  offset?: number;
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

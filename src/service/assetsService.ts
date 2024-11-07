import { api, METHODS } from './api';

const baseMarketOrai = 'https://price.market.orai.io';
const baseLcdOraiBank = 'https://lcd.orai.io/cosmos/bank';
const baseCosmwasm = 'https://lcd.orai.io/cosmwasm/wasm'
export interface ParamsSimplePrice {
  ids: string;
}
const simplePrice = '/simple/price';

export const getPriceByIds = async (params: ParamsSimplePrice) => {
  const config = {
    baseURL: baseMarketOrai,
    url: simplePrice,
    method: METHODS.GET,
    params: {
      ...params,
      vs_currencies: 'usd',
    },
  };
  const res = await api.request(config);
  return res?.data;
};

const urlBalances = '/v1beta1/balances';
export const getBalancesByAddessAccount = async (address: string) => {
  const config = {
    baseURL: baseLcdOraiBank,
    url: `${urlBalances}/${address}`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

const urlSmartContract = '/v1/contract';
export const getSmartQueryByContract = async (
  addressContract: string,
  query_data: string
) => {
  const config = {
    baseURL: baseCosmwasm,
    url: `${urlSmartContract}/${addressContract}/smart/${query_data}`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};
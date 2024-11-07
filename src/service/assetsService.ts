import { api, METHODS } from './api';

const baseMarketOrai = 'https://price.market.orai.io';
const baseLcdOraiBank = 'https://lcd.orai.io/cosmos/bank';
const baseCosmwasm = 'https://lcd.orai.io/cosmwasm/wasm';
const multiCallContractAddress = 'orai1q7x644gmf7h8u8y6y8t9z9nnwl8djkmspypr6mxavsk9ual7dj0sxpmgwd';
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
  queryData: string
) => {
  const config = {
    baseURL: baseCosmwasm,
    url: `${urlSmartContract}/${addressContract}/smart/${queryData}`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

export const getCw20Balances= async(address: string, denoms: Array<string>)=>{
  const multiCallUrl = `${urlSmartContract}/${multiCallContractAddress}/smart/`;
  const msgJson = {
    aggregate: {
      queries: denoms.map((denom) => ({
        address: denom,
        data: btoa(JSON.stringify({ balance: { address } })),
      })),
    },
  };
  const url = multiCallUrl + btoa(JSON.stringify(msgJson));
  const config = {
    baseURL: baseCosmwasm,
    url,
    method: METHODS.GET
  };

  const res = await api.request(config);
  return res?.data;
}


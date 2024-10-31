import { api, METHODS } from './api';

const baseMarketOrai = 'https://price.market.orai.io';

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

import { api, METHODS } from './api';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc';
import { QueryClient, setupBankExtension } from '@cosmjs/stargate';
import {
  QueryDenomOwnersRequest,
  QueryDenomOwnersResponse,
} from 'cosmjs-types/cosmos/bank/v1beta1/query';

const baseMarketOrai = 'https://price.market.orai.io';
const baseCoingecko = 'https://api.coingecko.com/api/v3';
const baseLcdOraiBank = 'https://lcd.orai.io/cosmos/bank';
const baseCosmwasm = 'https://lcd.orai.io/cosmwasm/wasm';
const multiCallContractAddress =
  'orai1q7x644gmf7h8u8y6y8t9z9nnwl8djkmspypr6mxavsk9ual7dj0sxpmgwd';
const baseURLScanium = 'https://api-services.scanium.io';
const baseURLOraidex = 'https://api.oraidex.io'
const urlBalancesCw20 = 'v1/balance';
export interface ParamsSimplePrice {
  ids: string;
}

export interface ParamsHolderAssetsCw20 {
  page: number;
  limit: number;
  cw20Address: string;
  address: string
}
const simplePrice = '/simple/price';
const coinsMarket = '/coins/markets';

export const getPriceByIds = async (params: ParamsSimplePrice) => {
  const config = {
    baseURL: baseMarketOrai,
    url: simplePrice,
    method: METHODS.GET,
    params: {
      ...params,
      vs_currencies: 'usd',
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: true,
      include_last_updated_at: true,
    },
  };
  const res = await api.request(config);
  return res?.data;
};

export const getInfoToken = async (params: ParamsSimplePrice) => {
  const config = {
    baseURL: baseCoingecko,
    url: coinsMarket,
    method: METHODS.GET,
    params: {
      ...params,
      vs_currency: 'usd',
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

export const getCw20Balances = async (
  address: string,
  denoms: Array<string>
) => {
  try {
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
      method: METHODS.GET,
    };

    const res = await api.request(config);
    return res?.data;
  } catch (error) {
    console.log({ error });
  }
};

const LIST_ASSETS_DISABLE = [
  'orai1nd4r053e3kgedgld2ymen8l9yrw8xpjyaal7j5', // kawaii-islands
  'orai1gzvndtzceqwfymu2kqhta2jn6gmzxvzqwdgvjw', // milky-token
]

export const getListAssetOfOraichain = async()=>{
  try {
    const config = {
      baseURL: 'https://oraicommon.oraidex.io/api/v1',
      url: 'chains/Oraichain',
      method: METHODS.GET,
    };
    const res = await api.request(config);
    const assets = res.data?.currencies?.filter((item: any) => !LIST_ASSETS_DISABLE.includes(item.contractAddress));
    return assets;
  } catch (error) {
    console.log({ error });
    return []
  }
}

export const transformAssetsFromRegister = (asset: Array<any>) => {
  return asset.map((item) => {
    const description = item.description;
    const denomUnits = item.denomUnits;
    let coinDenom = item.display;
    let coinDecimals = 6;
    if (Array.isArray(denomUnits)) {
      const denomUnit = denomUnits[1];
      if (denomUnit) {
        coinDenom = denomUnit.denom;
        coinDecimals = denomUnit.exponent;
      }
    }
    const coinMinimalDenom = item.base;
    const coinGeckoId = item.coingecko_id;
    const coinImageUrl = item.logo_URIs?.png;
    return {
      description,
      coinDenom,
      coinDecimals,
      coinMinimalDenom,
      coinGeckoId,
      coinImageUrl,
    };
  });
};

export const getHolderAssetsNativeToken = async (pagination: any, denom: string, endpointAddress: string) => {
  try {
    const { offset, limit } = pagination;
    const cometClient = await Tendermint37Client.connect(endpointAddress);
    const queryClient = QueryClient.withExtensions(
      cometClient as any,
      setupBankExtension
    );
    const requestData = Uint8Array.from(
      QueryDenomOwnersRequest.encode(
        QueryDenomOwnersRequest.fromPartial({
          denom: denom,
          pagination: { offset: BigInt(offset), limit: BigInt(limit), countTotal: true },
        })
      ).finish()
    );
    const { value } = await queryClient.queryAbci(
      '/cosmos.bank.v1beta1.Query/DenomOwners',
      requestData
    );
    const res = QueryDenomOwnersResponse.decode(value);
    return res;
  } catch (error) {
    console.log({ error });
    return { denomOwners: [], pagination: { total: 0 } };
  }
};

export const getHolderAssetsCw20 = async (params: ParamsHolderAssetsCw20) => {
  const config = {
    baseURL: baseURLScanium,
    url: `${urlBalancesCw20}/${params.cw20Address}`,
    method: METHODS.GET,
    params: {
      page: params.page,
      limit: params.limit,
      address: params.address,
    },
  };
  const res = await api.request(config);
  return res?.data;
};

export const getPricePoolTokens = async () => {
  const config = {
    baseURL: baseURLOraidex,
    url: 'prices/pool-tokens',
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

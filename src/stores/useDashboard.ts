import { defineStore } from 'pinia';
import { get } from '../libs/http';
import type { Chain, Asset } from '@ping-pub/chain-registry-client/dist/types';
import { useBlockchain } from './useBlockchain';
import { getListAssetOfOraichain } from '@/service/assetsService';
import { NETWORK_TYPE } from '@/config';

export enum EndpointType {
  rpc,
  rest,
  grpc,
  // webgrpc
}

export interface Endpoint {
  type?: EndpointType;
  address: string;
  provider: string;
}

// Chain config structure of cosmos.directory
export interface DirectoryChain {
  assets: Asset[];
  bech32_prefix: string;
  best_apis: {
    rest: Endpoint[];
    rpc: Endpoint[];
    grpc: Endpoint[];
  };
  chain_id: string;
  chain_name: string;
  pretty_name: string;
  coingecko_id: string;
  cosmwasm_enabled: boolean;
  decimals: number;
  denom: string;
  display: string;
  explorers:
    | {
        name?: string | undefined;
        kind?: string | undefined;
        url?: string | undefined;
        tx_page?: string | undefined;
        account_page?: string | undefined;
      }[]
    | undefined;
  height: number;
  image: string;
  name: string;
  network_type: string;
  symbol: string;
  versions?: {
    application_version: string;
    cosmos_sdk_version: string;
    tendermint_version: string;
  };
}

export interface ChainConfig {
  chainName: string;
  prettyName: string;
  cosmwasmEnabled: boolean;
  bech32Prefix: string;
  chainId: string;
  coinType: string;
  assets: Asset[];
  themeColor?: string;
  features?: string[];
  endpoints: {
    rpc?: Endpoint[];
    rest?: Endpoint[];
    grpc?: Endpoint[];
  };
  logo: string;
  versions: {
    application?: string;
    cosmosSdk?: string;
    tendermint?: string;
  };
  exponent: string;
  excludes?: string;
  providerChain: {
    api: Endpoint[];
  };
  // keplr config
  keplrFeatures?: string[];
  keplrPriceStep?: {
    low: number;
    average: number;
    high: number;
  };
}

export interface LocalConfig {
  addr_prefix: string;
  alias: string;
  api: string[] | Endpoint[];
  rpc: string[] | Endpoint[];
  grpc: string[] | Endpoint[];
  provider_chain: {
    api: string[] | Endpoint[];
  };
  assets: {
    base: string;
    coingecko_id: string;
    exponent: string;
    logo: string;
    symbol: string;
  }[];
  chain_name: string;
  coin_type: string;
  logo: string;
  theme_color?: string;
  min_tx_fee: string;
  cosmwasm_enabled: boolean;
  sdk_version: string;
  registry_name?: string;
  features?: string[];
  keplr_price_step?: {
    low: number;
    average: number;
    high: number;
  };
  keplr_features: string[];
}

function apiConverter(api: any[]) {
  if (!api) return [];
  const array = typeof api === 'string' ? [api] : api;
  return array.map((x) => {
    if (typeof x === 'string') {
      const parts = String(x).split('.');
      return {
        address: x,
        provider: parts.length >= 2 ? parts[parts.length - 2] : x,
      };
    } else {
      return x as Endpoint;
    }
  });
}

export function fromLocal(lc: LocalConfig, chainName: string): ChainConfig {
  const conf = {} as ChainConfig;
  let assets = lc.assets.map((x) => ({
    name: x.base,
    base: x.base,
    display: x.symbol,
    symbol: x.symbol,
    logo_URIs: { svg: x.logo },
    coingecko_id: x.coingecko_id,
    exponent: x.exponent,
    denom_units: [
      { denom: x.base, exponent: 0 },
      { denom: x.symbol, exponent: Number(x.exponent) },
    ],
  }));
  conf.assets = assets;
  conf.cosmwasmEnabled = lc.cosmwasm_enabled ?? false;
  conf.versions = {
    cosmosSdk: lc.sdk_version,
  };
  conf.bech32Prefix = lc.addr_prefix;
  conf.chainName = lc.chain_name;
  conf.coinType = lc.coin_type;
  conf.prettyName = lc.registry_name || lc.chain_name;
  conf.endpoints = {
    rpc: apiConverter(lc.rpc),
    rest: apiConverter(lc.api),
    grpc: apiConverter(lc.grpc),
  };

  if (lc.provider_chain) {
    conf.providerChain = {
      api: apiConverter(lc.provider_chain.api),
    };
  }
  conf.features = lc.features;
  conf.logo = lc.logo;
  conf.keplrFeatures = lc.keplr_features;
  conf.keplrPriceStep = lc.keplr_price_step;
  conf.themeColor = lc.theme_color;
  return conf;
}

// export function fromDirectory(source: DirectoryChain): ChainConfig {
//   const conf = {} as ChainConfig;
//   conf.cosmwasmEnabled = source.cosmwasm_enabled ?? false;

//   (conf.assets = source.assets),
//     (conf.bech32Prefix = source.bech32_prefix),
//     (conf.chainId = source.chain_id),
//     (conf.chainName = source.chain_name),
//     (conf.prettyName = source.pretty_name),
//     (conf.versions = {
//       application: source.versions?.application_version || '',
//       cosmosSdk: source.versions?.cosmos_sdk_version || '',
//       tendermint: source.versions?.tendermint_version || '',
//     }),
//     (conf.logo = pathConvert(source.image));
//   conf.endpoints = source.best_apis;
//   return conf;
// }

export function assetFromDirectory(source: any): Asset[] {
  let assets = source?.assets.map((x: any) => ({
    name: x.denom,
    base: x.denom,
    display: x.symbol,
    symbol: x.symbol,
    logo_URIs: x.logo_URIs,
    coingecko_id: x.coingecko_id,
    exponent: x.decimals,
    denom_units: x.denom_units,
    description: x.description,
  }));
  return assets;
}

function pathConvert(path: string | undefined) {
  if (path) {
    path = path.replace(
      'https://raw.githubusercontent.com/cosmos/chain-registry/master',
      'https://registry.ping.pub'
    );
  }
  return path || '';
}

export function getLogo(
  conf:
    | {
        svg?: string;
        png?: string;
        jpeg?: string;
      }
    | undefined
) {
  if (conf) {
    return pathConvert(conf.svg || conf.png || conf.jpeg);
  }
  return undefined;
}

function createChainFromDirectory(source: DirectoryChain): Chain {
  const conf: Chain = {} as Chain;
  conf.apis = source.best_apis;
  conf.bech32_prefix = source.bech32_prefix;
  conf.chain_id = source.chain_id;
  conf.chain_name = source.chain_name;
  conf.explorers = source.explorers;
  conf.pretty_name = source.pretty_name;
  if (source.versions) {
    conf.codebase = {
      recommended_version: source.versions.application_version,
      cosmos_sdk_version: source.versions.cosmos_sdk_version,
      tendermint_version: source.versions.tendermint_version,
    };
  }
  if (source.image) {
    conf.logo_URIs = {
      svg: source.image,
    };
  }
  return conf;
}

export enum LoadingStatus {
  Empty,
  Loading,
  Loaded,
}
export enum NetworkType {
  Mainnet,
  Testnet,
}
export enum ConfigSource {
  MainnetCosmosDirectory = 'https://chains.cosmos.directory',
  TestnetCosmosDirectory = 'https://chains.testcosmos.directory',
  Local = 'local',
}

export const useDashboard = defineStore('dashboard', {
  state: () => {
    const favMap = JSON.parse(
      localStorage.getItem('favoriteMap') ||
        '{"Oraichain":true, "OraiBridge":true, "cosmos":true, "osmosis":true, "injective":true }'
    );
    return {
      status: LoadingStatus.Empty,
      source: ConfigSource.MainnetCosmosDirectory,
      networkType: NETWORK_TYPE,
      favoriteMap: favMap as Record<string, boolean>,
      chains: {} as Record<string, ChainConfig>,
      prices: {} as Record<string, any>,
      coingecko: {} as Record<
        string,
        { coinId: string; exponent: number; symbol: string }
      >,
    };
  },
  getters: {
    length(): number {
      return Object.keys(this.chains).length;
    },
  },
  actions: {
    async initial() {
      await this.loadingFromLocal();
      await this.loadingAssetsFromRegistry();
      await this.loadingAssetsFromOraiSDK();
    },
    loadingPrices() {
      const coinIds = [] as string[];
      const keys = Object.keys(this.chains); // load all blockchain
      // Object.keys(this.favoriteMap) //only load favorite once it has too many chains
      keys.forEach((k) => {
        if (this.chains[k])
          this.chains[k].assets.forEach((a) => {
            if (a.coingecko_id !== undefined && a.coingecko_id.length > 0) {
              coinIds.push(a.coingecko_id);
              a.denom_units.forEach((u) => {
                this.coingecko[u.denom] = {
                  coinId: a.coingecko_id || '',
                  exponent: u.exponent,
                  symbol: a.symbol,
                };
              });
            }
          });
      });

      const currencies = ['usd, cny']; // usd,cny,eur,jpy,krw,sgd,hkd
      get(
        `https://api.coingecko.com/api/v3/simple/price?include_24hr_change=true&vs_currencies=${currencies.join(
          ','
        )}&ids=${coinIds.join(',')}`
      ).then((x) => {
        this.prices = x;
      });
    },
    async loadingAssetsFromRegistry() {
      if (this.status === LoadingStatus.Empty) {
        this.status = LoadingStatus.Loading;
        const res = await get(this.source);
        res.chains.forEach((x: DirectoryChain) => {
          let chainName = x?.chain_name;
          if (chainName !== 'oraichain') {
            if (this.chains[chainName]) {
              const assetsRegistry = assetFromDirectory(x);
              const assetsOnLocal = this.chains[chainName].assets;
              const result = assetsRegistry;
              assetsOnLocal.forEach((x) => {
                if (!assetsRegistry.find((item) => item.base === x.base)) {
                  result.push(x);
                }
              });
              this.chains[chainName].assets = result;
            }
          }
        });
      }
    },
    async loadingFromLocal() {
      if (window.location.hostname.search('testnet') > -1) {
        this.networkType = NetworkType.Testnet;
      }
      // const assetOfOraichain = await getListAssetOfOraichain();
      const source: Record<string, LocalConfig> =
        this.networkType === NetworkType.Mainnet
          ? import.meta.glob('../../chains/mainnet/*.json', { eager: true })
          : import.meta.glob('../../chains/testnet/*.json', { eager: true });
      Object.values<LocalConfig>(source).forEach((x: LocalConfig) => {
        this.chains[x.chain_name] = fromLocal(x, x.chain_name);
      });

      this.setupDefault();
      // this.status = LoadingStatus.Loaded;
    },
    async loadingAssetsFromOraiSDK() {
      const assetOfOraichain = await getListAssetOfOraichain();
      let assets = [];
      const assetsOnOraiChains = this.chains['Oraichain'].assets;
      if (Array.isArray(assetOfOraichain)) {
        for (let item of assetOfOraichain) {
          let base = item.coinMinimalDenom;
          const type = item.type;
          if (type === 'cw20') base = item.contractAddress;
          const asset = {
            name: item.coinMinimalDenom === 'orai' ? 'orai' : item.coinDenom,
            base,
            display: item.coinDenom,
            symbol: item.coinDenom,
            logo_URIs: {
              svg: item.coinImageUrl,
            },
            coingecko_id: item.coinGeckoId,
            exponent: item.coinDecimals,
            denom_units: [
              {
                denom: item.coinMinimalDenom,
                exponent: 0,
              },
              {
                denom: item.coinDenom,
                exponent: item.coinDecimals,
              },
            ],
            type_asset: type,
          };
          assets.push(asset);
        }
      }
      if (Array.isArray(assetsOnOraiChains)) {
        assetsOnOraiChains.forEach((x) => {
          if (!assets.find((item) => item.base === x.base)) {
            assets.push(x);
          }
        });
      }
      const oraiAsset = assets.find((item) => item.base === 'orai');
      let assetResult = assets.filter((item) => item.base !== 'orai');
      if (!!oraiAsset)
        assetResult = [
          oraiAsset,
          ...assets.filter((item) => item.base !== 'orai'),
        ];
      this.chains['Oraichain'].assets = assetResult;
      this.status = LoadingStatus.Loaded;
    },
    async loadLocalConfig(network: NetworkType) {
      const config: Record<string, ChainConfig> = {};
      const source: Record<string, LocalConfig> =
        network === NetworkType.Mainnet
          ? import.meta.glob('../../chains/mainnet/*.json', { eager: true })
          : import.meta.glob('../../chains/testnet/*.json', { eager: true });
      Object.values<LocalConfig>(source).forEach((x: LocalConfig) => {
        config[x.chain_name] = fromLocal(x, x.chain_name);
      });
      return config;
    },
    setupDefault() {
      if (this.length > 0) {
        const blockchain = useBlockchain();
        const keys = Object.keys(this.favoriteMap);
        for (let i = 0; i < keys.length; i++) {
          if (
            !blockchain.chainName &&
            this.chains[keys[i]] &&
            this.favoriteMap[keys[i]]
          ) {
            blockchain.setCurrent(keys[i]);
            break;
          }
        }
        if (!blockchain.chainName) {
          const [first] = Object.keys(this.chains);
          blockchain.setCurrent(first);
        }
        this.loadingPrices();
      }
    },
    setConfigSource(newSource: ConfigSource) {
      this.source = newSource;
      this.initial();
    },
  },
});

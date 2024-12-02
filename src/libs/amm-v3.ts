export enum DENOM {
  ORAI = 'orai',
  ATOM = 'ibc/A2E2EEC9057A4A1C2C0A6A4C78B0239118DF5F278830F50B4A6BDD7A66506B78',
  NTMPI = 'ibc/576B1D63E401B6A9A071C78A1D1316D016EC9333D2FEB14AD503FAC4B8731CD1',
  AIRI = 'orai10ldgzued6zjp0mkqwsv2mux3ml50l97c74x8sg',
  USDT = 'orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh',
  USDC = 'orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd',
  IBC_OSMO = 'ibc/9C4DCD21B48231D0BC2AC3D1B74A864746B37E4292694C93C617324250D002FC',
  ORAIX = 'orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge',
  scORAI = 'orai1065qe48g7aemju045aeyprflytemx7kecxkf5m7u5h5mphd0qlcs47pclp',
  wTRX = 'orai1c7tpjenafvgjtgm9aqwm7afnke6c56hpdms8jc6md40xs3ugd0es5encn0',
  scATOM = 'orai19q4qak2g3cj2xc2y3060t0quzn3gfhzx08rjlrdd3vqxhjtat0cq668phq',
  INJ = 'orai19rtmkk6sn4tppvjmp5d5zj6gfsdykrl5rw2euu5gwur3luheuuusesqn49',
  WETH = 'orai1dqa52a7hxxuv8ghe7q5v0s36ra0cthea960q2cukznleqhk0wpnshfegez',
  BTC = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc',
  OCH = 'orai1hn8w33cqvysun2aujk5sv33tku4pgcxhhnsxmvnkfvdxagcx0p8qa4l98q',
  TON = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton',
  PEPE = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/extPEPE',
  DOGE = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/DogeBNB',
  WSOL = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/oraib0x4VH72cCsNwZwLtHtBnXuCxHWf4mB',
  // IBC_INJ = 'ibc/49D820DFDE9F885D7081725A58202ABA2F465CAEE4AFBC683DFB79A8E013E83E',
  // BEP20 KWT= 'ibc/4F7464EEE736CCFB6B444EB72DE60B3B43C0DD509FFA2B87E05D584467AAE8C8';
  // KWT= 'orai1nd4r053e3kgedgld2ymen8l9yrw8xpjyaal7j5';
  // BEP20 MILKY= 'ibc/E12A2298AC40011C79F02F26C324BD54DF20F4B2904CB9028BFDEDCFAA89B906';
  // MILKY= 'orai1gzvndtzceqwfymu2kqhta2jn6gmzxvzqwdgvjw';
  // BTC.legacy= 'usat';
  // CAT = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/extCAT',
  // HMSTR = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/HMSTR',
}

export const tokenMap = {
  [DENOM.ORAI as string]: { coinDenom: 'ORAI', coinDecimals: 6 },
  [DENOM.ATOM as string]: { coinDenom: 'ATOM', coinDecimals: 6 },
  [DENOM.NTMPI as string]: { coinDenom: 'NTMPI', coinDecimals: 6 },
  [DENOM.AIRI as string]: { coinDenom: 'AIRI', coinDecimals: 6 },
  [DENOM.USDT as string]: { coinDenom: 'USDT', coinDecimals: 6 },
  [DENOM.USDC as string]: { coinDenom: 'USDC', coinDecimals: 6 },
  [DENOM.IBC_OSMO as string]: { coinDenom: 'OSMO', coinDecimals: 6 },
  [DENOM.ORAIX as string]: { coinDenom: 'ORAIX', coinDecimals: 6 },
  [DENOM.scORAI as string]: { coinDenom: 'scORAI', coinDecimals: 6 },
  [DENOM.wTRX as string]: { coinDenom: 'WTRX', coinDecimals: 6 },
  [DENOM.scATOM as string]: { coinDenom: 'scATOM', coinDecimals: 6 },
  [DENOM.INJ as string]: { coinDenom: 'INJ', coinDecimals: 6 },
  [DENOM.WETH as string]: { coinDenom: 'WETH', coinDecimals: 6 },
  [DENOM.BTC as string]: { coinDenom: 'BTC', coinDecimals: 14 },
  [DENOM.OCH as string]: { coinDenom: 'OCH', coinDecimals: 6 },
  [DENOM.TON as string]: { coinDenom: 'TON', coinDecimals: 9 },
  [DENOM.PEPE as string]: { coinDenom: 'PEPE', coinDecimals: 6 },
  [DENOM.DOGE as string]: { coinDenom: 'PEPE', coinDecimals: 8 },
  [DENOM.WSOL as string]: { coinDenom: 'TON', coinDecimals: 9 },
};

export const contractAddress = 'orai10s0c75gw5y5eftms5ncfknw6lzmx0dyhedn75uz793m8zwz4g8zq4d9x9a';

interface PoolKey {
  token_x: string;
  token_y: string;
  fee_tier: {
    fee: number;
    tick_spacing: number;
  };
}

export function toDecimal(amount: string | bigint | number, decimal: number) {
  return amount
    .toString()
    .padStart(decimal, '0')
    .replace(new RegExp(`(.{${decimal}})$`), '.$1')
    .replace(/^\./, '0.')
    .replace(/\.?0+$/, '');
}

function parsePoolKey(poolKeyStr: string): PoolKey {
  const [token_x, token_y, fee, tick_spacing] = poolKeyStr.split('-');
  return {
    token_x,
    token_y,
    fee_tier: {
      fee: +fee,
      tick_spacing: +tick_spacing,
    },
  };
}

export function displayPoolName(poolKey: any) {
  if (!poolKey) return poolKey;
  let tmpPoolKey = poolKey;
  if (typeof poolKey === 'string') {
    tmpPoolKey = parsePoolKey(poolKey);
  }
  return `${tokenMap[tmpPoolKey.token_x].coinDenom}-${
    tokenMap[tmpPoolKey.token_y].coinDenom
  } ${toDecimal(tmpPoolKey.fee_tier.fee, 10)}%`;
}

export function tickToDecimalPrice(
  tick: number,
  decimalX: number,
  decimalY: number
) {
  return 1.0001 ** tick * 10 ** (decimalX - decimalY);
}

export function displayTickPrice(tick: number, poolKey: string) {
  if (tick === undefined) return '';
  const tmpPoolKey = parsePoolKey(poolKey);
  const tokenX = tokenMap[tmpPoolKey.token_x];
  const tokenY = tokenMap[tmpPoolKey.token_y];

  return `${tokenX.coinDenom}/${tokenY.coinDenom} = ${tickToDecimalPrice(
    tick,
    tokenX.coinDecimals,
    tokenY.coinDecimals
  )}`;
}

export function displayListAssets(amounts: Array<string>, denoms: Array<string>) {
  return denoms
    .map((d, idx) => {
      const token = tokenMap[d];
      return `${toDecimal(amounts[idx], token.coinDecimals)} ${
        token.coinDenom
      }`;
    })
    .join(', ');
}

export function displayFee(fee: Array<string>, poolKey: string) {
  const tmpPoolKey = parsePoolKey(poolKey);
  return displayListAssets(fee, [tmpPoolKey.token_x, tmpPoolKey.token_y]);
}

export function displayIncentives(amountsStr: string, denomsStr: string) {
  if (!amountsStr) return 'None';
  const amounts = amountsStr.split(',');
  const denoms = denomsStr.split(',');
  return displayListAssets(amounts, denoms);
}

export function displayTokenOut(amounts: Array<string>, poolKey: string) {
  if (!amounts || !amounts[0]) return '';
  const tmpPoolKey = parsePoolKey(poolKey);
  return displayListAssets(amounts, [tmpPoolKey.token_x, tmpPoolKey.token_y]);
}

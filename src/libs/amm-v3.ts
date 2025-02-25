import { useBlockchain } from "@/stores";
import { formatNumber } from "@/utils";

const chainStore = useBlockchain();

function createTokenMap() {
  const result = {};
  const assets = chainStore.current?.assets;
  if (Array.isArray(assets)) {
    assets.forEach((asset) => {
      // @ts-ignore
      result[asset.base] = { coinDenom: asset.display, coinDecimals: asset.exponent };
    });
  }
  return result;
}

export const tokenMap: any = createTokenMap();

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

  const tokenX = tokenMap[tmpPoolKey.token_x] || { coinDenom: tmpPoolKey.token_x };
  const tokenY = tokenMap[tmpPoolKey.token_y] || { coinDenom: tmpPoolKey.token_y };

  return tmpPoolKey.fee_tier?.fee
    ? `${tokenX.coinDenom}-${tokenY.coinDenom} ${toDecimal(tmpPoolKey.fee_tier.fee, 10)}%`
    : `${tokenX.coinDenom}-${tokenY.coinDenom}`;
}

export function tickToDecimalPrice(
  tick: number,
  decimalX: number,
  decimalY: number
) {
  return 1.0001 ** tick * 10 ** (decimalX - decimalY);
}

export function displayTickPrice(tick: number, poolKey: any) {
  if (tick === undefined) return '';
  let tmpPoolKey = poolKey; //tx: 690bd1d70861fc1856476975718bcf466a13c299b6ca87bae34e5cfa08616dd6
  if(typeof poolKey === "string"){
    tmpPoolKey = parsePoolKey(poolKey);
  }
  const tokenX = tokenMap[tmpPoolKey.token_x] || {coinDenom: tmpPoolKey.token_x, coinDecimals: 6};
  const tokenY = tokenMap[tmpPoolKey.token_y] || {coinDenom: tmpPoolKey.token_x, coinDecimals: 6};

  return `${tokenX.coinDenom}/${tokenY.coinDenom} = ${tickToDecimalPrice(
    tick,
    tokenX.coinDecimals,
    tokenY.coinDecimals
  )}`;
}

export function displayListAssets(amounts: Array<string>, denoms: Array<string>) {
  return denoms
    .map((d, idx) => {
      const token = tokenMap[d] || {coinDenom: d, coinDecimals: 6};
      return `${formatNumber(toDecimal(amounts[idx], token.coinDecimals))} ${
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

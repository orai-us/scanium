import { formatNumber } from '@/utils';
import { displayListAssets, displayPoolName, tokenMap } from './amm-v3';
import { getDeepestObject } from './utils';

export enum TypeMessage {
  EXECUTE_SWAP_OPERATIONS = 'execute_swap_operations',
  SWAP_AND_ACTION = 'swap_and_action',
  SWAP_NONE_AMM_V3 = 'swap',
  CREATE_SWAP_ORDER = 'create_swap_order',
  UPDATE_MINIMUM_SWAP_AMOUNT = 'update_minimum_swap_amount',
}

export function displayMessageSwap(
  action: TypeMessage,
  messages: Array<any>,
  params: any,
  sender: string
) {
  switch (action) {
    case TypeMessage.EXECUTE_SWAP_OPERATIONS:
      return executeSwapOperationsMessage(messages, params, sender);
    case TypeMessage.SWAP_AND_ACTION:
      return swapAndActionMessage(messages, params);
    case TypeMessage.SWAP_NONE_AMM_V3:
      return swapNoneAmmV3(messages, params, sender);
    case TypeMessage.CREATE_SWAP_ORDER:
      return createSwapOrderMessage(params);
    case TypeMessage.UPDATE_MINIMUM_SWAP_AMOUNT:
      return updateMinimumSwapAmountMessage(params);
    default:
      return {};
  }
}

export function executeSwapOperationsMessage(
  messages: Array<any>,
  params: any,
  sender: string
) {
  const data = [];
  let denomMinimumReceive;
  const operations = params?.operations?.map((item: any, index: number) => {
    const swapV3 = item.swap_v3;
    const event = messages[index];
    if (swapV3) {
      const poolKey = swapV3.pool_key;
      const xToY = swapV3.x_to_y;
      return {
        poolKey,
        xToY,
        amountIn: event.amount_in,
        amountOut: event.amount_out,
      };
    }
    const swapV2 = item.orai_swap;
    if (swapV2) {
      const offerAssetInfo = swapV2.offer_asset_info;
      const askAssetInfo = swapV2.ask_asset_info;
      const token_x =
        offerAssetInfo?.native_token?.denom ||
        offerAssetInfo?.token?.contract_addr;
      const token_y =
        askAssetInfo?.native_token?.denom || askAssetInfo?.token?.contract_addr;
      return {
        poolKey: {
          token_x,
          token_y,
          fee_tier: {
            fee: null,
          },
        },
        xToY: true,
        amountIn: event.offer_amount,
        amountOut: event.return_amount,
      };
    }
    return item;
  });

  if (Array.isArray(operations)) {
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const poolKey = operation.poolKey;
      const xToY = operation.xToY;
      const amountIn = operation.amountIn;
      const amountOut = operation.amountOut;
      denomMinimumReceive = xToY ? poolKey.token_y : poolKey.token_x;
      const result = {
        pool: displayPoolName(poolKey),
        tokenIn: displayListAssets(
          [amountIn],
          [xToY ? poolKey.token_x : poolKey.token_y]
        ),
        tokenOut: displayListAssets(
          [amountOut],
          [xToY ? poolKey.token_y : poolKey.token_x]
        ),
      };
      data.push(result);
    }
  }

  const tokenIn = data[0].tokenIn;
  const tokenOut = data.slice(-1)[0].tokenOut;
  return {
    tokenIn,
    tokenOut,
    receiver: sender,
    operations: data,
    minimum_receive: displayListAssets(
      [params.minimum_receive],
      [denomMinimumReceive]
    ),
  };
}

export function swapAndActionMessage(messages: Array<any>, params: any) {
  const data = [];
  const operations = params?.user_swap?.swap_exact_asset_in?.operations?.map(
    (item: any, index: number) => {
      const poolKey = item.pool?.split('-');
      const event = messages[index];
      let fee, tick_spacing;
      if (Array.isArray(poolKey)) {
        fee = poolKey[2];
        tick_spacing = poolKey[3];
      }
      const token_x = item.denom_in;
      const token_y = item.denom_out;
      return {
        poolKey: {
          token_x,
          token_y,
          fee_tier: {
            fee,
            tick_spacing,
          },
        },
        xToY: true,
        amountIn: event?.amount_in || event?.offer_amount,
        amountOut: event?.amount_out || event?.return_amount,
      };
    }
  );

  if (Array.isArray(operations)) {
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const poolKey = operation.poolKey;
      const xToY = operation.xToY;
      const amountIn = operation.amountIn;
      const amountOut = operation.amountOut;
      const result = {
        pool: displayPoolName(poolKey),
        tokenIn:
          amountIn !== null && amountIn !== undefined
            ? displayListAssets(
                [amountIn],
                [xToY ? poolKey.token_x : poolKey.token_y]
              )
            : null,
        tokenOut:
          amountOut !== null && amountOut !== undefined
            ? displayListAssets(
                [amountOut],
                [xToY ? poolKey.token_y : poolKey.token_x]
              )
            : null,
      };
      data.push(result);
    }
  }
  const tokenIn = data[0].tokenIn;
  const tokenOut = data.slice(-1)[0].tokenOut;
  let postSwapAction = getDeepestObject(params?.post_swap_action);
  if (postSwapAction?.memo !== undefined) {
    const snapShotPostSwapAction = { ...postSwapAction };
    delete snapShotPostSwapAction.memo;
    postSwapAction = {
      ...snapShotPostSwapAction,
      memo: postSwapAction?.memo,
    };
  }
  const nameAction = Object.keys(params?.post_swap_action)[0];
  const minAsset = params?.min_asset;
  let amountMinAsset, addressMinAsset;
  if (minAsset?.cw20) {
    amountMinAsset = minAsset.cw20.amount;
    addressMinAsset = minAsset.cw20.address;
  }
  return {
    tokenIn,
    tokenOut,
    operations: data,
    [nameAction]: postSwapAction,
    minAsset:
      amountMinAsset && addressMinAsset
        ? displayListAssets([amountMinAsset], [addressMinAsset])
        : null,
  };
}

export function swapNoneAmmV3(
  messages: Array<any>,
  params: any,
  sender: string
) {
  const data = [];
  for (let message of messages) {
    const token_x = message.offer_asset;
    const token_y = message.ask_asset;
    const amountIn = message.offer_amount;
    const amountOut = message.return_amount;

    const poolKey = {
      token_x,
      token_y,
      fee_tier: {
        fee: null,
        tick_spacing: null,
      },
    };
    const result = {
      pool: displayPoolName(poolKey),
      tokenIn: displayListAssets([amountIn], [token_x]),
      tokenOut: displayListAssets([amountOut], [token_y]),
    };
    data.push(result);
  }
  const tokenIn = data[0].tokenIn;
  const tokenOut = data.slice(-1)[0].tokenOut;

  return {
    tokenIn,
    tokenOut,
    receiver: sender,
    operations: data,
    maxSpread: params?.max_spread,
    beliefPrice: params?.belief_price,
  };
}

export function createSwapOrderMessage(params: any) {
  const tokenIn = tokenMap[params?.token_in?.token?.contract_addr];
  const tokenOut = tokenMap[params?.token_out?.native_token?.denom];
  return {
    amount: tokenIn?.coinDecimals
      ? formatNumber(params?.amount / Math.pow(10, tokenIn.coinDecimals))
      : formatNumber(params?.amount),
    tokenIn: tokenIn?.coinDenom,
    tokenOut: tokenOut?.coinDenom,
  };
}

export function updateMinimumSwapAmountMessage(params: any) {
  const tokenIn = tokenMap[params?.token_in?.token?.contract_addr];
  return {
    amount: tokenIn?.coinDecimals
      ? formatNumber(params?.amount / Math.pow(10, tokenIn.coinDecimals))
      : formatNumber(params?.amount),
    tokenIn: tokenIn?.coinDenom,
  };
}

import { displayListAssets, displayPoolName } from './amm-v3';
import { executeSwapOperationsMessage, swapAndActionMessage } from './swap-msg';

export enum TypeMessageSend {
  SEND = 'send',
  SEND_NFT = 'send_nft',
}

export const BRIDGE_EVM_CONTRACT_ADDRESS =
  'orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm';
export const SWAP_AND_ACTION_CONTRACT_ADDRESS =
  'orai1yglsm0u2x3xmct9kq3lxa654cshaxj9j5d9rw5enemkkkdjgzj7sr3gwt0';
export const EXECUTE_SWAP_OPERATIONS_SMART_CONTRACT =
  'orai1j0r67r9k8t34pnhy00x3ftuxuwg0r6r4p8p6rrc8az0ednzr8y9s3sj2sf';
export const EXECUTE_SWAP_OPERATIONS_ROUTER =
  'orai1cy2pc5czxm5qlacp6j0hfq7qj9wh8zuhxgpdartcfrdljknq0arsuc4znj';
export const BONDING_CONTRACT_ADDRESS =
  'orai1xu9yw2xwd55d09pjce28yjklvk2kwwrqw4ql9gvyrs607z26kv0sl99040';
export const BRIDGE_TON_ADDRESS =
  'orai159l8l9c5ckhqpuwdfgs9p4v599nqt3cjlfahalmtrhfuncnec2ms5mz60e';
export const PREFIX_MEMO_MSG_BRIDGE_EVMS = [
  'oraib',
  'eth-mainnet',
  'trontrx-mainnet',
];
interface ChainType {
  [key: string]: string; // Index signature
}

export const CHAIN: ChainType = {
  oraib: 'Binance',
  'eth-mainnet': 'Ethereum',
  'trontrx-mainnet': 'Tron',
};

export const displayMessageSend = (
  params: any,
  eventSwap: any,
  denom: string,
  sender: string
) => {
  let receiver = '';
  let chain = '';
  const amount = displayListAssets([params?.amount], [denom]);
  if (params?.msg) {
    const msg = JSON.parse(atob(params.msg));
    const contract = params?.contract;
    switch (contract) {
      case BRIDGE_EVM_CONTRACT_ADDRESS:
        const memo = msg.memo;
        PREFIX_MEMO_MSG_BRIDGE_EVMS.forEach((item) => {
          if (memo.startsWith(item)) {
            receiver = memo.replace(item, '');
            chain = CHAIN[item];
          }
        });
        return { amount, receiver, chain };
      case BRIDGE_TON_ADDRESS:
        return { amount, receiver: msg.to, chain: 'Ton' };
      case SWAP_AND_ACTION_CONTRACT_ADDRESS:
        return {
          amount,
          receiver:
            msg.swap_and_action?.post_swap_action?.transfer?.to_address ||
            msg.swap_and_action?.post_swap_action?.ibc_transfer?.ibc_info
              ?.receiver,
          swap: swapAndActionMessage(eventSwap, msg?.swap_and_action),
        };
      case EXECUTE_SWAP_OPERATIONS_SMART_CONTRACT:
      case EXECUTE_SWAP_OPERATIONS_ROUTER:
        return {
          amount,
          receiver: sender,
          swap: executeSwapOperationsMessage(
            eventSwap,
            msg?.execute_swap_operations,
            sender
          ),
        };
      case BONDING_CONTRACT_ADDRESS:
        return {
          receiver: params?.contract,
          bonding: displayListAssets([params?.amount], [denom]),
        };
      default:
        return { amount, receiver: receiver };
    }
  }
  return { receiver: receiver };
};

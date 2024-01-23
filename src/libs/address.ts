import {
  fromBase64,
  fromBech32,
  fromHex,
  toBase64,
  toBech32,
  toHex,
} from '@cosmjs/encoding';
import { Ripemd160, sha256 } from '@cosmjs/crypto';
import type { Any } from 'cosmjs-types/google/protobuf/any';

export function decodeAddress(address: string) {
  return fromBech32(address);
}

export function valoperToPrefix(valoper?: string) {
  if (!valoper) return '';
  // const prefixIndex = valoper.indexOf('valoper');
  // if (prefixIndex === -1) return null;
  // return valoper.slice(0, prefixIndex);
  return fromBech32(valoper).prefix;
}

export function operatorAddressToAccount(operAddress?: string) {
  if (!operAddress) return '';
  const { prefix, data } = fromBech32(operAddress);
  if (prefix === 'iva') {
    // handle special cases
    return toBech32('iaa', data);
  }
  if (prefix === 'crocncl') {
    // handle special cases
    return toBech32('cro', data);
  }
  return toBech32(prefix.replace('valoper', ''), data);
}

export function consensusPubkeyToHexAddress(consensusPubkey?: Any) {
  if (!consensusPubkey) return '';
  let raw = '';
  if (consensusPubkey.typeUrl === '/cosmos.crypto.ed25519.PubKey') {
    const pubkey = consensusPubkey.value;
    if (pubkey) return toHex(sha256(pubkey)).slice(0, 40).toUpperCase();
  }

  if (consensusPubkey.typeUrl === '/cosmos.crypto.secp256k1.PubKey') {
    const pubkey = consensusPubkey.value;
    if (pubkey) return toHex(new Ripemd160().update(sha256(pubkey)).digest());
  }
  return raw;
}

export function pubKeyToValcons(consensusPubkey: Any, prefix: string) {
  if (consensusPubkey && consensusPubkey.value) {
    const pubkey = consensusPubkey.value;
    if (pubkey) {
      const addressData = sha256(pubkey).slice(0, 20);
      return toBech32(`${prefix}valcons`, addressData);
    }
  }
  return '';
}

export function valconsToBase64(address: string) {
  if (address) return toHex(fromBech32(address).data).toUpperCase();
  return '';
}

export function toETHAddress(cosmosAddress: string) {
  return `0x${toHex(fromBech32(cosmosAddress).data)}`;
}

export function addressEnCode(prefix: string, pubkey: Uint8Array) {
  return toBech32(prefix, pubkey);
}

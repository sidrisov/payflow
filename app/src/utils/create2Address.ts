import { Address, ByteArray, concat, getAddress, keccak256, pad, slice, toBytes } from 'viem';

export default function create2Address(
  sender: Address,
  bytecodeHash: `0x${string}`,
  salt: `0x${string}`,
  input: `0x${string}`
) {
  const prefix = keccak256(toBytes('zksyncCreate2'));
  const inputHash = keccak256(input);
  const addressBytes = slice(
    keccak256(concat([prefix, pad(sender), salt, bytecodeHash, inputHash])),
    12
  );

  return getAddress(addressBytes);
}

export const DEFAULT_GAS_PER_PUBDATA_LIMIT = 50000;

export declare type Eip712Meta = {
  gasPerPubdata?: number;
  customSignature?: ByteArray;
};

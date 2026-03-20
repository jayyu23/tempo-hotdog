/**
 * Adapter to convert a Privy ConnectedWallet into a viem-compatible Account.
 *
 * For signTransaction, we use Privy's secp256k1_sign to sign the raw hash
 * of the Tempo-serialized transaction, bypassing Privy's transaction type
 * validation which rejects Tempo's custom transaction types.
 *
 * Based on: https://docs.privy.io/recipes/agent-integrations/mpp
 */

import type { ConnectedWallet } from "@privy-io/react-auth";
import { toAccount } from "viem/accounts";
import type { LocalAccount } from "viem";
import { keccak256 } from "viem";

export function privyToViemAccount(wallet: ConnectedWallet): LocalAccount {
  return toAccount({
    address: wallet.address as `0x${string}`,

    async signMessage({ message }) {
      const provider = await wallet.getEthereumProvider();
      const msg =
        typeof message === "string"
          ? message
          : (message as { raw: `0x${string}` }).raw;
      return provider.request({
        method: "personal_sign",
        params: [msg, wallet.address],
      }) as Promise<`0x${string}`>;
    },

    async signTransaction(transaction, options) {
      const serializer = options?.serializer;
      if (!serializer) {
        throw new Error(
          "Tempo serializer required — ensure the viem client has Tempo chain config"
        );
      }

      // 1. Serialize the unsigned transaction using Tempo's custom serializer
      const unsignedSerialized = await serializer(transaction);

      // 2. Hash the serialized transaction
      const hash = keccak256(unsignedSerialized);

      // 3. Sign the raw hash using Privy's secp256k1 signer
      //    This bypasses Privy's transaction type validation
      const provider = await wallet.getEthereumProvider();
      const signature = (await provider.request({
        method: "secp256k1_sign" as any,
        params: [hash],
      } as any)) as `0x${string}`;

      // 4. Wrap in Tempo's SignatureEnvelope and re-serialize with signature
      const { SignatureEnvelope } = await import("ox/tempo");
      const envelope = SignatureEnvelope.from(signature);

      return (await serializer(
        transaction,
        envelope as any
      )) as `0x${string}`;
    },

    async signTypedData(typedData) {
      const provider = await wallet.getEthereumProvider();
      return provider.request({
        method: "eth_signTypedData_v4",
        params: [
          wallet.address,
          JSON.stringify(typedData, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value
          ),
        ],
      }) as Promise<`0x${string}`>;
    },
  }) as LocalAccount;
}

/**
 * Adapter to convert a Privy ConnectedWallet into a viem-compatible Account.
 * This allows the mppx client SDK to use Privy's embedded wallet for signing.
 */

import type { ConnectedWallet } from "@privy-io/react-auth";
import { toAccount } from "viem/accounts";
import type { LocalAccount } from "viem";

export function privyToViemAccount(wallet: ConnectedWallet): LocalAccount {
  return toAccount({
    address: wallet.address as `0x${string}`,

    async signMessage({ message }) {
      const provider = await wallet.getEthereumProvider();
      const msg = typeof message === "string" ? message : (message as { raw: `0x${string}` }).raw;
      return provider.request({
        method: "personal_sign",
        params: [msg, wallet.address],
      }) as Promise<`0x${string}`>;
    },

    async signTransaction(tx) {
      const provider = await wallet.getEthereumProvider();
      return provider.request({
        method: "eth_signTransaction",
        params: [tx],
      }) as Promise<`0x${string}`>;
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

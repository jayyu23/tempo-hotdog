/**
 * Client-side MPP session handler
 * Handles opening sessions, signing vouchers, and closing sessions
 * using Privy's embedded wallet for signing.
 */

import type { ConnectedWallet } from "@privy-io/react-auth";

interface SessionInfo {
  sessionId: string;
  tier: string;
  challengeId: string;
  channelId?: string;
  pricePerHotdog: string;
  displayPrice: string;
}

interface VoucherReceipt {
  success: boolean;
  hotdogCount: number;
  cumulativeAmount: string;
  spent: string;
}

interface CloseResult {
  success: boolean;
  txHash?: string;
  finalSpent: string;
  refunded?: string;
}

/**
 * Fetch the MPP challenge (the 402 response) and create a session
 */
export async function fetchChallenge(
  sessionId: string
): Promise<{ challengeId: string; amount: string; unitType: string }> {
  const res = await fetch("/api/mpp/challenge", {
    headers: { "x-session-id": sessionId },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Challenge failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Sign a voucher using EIP-712 typed data via Privy wallet
 */
export async function signVoucher(
  wallet: ConnectedWallet,
  channelId: string,
  cumulativeAmount: string
): Promise<string> {
  const provider = await wallet.getEthereumProvider();

  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      Voucher: [
        { name: "channelId", type: "bytes32" },
        { name: "cumulativeAmount", type: "uint256" },
      ],
    },
    primaryType: "Voucher",
    domain: {
      name: "Tempo Stream Channel",
      version: "1",
      chainId: "0xa5ff", // 42431 in hex
    },
    message: {
      channelId,
      cumulativeAmount,
    },
  };

  const signature = await provider.request({
    method: "eth_signTypedData_v4",
    params: [
      wallet.address as `0x${string}`,
      JSON.stringify(typedData, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
    ],
  });

  return signature as string;
}

/**
 * Submit a signed voucher to buy a hotdog
 */
export async function sendVoucher(
  sessionId: string,
  channelId: string,
  cumulativeAmount: string,
  signature: string
): Promise<VoucherReceipt> {
  const res = await fetch("/api/mpp/voucher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ channelId, cumulativeAmount, signature }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Voucher failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Close the session and settle on-chain
 */
export async function closeSession(
  sessionId: string,
  wallet: ConnectedWallet,
  channelId: string,
  finalAmount: string
): Promise<CloseResult> {
  // Sign the final voucher for close
  const signature = await signVoucher(wallet, channelId, finalAmount);

  const res = await fetch("/api/mpp/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ channelId, cumulativeAmount: finalAmount, signature }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Close failed: ${res.status}`);
  }

  return res.json();
}

export type { SessionInfo, VoucherReceipt, CloseResult };

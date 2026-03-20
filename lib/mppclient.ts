/**
 * Client-side MPP session handler.
 *
 * Provides two modes:
 * 1. SDK mode (createMppSession) — uses mppx SessionManager for full
 *    channel lifecycle with auto open/voucher/close.
 * 2. Legacy mode (fetchChallenge, signVoucher, sendVoucher, closeSession) —
 *    manual challenge/voucher/close against the old API routes (kept as fallback).
 */

import type { ConnectedWallet } from "@privy-io/react-auth";
import { tempo } from "mppx/client";
import { privyToViemAccount } from "@/lib/privy-account";

// The SessionManager type is the return type of tempo.session()
export type MppSessionManager = ReturnType<typeof tempo.session>;

// ─── SDK mode ────────────────────────────────────────────────────────────────

/**
 * Create a SessionManager that uses the mppx SDK to manage the full
 * channel lifecycle against the unified /api/mpp route.
 */
export function createMppSession(
  wallet: ConnectedWallet,
  sessionId: string,
  options?: { maxDeposit?: string }
): MppSessionManager {
  const account = privyToViemAccount(wallet);

  return tempo.session({
    account,
    maxDeposit: options?.maxDeposit ?? "50",
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      // Inject x-session-id header into every request
      const headers = new Headers(init?.headers);
      headers.set("x-session-id", sessionId);
      return globalThis.fetch(input, { ...init, headers });
    },
  });
}

// ─── Legacy mode (fallback) ──────────────────────────────────────────────────

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

  const escrowAddress =
    process.env.NEXT_PUBLIC_TEMPO_ESCROW_ADDRESS ||
    "0x33b901018174DDabE4841042ab76ba85D4e24f25";

  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Voucher: [
        { name: "channelId", type: "bytes32" },
        { name: "cumulativeAmount", type: "uint128" },
      ],
    },
    primaryType: "Voucher",
    domain: {
      name: "Tempo Stream Channel",
      version: "1",
      chainId: 4217,
      verifyingContract: escrowAddress,
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

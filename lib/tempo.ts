import { createPublicClient, http, defineChain } from "viem";

export const tempoChain = defineChain({
  id: 42431,
  name: "Tempo",
  nativeCurrency: { name: "TEMPO", symbol: "TEMPO", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.TEMPO_RPC_URL || "https://rpc.tempo.xyz"] },
  },
});

export const ESCROW_ADDRESS = (process.env.TEMPO_ESCROW_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const TIP20_ADDRESS = (process.env.TEMPO_TIP20_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// VIP: $0.50 per hotdog = 500000 base units (6 decimals)
// Regular: $1.00 per hotdog = 1000000 base units
export const TIER_PRICES: Record<string, string> = {
  vip: "500000",
  regular: "1000000",
};

export const TIER_DISPLAY_PRICES: Record<string, string> = {
  vip: "$0.50",
  regular: "$1.00",
};

export function getTempoClient() {
  return createPublicClient({
    chain: tempoChain,
    transport: http(process.env.TEMPO_RPC_URL || "https://rpc.tempo.xyz"),
  });
}

// TempoStreamChannel ABI (minimal for our needs)
export const TEMPO_STREAM_CHANNEL_ABI = [
  {
    name: "openChannel",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "channelId", type: "bytes32" },
      { name: "payer", type: "address" },
      { name: "payee", type: "address" },
      { name: "token", type: "address" },
      { name: "deposit", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "close",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "channelId", type: "bytes32" },
      { name: "cumulativeAmount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "channels",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "channelId", type: "bytes32" }],
    outputs: [
      { name: "payer", type: "address" },
      { name: "payee", type: "address" },
      { name: "token", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },
] as const;

// EIP-712 domain for voucher signing
export const VOUCHER_EIP712_DOMAIN = {
  name: "Tempo Stream Channel",
  version: "1",
  chainId: 42431,
} as const;

export const VOUCHER_EIP712_TYPES = {
  Voucher: [
    { name: "channelId", type: "bytes32" },
    { name: "cumulativeAmount", type: "uint256" },
  ],
} as const;

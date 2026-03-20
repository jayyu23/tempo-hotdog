import { createPublicClient, http, defineChain } from "viem";

// Tempo Testnet (Moderato) — chainId 42431
export const tempoTestnet = defineChain({
  id: 42431,
  name: "Tempo Moderato",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.moderato.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.moderato.tempo.xyz" },
  },
  testnet: true,
});

// Tempo Mainnet — chainId 4217
export const tempoMainnet = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
  },
});

// Use mainnet by default
export const tempoChain = tempoMainnet;

// Token addresses
export const USDC_ADDRESS = "0x20C000000000000000000000b9537d11c60E8b50" as `0x${string}`;
export const PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000" as `0x${string}`;

// TempoStreamChannel escrow contracts
export const ESCROW_ADDRESS_TESTNET = "0xe1c4d3dce17bc111181ddf716f75bae49e61a336" as `0x${string}`;
export const ESCROW_ADDRESS_MAINNET = "0x33b901018174DDabE4841042ab76ba85D4e24f25" as `0x${string}`;

export const ESCROW_ADDRESS = (process.env.TEMPO_ESCROW_ADDRESS ||
  ESCROW_ADDRESS_MAINNET) as `0x${string}`;
export const TIP20_ADDRESS = (process.env.TEMPO_TIP20_ADDRESS ||
  USDC_ADDRESS) as `0x${string}`;

// VIP: $0.05 per hotdog = 50000 base units (6 decimals)
// Regular: $0.10 per hotdog = 100000 base units
export const TIER_PRICES: Record<string, string> = {
  vip: "50000",
  regular: "100000",
};

export const TIER_DISPLAY_PRICES: Record<string, string> = {
  vip: "$0.05",
  regular: "$0.10",
};

export function getTempoClient() {
  return createPublicClient({
    chain: tempoChain,
    transport: http(
      process.env.TEMPO_RPC_URL || "https://rpc.tempo.xyz"
    ),
  });
}

// TempoStreamChannel ABI (minimal for our needs)
export const TEMPO_STREAM_CHANNEL_ABI = [
  {
    name: "open",
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
    name: "settle",
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
    name: "getChannel",
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

// EIP-712 domain for voucher signing (includes verifyingContract per spec)
export const VOUCHER_EIP712_DOMAIN = {
  name: "Tempo Stream Channel",
  version: "1",
  chainId: 4217,
  verifyingContract: ESCROW_ADDRESS,
} as const;

// Note: cumulativeAmount is uint128 per Tempo spec
export const VOUCHER_EIP712_TYPES = {
  Voucher: [
    { name: "channelId", type: "bytes32" },
    { name: "cumulativeAmount", type: "uint128" },
  ],
} as const;

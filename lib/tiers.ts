export type Tier = "vip" | "regular" | "blacklisted";

export const TIER_CONFIG: Record<
  Tier,
  { label: string; pricePerHotdog: string; displayPrice: string; color: string }
> = {
  vip: {
    label: "VIP",
    pricePerHotdog: "500000",
    displayPrice: "$0.50",
    color: "#22c55e",
  },
  regular: {
    label: "Regular",
    pricePerHotdog: "1000000",
    displayPrice: "$1.00",
    color: "#3b82f6",
  },
  blacklisted: {
    label: "Blacklisted",
    pricePerHotdog: "0",
    displayPrice: "N/A",
    color: "#ef4444",
  },
};

// Default tier for unknown domains
export const DEFAULT_TIER: Tier = "regular";

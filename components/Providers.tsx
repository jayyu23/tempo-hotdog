"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useTheme } from "./ThemeProvider";

// Tempo Moderato (testnet) chain definition for Privy
const tempoChain = {
  id: 42431,
  name: "Tempo Moderato",
  network: "tempo-moderato",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.moderato.tempo.xyz"] },
    public: { http: ["https://rpc.moderato.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.moderato.tempo.xyz" },
  },
  testnet: true,
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div style={{ padding: "2rem", color: "red", fontFamily: "monospace" }}>
        Error: NEXT_PUBLIC_PRIVY_APP_ID environment variable is not set.
        <br />
        Please create a .env.local file with your Privy App ID.
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google", "email"],
        appearance: {
          theme: theme === "light" ? "light" : "dark",
          accentColor: "#f97316",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: tempoChain as never,
        supportedChains: [tempoChain as never],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

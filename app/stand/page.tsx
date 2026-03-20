"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createMppSession, type MppSessionManager } from "@/lib/mppclient";
import { TIER_PRICES, TIER_DISPLAY_PRICES } from "@/lib/tempo";
import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { tempoMainnet, USDC_ADDRESS } from "@/lib/tempo";

function StandContent() {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const searchParams = useSearchParams();

  const [sessionId] = useState(
    () => searchParams.get("session") || sessionStorage.getItem("sessionId") || ""
  );
  const [tier] = useState(
    () => sessionStorage.getItem("tier") || "regular"
  );

  const sessionRef = useRef<MppSessionManager | null>(null);
  const [channelId, setChannelId] = useState<string>("");
  const [hotdogCount, setHotdogCount] = useState(0);
  const [cumulativeAmount, setCumulativeAmount] = useState("0");
  const [spent, setSpent] = useState("0");
  const [isOrdering, setIsOrdering] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [closeResult, setCloseResult] = useState<{
    txHash?: string;
    finalSpent: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const pricePerHotdog = TIER_PRICES[tier] || TIER_PRICES.regular;
  const displayPrice = TIER_DISPLAY_PRICES[tier] || TIER_DISPLAY_PRICES.regular;

  const fetchBalance = useCallback(async () => {
    if (!embeddedWallet?.address) return;
    try {
      const client = createPublicClient({
        chain: tempoMainnet,
        transport: http(),
      });
      const raw = await client.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [embeddedWallet.address as `0x${string}`],
      });
      setBalance(formatUnits(raw, 6));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [embeddedWallet?.address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, hotdogCount]);

  const openSession = useCallback(async () => {
    if (!sessionId || sessionOpen || !embeddedWallet) return;

    try {
      setError(null);

      // Create SDK session manager
      const session = createMppSession(embeddedWallet, sessionId, {
        maxDeposit: "0.2",
      });
      sessionRef.current = session;

      // Make initial fetch to get the 402 challenge and auto-open channel
      const res = await session.fetch("/api/mpp");

      if (session.channelId) {
        setChannelId(session.channelId);
      }

      if (res.receipt) {
        setSpent(res.receipt.spent);
      }

      setSessionOpen(true);
      console.log("Session opened via SDK, channelId:", session.channelId);
    } catch (err) {
      console.error("Failed to open session:", err);
      setError(err instanceof Error ? err.message : "Failed to open session");
    }
  }, [sessionId, sessionOpen, embeddedWallet]);

  useEffect(() => {
    if (ready && !authenticated) {
      window.location.href = "/";
      return;
    }

    if (authenticated && sessionId && !sessionOpen && embeddedWallet) {
      openSession();
    }
  }, [ready, authenticated, sessionId, sessionOpen, embeddedWallet, openSession]);

  const orderHotdog = async () => {
    const session = sessionRef.current;
    if (!session || !embeddedWallet || isOrdering) return;

    setIsOrdering(true);
    setError(null);

    try {
      // SDK session.fetch auto-sends the next voucher
      const res = await session.fetch("/api/mpp");

      if (session.channelId && !channelId) {
        setChannelId(session.channelId);
      }

      // Track hotdog count from cumulative amount
      const newCumulative = session.cumulative;
      const count = Number(newCumulative / BigInt(pricePerHotdog));
      setHotdogCount(count);
      setCumulativeAmount(newCumulative.toString());

      if (res.receipt) {
        setSpent(res.receipt.spent);
      }

      setJustOrdered(true);
      setTimeout(() => setJustOrdered(false), 500);
    } catch (err) {
      console.error("Order failed:", err);
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleClose = async () => {
    const session = sessionRef.current;
    if (!session || isClosing) return;

    setIsClosing(true);
    setError(null);

    try {
      const receipt = await session.close();

      setCloseResult({
        txHash: receipt?.txHash || undefined,
        finalSpent: receipt?.spent || spent,
      });
    } catch (err) {
      console.error("Close failed:", err);
      setError(err instanceof Error ? err.message : "Close failed");
    } finally {
      setIsClosing(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-grease-stain border-t-mustard rounded-full animate-spin" />
      </div>
    );
  }

  // Settlement receipt
  if (closeResult) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🧾</div>
          <h1 className="font-bangers text-4xl text-mustard">YOUR TAB</h1>
          <p className="text-napkin-gray italic">&ldquo;Your tab has been settled. The wiener remembers.&rdquo;</p>

          {/* Receipt card */}
          <div className="bg-grill-smoke border-2 border-grease-stain rounded-2xl p-6 space-y-4 text-left font-mono text-sm">
            <div className="text-center text-pencil-scrawl text-xs border-b border-dashed border-grease-stain pb-3 mb-3">
              === HOTDOG NOT HOTDOG ===<br />
              SESSION RECEIPT
            </div>
            <div className="flex justify-between">
              <span className="text-napkin-gray">Hotdogs purchased</span>
              <span className="font-bold text-bun-white text-lg">{hotdogCount}x 🌭</span>
            </div>
            <div className="border-t border-dashed border-grease-stain" />
            <div className="flex justify-between">
              <span className="text-napkin-gray">Unit price</span>
              <span className="text-bun-white">{displayPrice}</span>
            </div>
            <div className="border-t border-dashed border-grease-stain" />
            <div className="flex justify-between text-lg">
              <span className="text-napkin-gray font-bold">TOTAL</span>
              <span className="font-bold text-mustard">
                ${(Number(closeResult.finalSpent) / 1_000_000).toFixed(2)} USDC
              </span>
            </div>
            {closeResult.txHash && (
              <>
                <div className="border-t border-dashed border-grease-stain" />
                <div>
                  <span className="text-pencil-scrawl text-xs">Settlement TX</span>
                  <p className="text-pencil-scrawl text-xs break-all mt-1">
                    {closeResult.txHash}
                  </p>
                </div>
              </>
            )}
            <div className="text-center text-pencil-scrawl text-xs border-t border-dashed border-grease-stain pt-3">
              THANK YOU COME AGAIN
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex-1 py-3 border-2 border-grease-stain hover:border-mustard/50 rounded-xl text-sm text-napkin-gray font-bangers text-lg transition-all cursor-pointer"
            >
              BACK HOME
            </button>
            <button
              onClick={() => logout().then(() => { window.location.href = "/"; })}
              className="flex-1 py-3 border-2 border-grease-stain hover:border-ketchup/50 rounded-xl text-sm text-napkin-gray font-bangers text-lg transition-all cursor-pointer"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4">
      <div className="starburst" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header -- menu board style */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🌭</div>
          <h1 className="font-bangers text-4xl text-mustard neon-text">
            HOTDOG STAND
          </h1>
          <div className="flex justify-center gap-3 items-center">
            <span
              className={`font-bangers text-lg uppercase px-3 py-1 rounded-full transform rotate-[-2deg] ${
                tier === "vip"
                  ? "bg-relish/15 text-relish border border-relish/30"
                  : "bg-mustard/15 text-mustard border border-mustard/30"
              }`}
            >
              {tier}
            </span>
            <span className="text-napkin-gray">|</span>
            <span className="font-mono text-bun-white">{displayPrice}/dog</span>
          </div>
        </div>

        {/* Stats panel -- diner check style */}
        <div className="bg-grill-smoke border-2 border-grease-stain rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-napkin-gray">Hotdogs</span>
            <span className={`text-4xl font-bangers text-mustard ${justOrdered ? "animate-sizzle" : ""}`}>
              {hotdogCount}
            </span>
          </div>
          <div className="border-t border-dashed border-grease-stain" />
          <div className="flex justify-between items-center">
            <span className="text-napkin-gray">Running tab</span>
            <span className="font-mono text-lg text-bun-white">
              ${(Number(spent) / 1_000_000).toFixed(2)} USDC
            </span>
          </div>
          <div className="border-t border-dashed border-grease-stain" />
          <div className="flex justify-between items-center">
            <span className="text-napkin-gray">Wallet balance</span>
            <span className="font-mono text-lg text-bun-white">
              {balance !== null ? `$${Number(balance).toFixed(2)}` : "..."}
            </span>
          </div>
          <div className="border-t border-dashed border-grease-stain" />
          <div className="flex justify-between items-center">
            <span className="text-napkin-gray">Channel</span>
            <span className="font-mono text-xs text-pencil-scrawl">
              {channelId
                ? `${channelId.slice(0, 10)}...${channelId.slice(-6)}`
                : "Opening..."}
            </span>
          </div>
        </div>

        {/* Channel opening note */}
        {!sessionOpen && !error && (
          <p className="text-pencil-scrawl text-xs text-center italic">
            Privy will ask you to approve a transaction to open your payment channel.
            The amount shown may look large — this is a display issue with custom tokens.
            The actual deposit is $0.50 USDC.
          </p>
        )}

        {/* Hotdog grill display */}
        {hotdogCount > 0 && (
          <div className="flex flex-wrap justify-center gap-1 py-2">
            {Array.from({ length: Math.min(hotdogCount, 20) }).map((_, i) => (
              <span
                key={i}
                className="text-3xl animate-drop-in"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${(i % 3 - 1) * 15}deg)`,
                }}
              >
                🌭
              </span>
            ))}
            {hotdogCount > 20 && (
              <span className="text-napkin-gray text-sm self-end font-mono">
                +{hotdogCount - 20} more
              </span>
            )}
          </div>
        )}

        {/* Deposit prompt when balance is zero */}
        {balance !== null && Number(balance) === 0 && embeddedWallet?.address && (
          <div className="bg-mustard/10 border-2 border-mustard/30 rounded-2xl p-5 space-y-3 text-center">
            <p className="font-bangers text-lg text-mustard">DEPOSIT USDC TO GET STARTED</p>
            <p className="text-napkin-gray text-sm">
              Send USDC on Tempo to your wallet to open a payment channel:
            </p>
            <div className="flex items-center gap-2 bg-night-cart/50 rounded-xl p-3">
              <code className="flex-1 text-xs text-bun-white break-all font-mono">
                {embeddedWallet.address}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embeddedWallet.address);
                }}
                className="shrink-0 px-3 py-1 bg-mustard/20 hover:bg-mustard/30 text-mustard text-xs font-bangers rounded-lg transition-colors cursor-pointer"
              >
                COPY
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-shake">
            <p className="text-ketchup text-sm bg-ketchup/10 border border-ketchup/30 rounded-xl p-3 text-center font-mono">
              {error}
            </p>
          </div>
        )}

        {/* ORDER HOTDOG -- THE BIG BUTTON */}
        <div className="space-y-3">
          <button
            onClick={orderHotdog}
            disabled={isOrdering || !sessionOpen || !channelId}
            className={`w-full py-5 px-6 font-bangers text-3xl rounded-2xl transform transition-all cursor-pointer
              ${isOrdering
                ? "bg-stand-orange/50 text-bun-white/50 scale-95"
                : "bg-mustard hover:bg-mustard/90 text-night-cart rotate-[-1deg] hover:rotate-[1deg] hover:scale-[1.02] comic-border"
              }
              disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:border-grease-stain
            `}
          >
            {isOrdering ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin text-2xl">🔥</span>
                GRILLING...
              </span>
            ) : (
              `🌭 ORDER HOTDOG (${displayPrice})`
            )}
          </button>

          <button
            onClick={handleClose}
            disabled={isClosing || !sessionOpen}
            className="w-full py-3 border-2 border-grease-stain hover:border-napkin-gray disabled:border-grease-stain/50 disabled:text-pencil-scrawl rounded-xl text-napkin-gray font-bangers text-lg transition-all cursor-pointer"
          >
            {isClosing ? "CLOSING SESSION..." : "CLOSE TAB & BOUNCE"}
          </button>
        </div>

        {/* Wallet info — collapsible */}
        <details className="text-center text-xs text-pencil-scrawl font-mono">
          <summary className="cursor-pointer hover:text-napkin-gray transition-colors">
            Wallet: {embeddedWallet?.address?.slice(0, 6)}...
            {embeddedWallet?.address?.slice(-4)} | Tempo (4217)
          </summary>
          <div className="mt-2 p-3 bg-grill-smoke border border-grease-stain rounded-xl space-y-1 text-left break-all">
            <p><span className="text-napkin-gray">Address:</span> {embeddedWallet?.address}</p>
            <p><span className="text-napkin-gray">Chain:</span> Tempo Mainnet (4217)</p>
            <p><span className="text-napkin-gray">USDC:</span> {USDC_ADDRESS}</p>
            <p><span className="text-napkin-gray">Escrow:</span> 0x33b901018174DDabE4841042ab76ba85D4e24f25</p>
          </div>
        </details>

        {/* Sign out */}
        <div className="text-center">
          <button
            onClick={() => logout().then(() => { window.location.href = "/"; })}
            className="text-xs text-pencil-scrawl hover:text-napkin-gray underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StandPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-3 border-grease-stain border-t-mustard rounded-full animate-spin" />
        </div>
      }
    >
      <StandContent />
    </Suspense>
  );
}

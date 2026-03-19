"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchChallenge,
  signVoucher,
  sendVoucher,
  closeSession,
} from "@/lib/mppclient";
import { TIER_PRICES, TIER_DISPLAY_PRICES } from "@/lib/tempo";

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

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const pricePerHotdog = TIER_PRICES[tier] || TIER_PRICES.regular;
  const displayPrice = TIER_DISPLAY_PRICES[tier] || TIER_DISPLAY_PRICES.regular;

  // Open session on first visit
  const openSession = useCallback(async () => {
    if (!sessionId || sessionOpen) return;

    try {
      setError(null);
      const challenge = await fetchChallenge(sessionId);
      // Generate a deterministic channel ID from session
      const channelBytes = new Uint8Array(32);
      crypto.getRandomValues(channelBytes);
      const chId =
        "0x" +
        Array.from(channelBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      setChannelId(chId);
      setSessionOpen(true);
      console.log("Session opened:", challenge);
    } catch (err) {
      console.error("Failed to open session:", err);
      setError(err instanceof Error ? err.message : "Failed to open session");
    }
  }, [sessionId, sessionOpen]);

  useEffect(() => {
    if (ready && !authenticated) {
      window.location.href = "/";
      return;
    }

    if (authenticated && sessionId && !sessionOpen) {
      openSession();
    }
  }, [ready, authenticated, sessionId, sessionOpen, openSession]);

  const orderHotdog = async () => {
    if (!embeddedWallet || !channelId || isOrdering) return;

    setIsOrdering(true);
    setError(null);

    try {
      // Calculate new cumulative amount
      const newCumulative = (
        BigInt(cumulativeAmount) + BigInt(pricePerHotdog)
      ).toString();

      // Sign the voucher
      const signature = await signVoucher(
        embeddedWallet,
        channelId,
        newCumulative
      );

      // Send voucher to server
      const receipt = await sendVoucher(
        sessionId,
        channelId,
        newCumulative,
        signature
      );

      setHotdogCount(receipt.hotdogCount);
      setCumulativeAmount(receipt.cumulativeAmount);
      setSpent(receipt.spent);
    } catch (err) {
      console.error("Order failed:", err);
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleClose = async () => {
    if (!embeddedWallet || isClosing) return;

    setIsClosing(true);
    setError(null);

    try {
      const result = await closeSession(
        sessionId,
        embeddedWallet,
        channelId,
        cumulativeAmount
      );

      setCloseResult({
        txHash: result.txHash || undefined,
        finalSpent: result.finalSpent,
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
        <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
      </div>
    );
  }

  // Show settlement result
  if (closeResult) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🧾</div>
          <h1 className="text-2xl font-bold">Session Closed</h1>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between">
              <span className="text-zinc-500">Hotdogs purchased</span>
              <span className="font-mono font-bold">{hotdogCount}</span>
            </div>
            <div className="border-t border-zinc-800" />
            <div className="flex justify-between">
              <span className="text-zinc-500">Total spent</span>
              <span className="font-mono font-bold">
                {(Number(closeResult.finalSpent) / 1_000_000).toFixed(2)} TIP-20
              </span>
            </div>
            {closeResult.txHash && (
              <>
                <div className="border-t border-zinc-800" />
                <div>
                  <span className="text-zinc-500 text-sm">
                    Settlement TX
                  </span>
                  <p className="font-mono text-xs text-zinc-400 break-all mt-1">
                    {closeResult.txHash}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex-1 py-3 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-zinc-400 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={logout}
              className="flex-1 py-3 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-zinc-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🌭</div>
          <h1 className="text-2xl font-bold">Hotdog Stand</h1>
          <p className="text-zinc-500 text-sm">
            Tier:{" "}
            <span
              className={`font-mono font-bold uppercase ${
                tier === "vip" ? "text-green-400" : "text-blue-400"
              }`}
            >
              {tier}
            </span>{" "}
            | Price: {displayPrice}/hotdog
          </p>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Hotdogs</span>
            <span className="text-3xl font-bold font-mono">
              {hotdogCount}
            </span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Spent</span>
            <span className="font-mono text-lg">
              {(Number(spent) / 1_000_000).toFixed(2)} TIP-20
            </span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Channel</span>
            <span className="font-mono text-xs text-zinc-600">
              {channelId
                ? `${channelId.slice(0, 10)}...${channelId.slice(-6)}`
                : "Opening..."}
            </span>
          </div>
        </div>

        {/* Hotdog display */}
        {hotdogCount > 0 && (
          <div className="text-center text-4xl space-x-1 flex flex-wrap justify-center gap-1">
            {Array.from({ length: Math.min(hotdogCount, 20) }).map((_, i) => (
              <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                🌭
              </span>
            ))}
            {hotdogCount > 20 && (
              <span className="text-zinc-500 text-sm self-end">
                +{hotdogCount - 20} more
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3 text-center">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={orderHotdog}
            disabled={isOrdering || !sessionOpen || !channelId}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-lg rounded-xl transition-colors"
          >
            {isOrdering ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                Ordering...
              </span>
            ) : (
              `🌭 Order Hotdog (${displayPrice})`
            )}
          </button>

          <button
            onClick={handleClose}
            disabled={isClosing || !sessionOpen}
            className="w-full py-3 border border-zinc-700 hover:border-zinc-600 disabled:border-zinc-800 disabled:text-zinc-700 rounded-xl text-sm text-zinc-400 transition-colors"
          >
            {isClosing ? "Closing session..." : "Leave Stand (Close Session)"}
          </button>
        </div>

        {/* Wallet info */}
        <div className="text-center text-xs text-zinc-600 space-y-1">
          <p>
            Wallet: {embeddedWallet?.address?.slice(0, 6)}...
            {embeddedWallet?.address?.slice(-4)}
          </p>
          <p>Chain: Tempo (42431)</p>
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
          <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
        </div>
      }
    >
      <StandContent />
    </Suspense>
  );
}

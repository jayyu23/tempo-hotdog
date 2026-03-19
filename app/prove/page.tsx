"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { generateZKProof, type ProofData } from "@/lib/zkproof";

export default function ProvePage() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState<"idle" | "proving" | "verifying" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  useEffect(() => {
    if (ready && !authenticated) {
      window.location.href = "/";
    }
  }, [ready, authenticated]);

  useEffect(() => {
    if (authenticated && user && embeddedWallet?.address && status === "idle") {
      runProofFlow();
    }
  }, [authenticated, user, embeddedWallet?.address, status]);

  const runProofFlow = async () => {
    if (!user || !embeddedWallet?.address) return;

    setStatus("proving");
    setProgress("Generating ZK proof of your domain...");
    setError(null);

    try {
      // Get JWT for domain extraction
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Failed to get access token");

      const parts = accessToken.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");
      const payload = JSON.parse(atob(parts[1]));

      // Extract domain from Google account
      const googleAccount = user.linkedAccounts?.find(
        (a) => a.type === "google_oauth"
      );
      const email =
        googleAccount?.email || user.email?.address || null;
      const domain = email ? email.split("@")[1] : "unknown";

      setProgress(`Proving domain: ${domain}...`);

      // Generate ZK proof
      const proof: ProofData = await generateZKProof(
        domain,
        embeddedWallet.address,
        payload.exp
      );

      setStatus("verifying");
      setProgress("Submitting proof for verification...");

      // Send to verify API
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proof.proof,
          publicSignals: proof.publicSignals,
          walletAddress: proof.walletAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.tier === "blacklisted") {
          // Redirect to verdict with blacklisted status
          window.location.href = `/verdict?tier=blacklisted`;
          return;
        }
        throw new Error(data.error || "Verification failed");
      }

      setStatus("done");
      setProgress("Proof verified!");

      // Store session info and redirect
      sessionStorage.setItem("sessionId", data.sessionId);
      sessionStorage.setItem("tier", data.tier);
      sessionStorage.setItem("domain", domain);
      sessionStorage.setItem("proofIsReal", String(proof.isReal));

      setTimeout(() => {
        window.location.href = `/verdict?tier=${data.tier}&session=${data.sessionId}`;
      }, 1000);
    } catch (err) {
      console.error("Proof flow error:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Proof generation failed");
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">
          {status === "error" ? "💥" : status === "done" ? "✅" : "🔐"}
        </div>

        <h1 className="text-2xl font-bold">
          {status === "idle" && "Preparing..."}
          {status === "proving" && "Generating ZK Proof"}
          {status === "verifying" && "Verifying Proof"}
          {status === "done" && "Proof Verified!"}
          {status === "error" && "Proof Failed"}
        </h1>

        <p className="text-zinc-400">{progress}</p>

        {(status === "proving" || status === "verifying") && (
          <div className="flex justify-center">
            <div className="animate-spin w-10 h-10 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
              {error}
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="text-xs text-zinc-600 space-y-1">
          <p>
            Wallet: {embeddedWallet?.address?.slice(0, 6)}...
            {embeddedWallet?.address?.slice(-4)}
          </p>
          <p>
            Email:{" "}
            {user?.linkedAccounts?.find((a) => a.type === "google_oauth")
              ?.email ||
              user?.email?.address ||
              "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { generateZKProof, type ProofData } from "@/lib/zkproof";

const STAGE_MESSAGES = [
  { text: "ANALYZING YOUR DOMAIN...", sub: "The Hotdog Council convenes" },
  { text: "CRUNCHING ZK MATH...", sub: "Grinding the proof sausage" },
  { text: "THE HOTDOG JUDGES YOU...", sub: "Are you wiener-worthy?" },
  { text: "SUBMITTING TO THE COUNCIL OF WIENERS...", sub: "Almost there..." },
];

export default function ProvePage() {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState<"idle" | "proving" | "verifying" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [subtext, setSubtext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  // Cycle through dramatic messages while proving
  useEffect(() => {
    if (status !== "proving") return;
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % STAGE_MESSAGES.length;
        setProgress(STAGE_MESSAGES[next].text);
        setSubtext(STAGE_MESSAGES[next].sub);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [status]);

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
    setProgress(STAGE_MESSAGES[0].text);
    setSubtext(STAGE_MESSAGES[0].sub);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Failed to get access token");

      const parts = accessToken.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");
      const payload = JSON.parse(atob(parts[1]));

      const googleAccount = user.linkedAccounts?.find(
        (a) => a.type === "google_oauth"
      );
      const email =
        googleAccount?.email || user.email?.address || null;
      const domain = email ? email.split("@")[1] : "unknown";

      const proof: ProofData = await generateZKProof(
        domain,
        embeddedWallet.address,
        payload.exp
      );

      setStatus("verifying");
      setProgress("VERDICT INCOMING...");
      setSubtext("The council has decided");

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
          window.location.href = `/verdict?tier=blacklisted`;
          return;
        }
        throw new Error(data.error || "Verification failed");
      }

      setStatus("done");
      setProgress("PROOF VERIFIED!");
      setSubtext("You have been judged");

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
        <div className="w-10 h-10 border-3 border-grease-stain border-t-mustard rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Scanline effect during proving */}
      {(status === "proving" || status === "verifying") && (
        <div className="scanline absolute inset-0 pointer-events-none" />
      )}

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Big emoji */}
        <div className="text-7xl">
          {status === "error" ? "💥" : status === "done" ? "✅" : "🔐"}
        </div>

        {/* Status headline */}
        <h1 className="font-bangers text-4xl md:text-5xl tracking-wide text-mustard comic-stroke">
          {status === "idle" && "PREPARING..."}
          {status === "proving" && progress}
          {status === "verifying" && progress}
          {status === "done" && progress}
          {status === "error" && "THE PROOF HAS FAILED"}
        </h1>

        {/* Subtext */}
        <p className="text-napkin-gray text-lg italic">
          {status === "error"
            ? "The hotdog is disappointed."
            : subtext}
        </p>

        {/* Progress animation */}
        {(status === "proving" || status === "verifying") && (
          <div className="space-y-6">
            {/* Hotdog assembly progress */}
            <div className="flex justify-center items-center gap-2 text-4xl">
              <span className="animate-bounce" style={{ animationDelay: "0s" }}>🌭</span>
              <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>🌭</span>
              <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>🌭</span>
            </div>

            {/* Progress bar */}
            <div className="w-64 mx-auto h-3 bg-grill-smoke rounded-full overflow-hidden border border-grease-stain">
              <div
                className="h-full bg-gradient-to-r from-mustard to-stand-orange rounded-full transition-all duration-1000"
                style={{
                  width: status === "verifying" ? "90%" : `${Math.min(30 + stageIndex * 20, 70)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="space-y-4 animate-shake">
            <div className="bg-ketchup/10 border-2 border-ketchup/30 rounded-2xl p-4">
              <p className="text-ketchup text-sm font-mono">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setStatus("idle");
                  setStageIndex(0);
                  setError(null);
                }}
                className="px-8 py-3 bg-stand-orange hover:bg-stand-orange/80 text-bun-white font-bangers text-xl rounded-xl transform rotate-[1deg] transition-all cursor-pointer"
              >
                TRY AGAIN
              </button>
              <button
                onClick={logout}
                className="px-8 py-3 border border-grease-stain hover:border-napkin-gray text-napkin-gray font-bangers text-xl rounded-xl transition-all cursor-pointer"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        )}

        {/* Wallet info */}
        <div className="text-xs text-pencil-scrawl font-mono space-y-1">
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

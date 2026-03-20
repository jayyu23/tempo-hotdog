"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Image from "next/image";

function VerdictContent() {
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const searchParams = useSearchParams();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const tier = searchParams.get("tier") || "regular";
  const sessionId = searchParams.get("session") || "";
  const [showContent, setShowContent] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(tier === "blacklisted");
  const [proofIsReal, setProofIsReal] = useState(false);

  const downloadProof = () => {
    const raw = sessionStorage.getItem("zkProof");
    if (!raw) return;
    const proof = JSON.parse(raw);
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zkproof-${tier}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Sequence the reveal
    const t1 = setTimeout(() => setShowContent(true), tier === "blacklisted" ? 400 : 200);
    const t2 = setTimeout(() => setShowStamp(true), tier === "blacklisted" ? 800 : 500);
    const t3 = tier === "blacklisted"
      ? setTimeout(() => setShowRedFlash(false), 300)
      : undefined;
    setProofIsReal(sessionStorage.getItem("proofIsReal") === "true");
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [tier]);

  const tierConfig: Record<string, {
    title: string;
    subtitle: string;
    price: string;
    memeImage: string;
    textColor: string;
    glowClass: string;
    glowColor: string;
    buttonText: string;
    buttonClass: string;
    flavorText: string;
    canEnter: boolean;
  }> = {
    vip: {
      title: "YOU MAY BUY CHEAP",
      subtitle: "VIP ACCESS GRANTED",
      price: "$0.05/hotdog",
      memeImage: "/images/cheap-hotdog.jpg",
      textColor: "text-relish",
      glowClass: "neon-text-green",
      glowColor: "#39FF14",
      buttonText: "GET YOUR DISCOUNT DOGS",
      buttonClass: "bg-relish text-night-cart animate-pulse-glow",
      flavorText: "You are a friend of the wiener",
      canEnter: true,
    },
    regular: {
      title: "YOU MAY BUY",
      subtitle: "REGULAR ACCESS",
      price: "$0.10/hotdog",
      memeImage: "/images/hotdog.jpg",
      textColor: "text-mustard",
      glowClass: "neon-text",
      glowColor: "#FFD700",
      buttonText: "STEP RIGHT UP",
      buttonClass: "bg-stand-orange text-bun-white animate-pulse-glow-mustard",
      flavorText: "You may purchase tube meat at standard rates",
      canEnter: true,
    },
    blacklisted: {
      title: "YOU MAY NOT BUY",
      subtitle: "ACCESS DENIED",
      price: "N/A",
      memeImage: "/images/not-hotdog.jpg",
      textColor: "text-ketchup",
      glowClass: "neon-text-red",
      glowColor: "#FF2E2E",
      buttonText: "LEAVE IN SHAME",
      buttonClass: "border-2 border-grease-stain text-napkin-gray hover:border-ketchup/50",
      flavorText: "The wiener rejects you. Begone.",
      canEnter: false,
    },
  };

  const config = tierConfig[tier] || tierConfig.regular;

  return (
    <div className={`relative min-h-screen overflow-hidden ${tier === "blacklisted" ? "animate-shake" : ""}`}>
      {/* Red flash for blacklisted */}
      {showRedFlash && (
        <div className="fixed inset-0 bg-ketchup z-50 animate-[redFlash_0.3s_ease-out_forwards]" />
      )}

      {/* Floating glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 animate-float"
          style={{ background: config.glowColor, top: "10%", left: "-10%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-15 animate-float"
          style={{ background: config.glowColor, bottom: "5%", right: "-8%", animationDelay: "1.5s" }}
        />
        <div
          className="absolute w-[250px] h-[250px] rounded-full blur-[80px] opacity-10 animate-float"
          style={{ background: config.glowColor, top: "50%", left: "50%", animationDelay: "3s" }}
        />
      </div>

      {/* Starburst for VIP */}
      {tier === "vip" && <div className="starburst" />}

      {/* Sign out button */}
      <button
        onClick={() => logout().then(() => { window.location.href = "/"; })}
        className="absolute top-4 right-4 z-20 px-4 py-2 border border-grease-stain hover:border-napkin-gray text-napkin-gray text-sm rounded-lg transition-all cursor-pointer backdrop-blur-sm bg-night-cart/50"
      >
        Sign Out
      </button>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Title */}
          {showContent && (
            <div className="space-y-4 animate-slide-up">
              <h1
                className={`font-bangers text-6xl md:text-8xl tracking-wide comic-stroke ${config.textColor} ${config.glowClass}`}
              >
                {config.title}
              </h1>
              <p className="font-bangers text-2xl text-bun-white/80 tracking-wider">
                {config.subtitle}
              </p>
            </div>
          )}

          {/* Meme image — displayed prominently */}
          {showContent && (
            <div className="animate-slide-up relative" style={{ animationDelay: "0.1s" }}>
              <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden comic-border transform rotate-[1deg]">
                <Image
                  src={config.memeImage}
                  alt={tier}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                  priority
                />
                <div className="halftone absolute inset-0" />
              </div>

              {/* DENIED stamp overlaid on image for blacklisted */}
              {tier === "blacklisted" && showStamp && (
                <div className="absolute inset-0 flex items-center justify-center animate-stamp-in">
                  <span className="inline-block font-bangers text-5xl md:text-6xl text-ketchup border-4 border-ketchup px-6 py-2 rounded-lg bg-night-cart/60 backdrop-blur-sm">
                    DENIED
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Flavor text */}
          {showContent && (
            <p className="text-napkin-gray text-lg italic animate-slide-up" style={{ animationDelay: "0.2s" }}>
              &ldquo;{config.flavorText}&rdquo;
            </p>
          )}

          {/* Price card */}
          {showContent && config.canEnter && (
            <div
              className="bg-grill-smoke/90 border-2 border-grease-stain rounded-2xl p-6 space-y-4 animate-slide-up backdrop-blur-sm"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex justify-between items-center">
                <span className="text-napkin-gray">Tier</span>
                <span className={`font-bangers text-xl uppercase ${config.textColor}`}>
                  {tier}
                </span>
              </div>
              <div className="border-t border-grease-stain" />
              <div className="flex justify-between items-center">
                <span className="text-napkin-gray">Price per hotdog</span>
                <span className="font-bangers text-xl text-bun-white">{config.price}</span>
              </div>
              <div className="border-t border-grease-stain" />
              <div className="flex justify-between items-center">
                <span className="text-napkin-gray">Payment</span>
                <span className="text-napkin-gray text-sm font-mono">
                  Tempo MPP Streaming
                </span>
              </div>
              <div className="border-t border-grease-stain" />
              <div className="flex justify-between items-center">
                <span className="text-napkin-gray">ZK Proof</span>
                <button
                  onClick={downloadProof}
                  className={`text-sm font-bangers px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    proofIsReal
                      ? "text-relish border-relish/30 hover:bg-relish/10"
                      : "text-mustard border-mustard/30 hover:bg-mustard/10"
                  }`}
                >
                  {proofIsReal ? "DOWNLOAD (REAL)" : "DOWNLOAD (DEMO)"}
                </button>
              </div>
              <div className="border-t border-grease-stain" />
              <details className="text-xs font-mono">
                <summary className="cursor-pointer text-napkin-gray hover:text-bun-white transition-colors">
                  View proof data
                </summary>
                <div className="mt-2 p-3 bg-night-cart/50 border border-grease-stain rounded-xl text-left text-pencil-scrawl break-all space-y-2 max-h-64 overflow-y-auto">
                  {(() => {
                    const raw = sessionStorage.getItem("zkProof");
                    if (!raw) return <p>No proof data available</p>;
                    const proof = JSON.parse(raw);
                    return (
                      <>
                        <p className="text-napkin-gray font-bangers text-sm">Public Signals</p>
                        <p><span className="text-napkin-gray">domainHash:</span> {proof.publicSignals?.[0]}</p>
                        <p><span className="text-napkin-gray">nullifier:</span> {proof.publicSignals?.[1]}</p>
                        <p><span className="text-napkin-gray">walletBinding:</span> {proof.publicSignals?.[2]}</p>
                        <div className="border-t border-grease-stain/50 my-1" />
                        <p className="text-napkin-gray font-bangers text-sm">Proof ({proof.proof?.protocol})</p>
                        <p><span className="text-napkin-gray">pi_a:</span> {proof.proof?.pi_a?.slice(0, 2).map((v: string) => v.slice(0, 16) + "...").join(", ")}</p>
                        <p><span className="text-napkin-gray">pi_b:</span> {proof.proof?.pi_b?.slice(0, 2).map((arr: string[]) => "[" + arr.map((v: string) => v.slice(0, 12) + "...").join(", ") + "]").join(", ")}</p>
                        <p><span className="text-napkin-gray">pi_c:</span> {proof.proof?.pi_c?.slice(0, 2).map((v: string) => v.slice(0, 16) + "...").join(", ")}</p>
                        <div className="border-t border-grease-stain/50 my-1" />
                        <p className="text-napkin-gray font-bangers text-sm">Metadata</p>
                        <p><span className="text-napkin-gray">method:</span> {proof.method}</p>
                        <p><span className="text-napkin-gray">wallet:</span> {proof.walletAddress}</p>
                        <p><span className="text-napkin-gray">real proof:</span> {proof.isReal ? "yes" : "no (demo)"}</p>
                        <p><span className="text-napkin-gray">generated:</span> {new Date(proof.generatedAt).toLocaleString()}</p>
                      </>
                    );
                  })()}
                </div>
              </details>
              {embeddedWallet && (
                <>
                  <div className="border-t border-grease-stain" />
                  <details className="font-mono">
                    <summary className="cursor-pointer text-napkin-gray hover:text-bun-white transition-colors text-sm flex justify-between items-center">
                      <span>Wallet</span>
                      <span className="text-xs">{embeddedWallet.address.slice(0, 6)}...{embeddedWallet.address.slice(-4)}</span>
                    </summary>
                    <div className="mt-3 p-4 bg-night-cart/50 border border-grease-stain rounded-xl space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-bun-white break-all">
                          {embeddedWallet.address}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(embeddedWallet.address)}
                          className="shrink-0 px-3 py-1.5 bg-mustard/20 hover:bg-mustard/30 text-mustard text-xs font-bangers rounded-lg transition-colors cursor-pointer"
                        >
                          COPY
                        </button>
                      </div>
                      <p className="text-pencil-scrawl text-xs">Tempo Mainnet (4217)</p>
                    </div>
                  </details>
                </>
              )}
            </div>
          )}

          {/* Action button */}
          {showContent && (
            <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
              {config.canEnter ? (
                <button
                  onClick={() => {
                    window.location.href = `/stand?session=${sessionId}`;
                  }}
                  className={`w-full py-5 px-6 font-bangers text-2xl rounded-2xl transform rotate-[-1deg] hover:rotate-[1deg] transition-all cursor-pointer ${config.buttonClass}`}
                >
                  🌭 {config.buttonText}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-ketchup/80 text-sm">
                    Not hotdog. Not welcome.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => (window.location.href = "/")}
                      className={`px-8 py-3 rounded-xl text-sm transition-all cursor-pointer ${config.buttonClass}`}
                    >
                      {config.buttonText}
                    </button>
                    <button
                      onClick={downloadProof}
                      className="px-6 py-3 rounded-xl text-sm text-napkin-gray border border-grease-stain hover:border-napkin-gray transition-all cursor-pointer font-bangers"
                    >
                      DOWNLOAD PROOF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerdictPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-3 border-grease-stain border-t-mustard rounded-full animate-spin" />
        </div>
      }
    >
      <VerdictContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerdictContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "regular";
  const sessionId = searchParams.get("session") || "";

  const tierConfig: Record<string, { emoji: string; title: string; subtitle: string; price: string; color: string; canEnter: boolean }> = {
    vip: {
      emoji: "✅",
      title: "YOU MAY BUY CHEAP",
      subtitle: "VIP Access Granted",
      price: "$0.50/hotdog",
      color: "text-green-400",
      canEnter: true,
    },
    regular: {
      emoji: "🌭",
      title: "YOU MAY BUY",
      subtitle: "Regular Access",
      price: "$1.00/hotdog",
      color: "text-blue-400",
      canEnter: true,
    },
    blacklisted: {
      emoji: "❌",
      title: "YOU MAY NOT BUY",
      subtitle: "Access Denied",
      price: "N/A",
      color: "text-red-400",
      canEnter: false,
    },
  };

  const config = tierConfig[tier] || tierConfig.regular;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Big emoji reveal */}
        <div className="text-8xl animate-bounce">{config.emoji}</div>

        {/* Tier title */}
        <div className="space-y-2">
          <h1 className={`text-4xl font-bold tracking-tight ${config.color}`}>
            {config.title}
          </h1>
          <p className="text-zinc-400 text-xl">{config.subtitle}</p>
        </div>

        {/* Price info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Tier</span>
            <span
              className={`font-mono font-bold uppercase ${config.color}`}
            >
              {tier}
            </span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Price per hotdog</span>
            <span className="font-mono font-bold">{config.price}</span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Payment</span>
            <span className="text-zinc-300 text-sm">
              Tempo MPP Streaming
            </span>
          </div>
        </div>

        {/* Action */}
        {config.canEnter ? (
          <button
            onClick={() => {
              window.location.href = `/stand?session=${sessionId}`;
            }}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl transition-colors"
          >
            🌭 Enter the Stand
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-red-400 text-sm">
              Your domain has been blacklisted by the admin.
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-2 border border-zinc-700 hover:border-zinc-600 rounded-lg text-sm text-zinc-400 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerdictPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
        </div>
      }
    >
      <VerdictContent />
    </Suspense>
  );
}

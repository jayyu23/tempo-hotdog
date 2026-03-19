"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();

  // Redirect to /prove if already authenticated
  if (ready && authenticated) {
    window.location.href = "/prove";
    return null;
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <div className="text-6xl">🌭</div>
          <h1 className="text-4xl font-bold tracking-tight">
            Hotdog <span className="text-orange-500">Not</span> Hotdog
          </h1>
          <p className="text-zinc-400 text-lg">
            ZK-gated hotdog stand on Tempo
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4 text-left">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-400 text-sm font-bold">ZK</span>
            </div>
            <div>
              <p className="font-medium text-sm">Privacy-first identity</p>
              <p className="text-zinc-500 text-sm">
                Prove your email domain without revealing your identity
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 text-sm">$</span>
            </div>
            <div>
              <p className="font-medium text-sm">Tiered pricing</p>
              <p className="text-zinc-500 text-sm">
                VIP ($0.50) or Regular ($1.00) — based on your domain
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-sm font-mono">MPP</span>
            </div>
            <div>
              <p className="font-medium text-sm">Streaming payments</p>
              <p className="text-zinc-500 text-sm">
                Pay per hotdog via Tempo Machine Payments Protocol
              </p>
            </div>
          </div>
        </div>

        {/* Login button */}
        <button
          onClick={login}
          className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

        <p className="text-xs text-zinc-600">
          Powered by Privy + Tempo Chain
        </p>
      </div>
    </div>
  );
}

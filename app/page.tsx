"use client";

import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();

  if (ready && authenticated) {
    window.location.href = "/prove";
    return null;
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-night-cart">
        <div className="w-10 h-10 border-3 border-grease-stain border-t-mustard rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Starburst background */}
      <div className="starburst" />

      {/* Content */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Jian Yang hero image */}
        <div className="relative inline-block animate-float">
          <div className="relative w-72 h-40 md:w-96 md:h-52 mx-auto rounded-2xl overflow-hidden comic-border transform rotate-[-2deg]">
            <Image
              src="/images/jianyang.png"
              alt="SeeFood Founder"
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width: 768px) 288px, 384px"
              priority
            />
            <div className="halftone absolute inset-0" />
          </div>
          {/* Caption badge */}
          <div className="absolute -bottom-3 -right-4 bg-ketchup text-bun-white font-bangers text-sm px-4 py-1.5 rounded-full transform rotate-[6deg] comic-border border-2!">
            SEEFOOD CEO
          </div>
        </div>

        {/* Neon sign title */}
        <div className="space-y-2">
          <h1 className="font-bangers text-6xl md:text-7xl tracking-wide animate-neon-flicker text-mustard">
            HOTDOG
          </h1>
          <h1 className="font-bangers text-5xl md:text-6xl tracking-wide text-stand-orange neon-text">
            NOT HOTDOG
          </h1>
        </div>

        <p className="text-napkin-gray text-lg italic">
          &ldquo;Prove your domain. Get your dog.&rdquo;
        </p>

        {/* Feature stickers */}
        <div className="flex justify-center gap-3 flex-wrap">
          <span className="inline-block bg-relish/15 text-relish font-bangers text-sm px-4 py-2 rounded-full transform rotate-[-3deg] border border-relish/30">
            ZK PRIVACY
          </span>
          <span className="inline-block bg-mustard/15 text-mustard font-bangers text-sm px-4 py-2 rounded-full transform rotate-[2deg] border border-mustard/30">
            TIERED PRICING
          </span>
          <span className="inline-block bg-stand-orange/15 text-stand-orange font-bangers text-sm px-4 py-2 rounded-full transform rotate-[-1deg] border border-stand-orange/30">
            TEMPO MPP
          </span>
        </div>

        {/* Login button */}
        <button
          onClick={login}
          className="w-full py-4 px-6 bg-mustard hover:bg-mustard/90 text-night-cart font-bangers text-2xl rounded-2xl transform rotate-[-1deg] hover:rotate-[1deg] transition-all duration-200 comic-border animate-wobble-hover cursor-pointer"
        >
          SIGN IN WITH GOOGLE
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 text-pencil-scrawl text-xs font-mono tracking-widest uppercase">
          <span>Powered by Privy + Tempo Chain</span>
          <span>·</span>
          <a
            href="/admin"
            className="hover:text-napkin-gray transition-colors underline underline-offset-2"
          >
            Admin
          </a>
        </div>
      </div>
    </div>
  );
}

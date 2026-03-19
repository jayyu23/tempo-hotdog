"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Rule {
  domainHash: string;
  domain: string;
  tier: string;
}

const TIER_BADGE_STYLES: Record<string, string> = {
  vip: "text-relish bg-relish/15 border-relish/30",
  regular: "text-mustard bg-mustard/15 border-mustard/30",
  blacklisted: "text-ketchup bg-ketchup/15 border-ketchup/30",
};

export default function AdminRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newTier, setNewTier] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    }),
    [adminSecret]
  );

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rules", { headers: headers() });
      if (res.status === 403) {
        setIsAuthed(false);
        setError("Invalid admin secret");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules");
    }
  }, [headers]);

  const handleAuth = async () => {
    if (!adminSecret) return;
    setIsAuthed(true);
    await fetchRules();
  };

  const addRule = async () => {
    if (!newDomain) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ domain: newDomain, tier: newTier }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add rule");
      }
      setNewDomain("");
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rule");
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (domainHash: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ domainHash }),
      });
      if (!res.ok) throw new Error("Failed to delete rule");
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) fetchRules();
  }, [isAuthed, fetchRules]);

  // Auth gate
  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="font-bangers text-3xl text-mustard">THE BACK OFFICE</h1>
          <p className="text-napkin-gray text-sm">
            Enter admin secret to manage the wiener empire
          </p>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="Admin secret..."
            className="w-full px-4 py-3 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm text-bun-white focus:outline-none focus:border-mustard transition-colors"
          />
          {error && (
            <p className="text-ketchup text-sm font-mono">{error}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full py-3 bg-mustard hover:bg-mustard/90 text-night-cart font-bangers text-xl rounded-xl transform rotate-[-1deg] hover:rotate-[1deg] transition-all cursor-pointer"
          >
            AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden comic-border border-2! shrink-0">
            <Image
              src="/images/jianyang.png"
              alt="Admin"
              fill
              className="object-cover object-top"
            />
          </div>
          <div>
            <h1 className="font-bangers text-3xl text-mustard">WIENER MANAGEMENT CONSOLE</h1>
            <p className="text-napkin-gray text-sm">
              Domain &rarr; tier mappings
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAuthed(false)}
          className="text-sm text-napkin-gray hover:text-ketchup transition-colors font-bangers cursor-pointer"
        >
          🔒 LOCK
        </button>
      </div>

      {/* Add rule form */}
      <div className="bg-grill-smoke border-2 border-grease-stain rounded-2xl p-6 space-y-4">
        <h2 className="font-bangers text-lg text-stand-orange tracking-wide">
          ADD NEW DOMAIN RULE
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. harvard.edu"
            className="flex-1 px-4 py-2 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm font-mono text-bun-white focus:outline-none focus:border-mustard transition-colors"
          />
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
            className="px-4 py-2 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm font-bangers text-bun-white focus:outline-none focus:border-mustard transition-colors cursor-pointer"
          >
            <option value="vip">VIP</option>
            <option value="regular">REGULAR</option>
            <option value="blacklisted">BLACKLISTED</option>
          </select>
          <button
            onClick={addRule}
            disabled={loading || !newDomain}
            className="px-6 py-2 bg-stand-orange hover:bg-stand-orange/80 disabled:bg-grease-stain disabled:text-pencil-scrawl text-bun-white font-bangers text-lg rounded-xl transition-all cursor-pointer transform rotate-[1deg] hover:rotate-[-1deg]"
          >
            STAMP IT
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-shake">
          <p className="text-ketchup text-sm bg-ketchup/10 border border-ketchup/30 rounded-xl p-3 font-mono">
            🌭 {error}
          </p>
        </div>
      )}

      {/* Rules table */}
      <div className="bg-grill-smoke border-2 border-grease-stain rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-grease-stain">
              <th className="text-left px-6 py-3 font-bangers text-sm text-napkin-gray tracking-wider">
                DOMAIN
              </th>
              <th className="text-left px-6 py-3 font-bangers text-sm text-napkin-gray tracking-wider">
                TIER
              </th>
              <th className="text-right px-6 py-3 font-bangers text-sm text-napkin-gray tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-pencil-scrawl text-sm italic"
                >
                  No rules yet. The stand is open to all.
                </td>
              </tr>
            ) : (
              rules.map((rule, i) => (
                <tr
                  key={rule.domainHash}
                  className={`border-b border-grease-stain/50 hover:bg-wrapper-paper/30 transition-colors ${
                    i % 2 === 0 ? "bg-grill-smoke" : "bg-wrapper-paper/20"
                  }`}
                >
                  <td className="px-6 py-3 font-mono text-sm text-bun-white">
                    {rule.domain}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block font-bangers text-xs uppercase px-3 py-1 rounded-full border transform ${
                        TIER_BADGE_STYLES[rule.tier] || TIER_BADGE_STYLES.regular
                      }`}
                      style={{
                        transform: `rotate(${(i % 3 - 1) * 3}deg)`,
                      }}
                    >
                      {rule.tier === "blacklisted" ? `☠ ${rule.tier}` : rule.tier}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => deleteRule(rule.domainHash)}
                      disabled={loading}
                      className="text-ketchup hover:text-ketchup/70 text-sm font-bangers transition-colors cursor-pointer"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

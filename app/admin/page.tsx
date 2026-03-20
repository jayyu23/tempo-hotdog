"use client";

import { useState, useEffect, useCallback } from "react";

interface Rule {
  domainHash: string;
  domain: string;
  tier: string;
}

type Tier = "vip" | "regular" | "blacklisted";

const TIERS: { key: Tier; label: string; icon: string; desc: string }[] = [
  { key: "vip", label: "VIP", icon: "⭐", desc: "Half-price dogs ($0.05)" },
  {
    key: "regular",
    label: "REGULAR",
    icon: "🌭",
    desc: "Standard price ($0.10)",
  },
  {
    key: "blacklisted",
    label: "BLACKLISTED",
    icon: "☠️",
    desc: "No service — 403'd",
  },
];

const TIER_STYLES: Record<
  string,
  { badge: string; border: string; bg: string; accent: string }
> = {
  vip: {
    badge: "text-relish bg-relish/15 border-relish/30",
    border: "border-relish/30",
    bg: "bg-relish/5",
    accent: "text-relish",
  },
  regular: {
    badge: "text-mustard bg-mustard/15 border-mustard/30",
    border: "border-mustard/30",
    bg: "bg-mustard/5",
    accent: "text-mustard",
  },
  blacklisted: {
    badge: "text-ketchup bg-ketchup/15 border-ketchup/30",
    border: "border-ketchup/30",
    bg: "bg-ketchup/5",
    accent: "text-ketchup",
  },
};

export default function AdminDashboard() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [adminPwd, setAdminPwd] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Add rule state
  const [newDomain, setNewDomain] = useState("");
  const [newTier, setNewTier] = useState<Tier>("regular");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing state
  const [editingHash, setEditingHash] = useState<string | null>(null);
  const [editTier, setEditTier] = useState<Tier>("regular");

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-pwd": adminPwd,
    }),
    [adminPwd]
  );

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rules", { headers: headers() });
      if (res.status === 403) {
        setIsAuthed(false);
        sessionStorage.removeItem("admin_pwd");
        setAuthError("Session expired");
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

  // Restore session from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pwd");
    if (stored) {
      setAdminPwd(stored);
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) fetchRules();
  }, [isAuthed, fetchRules]);

  const handleLogin = async () => {
    if (!adminPwd) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        headers: {
          "Content-Type": "application/json",
          "x-admin-pwd": adminPwd,
        },
      });
      if (res.status === 403) {
        setAuthError("Wrong password");
        return;
      }
      if (!res.ok) throw new Error("Server error");
      sessionStorage.setItem("admin_pwd", adminPwd);
      setIsAuthed(true);
      const data = await res.json();
      setRules(data);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Failed to authenticate"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setAdminPwd("");
    sessionStorage.removeItem("admin_pwd");
    setRules([]);
  };

  const addRule = async () => {
    if (!newDomain.trim()) return;
    setAddLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase(), tier: newTier }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add rule");
      }
      setSuccessMsg(`Added ${newDomain.trim()} as ${newTier.toUpperCase()}`);
      setNewDomain("");
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rule");
    } finally {
      setAddLoading(false);
    }
  };

  const updateRule = async (domain: string, tier: Tier) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ domain, tier }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update rule");
      }
      setEditingHash(null);
      setSuccessMsg(`Moved ${domain} to ${tier.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule");
    }
  };

  const deleteRule = async (domainHash: string, domain: string) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ domainHash }),
      });
      if (!res.ok) throw new Error("Failed to delete rule");
      setSuccessMsg(`Removed ${domain}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  // Group rules by tier
  const grouped: Record<Tier, Rule[]> = { vip: [], regular: [], blacklisted: [] };
  rules.forEach((r) => {
    const t = r.tier as Tier;
    if (grouped[t]) grouped[t].push(r);
    else grouped.regular.push(r);
  });

  // --- LOGIN SCREEN ---
  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-sm w-full space-y-8 text-center">
          <div>
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="font-bangers text-4xl text-mustard neon-text">
              THE BACK OFFICE
            </h1>
            <p className="text-napkin-gray text-sm mt-2">
              Wiener management requires clearance
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={adminPwd}
              onChange={(e) => {
                setAdminPwd(e.target.value);
                setAuthError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password..."
              autoFocus
              className="w-full px-4 py-3 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm text-bun-white placeholder:text-pencil-scrawl focus:outline-none focus:border-mustard transition-colors"
            />

            {authError && (
              <div className="animate-shake">
                <p className="text-ketchup text-sm font-mono bg-ketchup/10 border border-ketchup/30 rounded-lg p-2">
                  {authError}
                </p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={authLoading || !adminPwd}
              className="w-full py-3 bg-mustard hover:bg-mustard/90 disabled:bg-grease-stain disabled:text-pencil-scrawl text-night-cart font-bangers text-xl rounded-xl transform rotate-[-1deg] hover:rotate-[1deg] transition-all cursor-pointer comic-border"
            >
              {authLoading ? "CHECKING..." : "ENTER THE BACK OFFICE"}
            </button>
          </div>

          <a
            href="/"
            className="inline-block text-pencil-scrawl text-xs hover:text-napkin-gray underline underline-offset-2 transition-colors"
          >
            Back home
          </a>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bangers text-4xl text-mustard neon-text">
            WIENER COMMAND CENTER
          </h1>
          <p className="text-napkin-gray text-sm mt-1">
            Domain access control &mdash; {rules.length} rule{rules.length !== 1 && "s"} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 border-2 border-grease-stain hover:border-mustard/50 rounded-xl text-sm text-napkin-gray hover:text-mustard font-bangers transition-all"
          >
            BACK HOME
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border-2 border-grease-stain hover:border-ketchup/50 rounded-xl text-sm text-napkin-gray hover:text-ketchup font-bangers transition-all cursor-pointer"
          >
            LOCK UP
          </button>
        </div>
      </div>

      {/* Tier summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {TIERS.map((t) => (
          <div
            key={t.key}
            className={`bg-grill-smoke border-2 ${TIER_STYLES[t.key].border} rounded-2xl p-4 text-center`}
          >
            <div className="text-3xl mb-1">{t.icon}</div>
            <div className={`font-bangers text-2xl ${TIER_STYLES[t.key].accent}`}>
              {grouped[t.key].length}
            </div>
            <div className="font-bangers text-xs text-napkin-gray tracking-wider">
              {t.label}
            </div>
            <div className="text-pencil-scrawl text-xs mt-1">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Add new rule */}
      <div className="bg-grill-smoke border-2 border-grease-stain rounded-2xl p-6 space-y-4">
        <h2 className="font-bangers text-lg text-stand-orange tracking-wide">
          ADD DOMAIN RULE
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            placeholder="e.g. harvard.edu"
            className="flex-1 px-4 py-2.5 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm font-mono text-bun-white placeholder:text-pencil-scrawl focus:outline-none focus:border-mustard transition-colors"
          />
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value as Tier)}
            className="px-4 py-2.5 bg-wrapper-paper border-2 border-grease-stain rounded-xl text-sm font-bangers text-bun-white focus:outline-none focus:border-mustard transition-colors cursor-pointer"
          >
            <option value="vip">VIP</option>
            <option value="regular">REGULAR</option>
            <option value="blacklisted">BLACKLISTED</option>
          </select>
          <button
            onClick={addRule}
            disabled={addLoading || !newDomain.trim()}
            className="px-6 py-2.5 bg-stand-orange hover:bg-stand-orange/80 disabled:bg-grease-stain disabled:text-pencil-scrawl text-bun-white font-bangers text-lg rounded-xl transition-all cursor-pointer"
          >
            {addLoading ? "..." : "ADD"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="text-relish text-sm bg-relish/10 border border-relish/30 rounded-xl p-3 font-mono text-center">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="animate-shake">
          <p className="text-ketchup text-sm bg-ketchup/10 border border-ketchup/30 rounded-xl p-3 font-mono text-center">
            {error}
          </p>
        </div>
      )}

      {/* Domain lists by tier */}
      {TIERS.map((t) => (
        <div key={t.key} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{t.icon}</span>
            <h2 className={`font-bangers text-xl ${TIER_STYLES[t.key].accent} tracking-wide`}>
              {t.label}
            </h2>
            <span className="text-pencil-scrawl text-sm font-mono">
              ({grouped[t.key].length})
            </span>
          </div>

          <div className={`bg-grill-smoke border-2 ${TIER_STYLES[t.key].border} rounded-2xl overflow-hidden`}>
            {grouped[t.key].length === 0 ? (
              <div className="px-6 py-6 text-center text-pencil-scrawl text-sm italic">
                {t.key === "vip" && "No VIP domains yet. Add one above."}
                {t.key === "regular" && "No explicit regular rules. Unknown domains default here."}
                {t.key === "blacklisted" && "No blacklisted domains. Everyone's welcome... for now."}
              </div>
            ) : (
              <div className="divide-y divide-grease-stain/50">
                {grouped[t.key].map((rule) => (
                  <div
                    key={rule.domainHash}
                    className="flex items-center justify-between px-6 py-3 hover:bg-wrapper-paper/20 transition-colors group"
                  >
                    <span className="font-mono text-sm text-bun-white">
                      {rule.domain}
                    </span>
                    <div className="flex items-center gap-2">
                      {editingHash === rule.domainHash ? (
                        <>
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value as Tier)}
                            className="px-3 py-1 bg-wrapper-paper border border-grease-stain rounded-lg text-xs font-bangers text-bun-white focus:outline-none cursor-pointer"
                          >
                            <option value="vip">VIP</option>
                            <option value="regular">REGULAR</option>
                            <option value="blacklisted">BLACKLISTED</option>
                          </select>
                          <button
                            onClick={() => updateRule(rule.domain, editTier)}
                            className="text-relish text-xs font-bangers hover:text-relish/70 transition-colors cursor-pointer"
                          >
                            SAVE
                          </button>
                          <button
                            onClick={() => setEditingHash(null)}
                            className="text-napkin-gray text-xs font-bangers hover:text-bun-white transition-colors cursor-pointer"
                          >
                            CANCEL
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingHash(rule.domainHash);
                              setEditTier(rule.tier as Tier);
                            }}
                            className="text-napkin-gray text-xs font-bangers hover:text-mustard transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            MOVE
                          </button>
                          <button
                            onClick={() => deleteRule(rule.domainHash, rule.domain)}
                            className="text-napkin-gray text-xs font-bangers hover:text-ketchup transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            DELETE
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div className="text-center text-pencil-scrawl text-xs pb-4">
        Domains not listed default to <span className="text-mustard font-bangers">REGULAR</span> tier
      </div>
    </div>
  );
}

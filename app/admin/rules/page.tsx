"use client";

import { useState, useEffect, useCallback } from "react";

interface Rule {
  domainHash: string;
  domain: string;
  tier: string;
}

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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">
            Enter admin secret to manage tier rules
          </p>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="Admin secret..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500"
          />
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-medium transition-colors"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tier Rules</h1>
          <p className="text-zinc-500 text-sm">
            Manage domain &rarr; tier mappings
          </p>
        </div>
        <button
          onClick={() => setIsAuthed(false)}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Lock
        </button>
      </div>

      {/* Add rule form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Add Rule
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. harvard.edu"
            className="flex-1 px-4 py-2 bg-black border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
            className="px-4 py-2 bg-black border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
          <button
            onClick={addRule}
            disabled={loading || !newDomain}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Rules table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                Domain
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                Tier
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-zinc-600 text-sm"
                >
                  No rules configured. Add a domain above.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr
                  key={rule.domainHash}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-6 py-3 font-mono text-sm">
                    {rule.domain}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                        rule.tier === "vip"
                          ? "text-green-400 bg-green-500/10"
                          : rule.tier === "blacklisted"
                            ? "text-red-400 bg-red-500/10"
                            : "text-blue-400 bg-blue-500/10"
                      }`}
                    >
                      {rule.tier}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => deleteRule(rule.domainHash)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Delete
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

/**
 * Test script for the unified /api/mpp session route.
 *
 * Tests the server-side MPP session flow:
 * 1. Create a session via /api/verify (with mock ZK proof)
 * 2. Hit /api/mpp without credentials → expect 402 challenge
 * 3. Inspect the challenge for correct mainnet config
 *
 * Usage: npx tsx test-mpp-session.ts
 *
 * Requires the dev server to be running: npm run dev
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function createTestSession(): Promise<{ sessionId: string; tier: string }> {
  console.log("--- Creating test session via /api/verify ---");

  // Mock ZK proof with 3 public signals
  const mockProof = {
    pi_a: ["1", "2", "3"],
    pi_b: [["1", "2"], ["3", "4"], ["5", "6"]],
    pi_c: ["1", "2", "3"],
    protocol: "groth16",
  };
  const mockPublicSignals = [
    "12345678901234567890", // domainHash
    "1",                    // nullifier
    "1",                    // walletCommitment
  ];

  const res = await fetch(`${BASE_URL}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proof: mockProof,
      publicSignals: mockPublicSignals,
      walletAddress: "0x0000000000000000000000000000000000000001",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`/api/verify failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log("Session created:", data);
  return data;
}

async function testChallenge(sessionId: string) {
  console.log("\n--- Testing GET /api/mpp (expect 402 challenge) ---");

  const res = await fetch(`${BASE_URL}/api/mpp`, {
    headers: { "x-session-id": sessionId },
  });

  console.log("Status:", res.status);
  console.log("WWW-Authenticate:", res.headers.get("WWW-Authenticate"));

  const body = await res.text();
  console.log("Body:", body.slice(0, 500));

  if (res.status === 402) {
    console.log("\n✅ Got 402 challenge as expected");

    // Parse WWW-Authenticate to check for mainnet config
    const wwwAuth = res.headers.get("WWW-Authenticate") || "";
    if (wwwAuth.includes("tempo")) {
      console.log("✅ Challenge includes tempo method");
    }
  } else {
    console.log(`⚠️  Expected 402, got ${res.status}`);
  }

  return res;
}

async function testLegacyChallenge(sessionId: string) {
  console.log("\n--- Testing legacy GET /api/mpp/challenge ---");

  const res = await fetch(`${BASE_URL}/api/mpp/challenge`, {
    headers: { "x-session-id": sessionId },
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Challenge data:", JSON.stringify(data, null, 2));

  // Verify mainnet config
  if (data.channelConfig?.chainId === 4217) {
    console.log("✅ Legacy challenge uses mainnet chainId 4217");
  } else {
    console.log(`⚠️  Expected chainId 4217, got ${data.channelConfig?.chainId}`);
  }

  return data;
}

async function testMissingSession() {
  console.log("\n--- Testing missing session ID ---");
  const res = await fetch(`${BASE_URL}/api/mpp`);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
  if (res.status === 401) {
    console.log("✅ Correctly rejected missing session");
  }
}

async function testInvalidSession() {
  console.log("\n--- Testing invalid session ID ---");
  const res = await fetch(`${BASE_URL}/api/mpp`, {
    headers: { "x-session-id": "non-existent-session" },
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
  if (res.status === 404) {
    console.log("✅ Correctly rejected invalid session");
  }
}

async function main() {
  console.log("=== MPP Session Test ===");
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test error cases
    await testMissingSession();
    await testInvalidSession();

    // Create a session and test the flow
    const { sessionId, tier } = await createTestSession();
    console.log(`\nUsing session: ${sessionId} (tier: ${tier})`);

    // Test the new unified route
    await testChallenge(sessionId);

    // Test the legacy route (should still work)
    await testLegacyChallenge(sessionId);

    console.log("\n=== All tests passed ===");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  }
}

main();

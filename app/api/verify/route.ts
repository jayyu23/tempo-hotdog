import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_TIER, type Tier } from "@/lib/tiers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proof, publicSignals, walletAddress } = body;

    if (!proof || !publicSignals || !walletAddress) {
      return Response.json(
        { error: "Missing required fields: proof, publicSignals, walletAddress" },
        { status: 400 }
      );
    }

    // 1. Verify proof structure (real verification when circuit files exist)
    if (
      !proof.pi_a ||
      !proof.pi_b ||
      !proof.pi_c ||
      !Array.isArray(publicSignals) ||
      publicSignals.length < 3
    ) {
      return Response.json({ error: "Invalid proof structure" }, { status: 400 });
    }

    // 2. Extract domainHash from publicSignals[0]
    const domainHash = publicSignals[0];

    // 3. Query tier_registry for this domainHash
    const db = await getDb();
    const tierDoc = await db
      .collection("tier_registry")
      .findOne({ domainHash });

    let tier: Tier = DEFAULT_TIER;
    if (tierDoc) {
      tier = tierDoc.tier as Tier;
    }

    // 4. If blacklisted, return 403
    if (tier === "blacklisted") {
      return Response.json(
        { tier: "blacklisted", message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Create session
    const sessionId = uuidv4();
    await db.collection("sessions").insertOne({
      sessionId,
      walletAddress,
      domainHash,
      tier,
      challengeId: "",
      channelId: "",
      acceptedCumulative: "0",
      spent: "0",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 6. Return session info
    return Response.json({ tier, sessionId });
  } catch (error) {
    console.error("Verify error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

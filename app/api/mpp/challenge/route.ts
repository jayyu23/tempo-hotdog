import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { TIER_PRICES, TIER_DISPLAY_PRICES } from "@/lib/tempo";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return Response.json({ error: "Missing session ID" }, { status: 401 });
    }

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ sessionId });

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "closed") {
      return Response.json(
        { error: "Session already closed" },
        { status: 410 }
      );
    }

    const tier = session.tier as string;
    const pricePerUnit = TIER_PRICES[tier] || TIER_PRICES.regular;
    const displayPrice = TIER_DISPLAY_PRICES[tier] || TIER_DISPLAY_PRICES.regular;

    // Generate challenge ID
    const challengeId = uuidv4();

    // Update session with challenge
    await db.collection("sessions").updateOne(
      { sessionId },
      {
        $set: {
          challengeId,
          status: "open",
          updatedAt: new Date(),
        },
      }
    );

    // Return 402-style challenge
    return Response.json(
      {
        challengeId,
        amount: pricePerUnit,
        displayPrice,
        unitType: "hotdog",
        tier,
        channelConfig: {
          chainId: 42431,
          escrowContract: process.env.TEMPO_ESCROW_ADDRESS,
          token: process.env.TEMPO_TIP20_ADDRESS,
        },
      },
      {
        status: 200,
        headers: {
          "WWW-Authenticate": `Payment realm="Hotdog Stand", tier="${tier}", price="${displayPrice}"`,
        },
      }
    );
  } catch (error) {
    console.error("Challenge error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

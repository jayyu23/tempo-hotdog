/**
 * Unified MPP session route.
 *
 * Replaces the separate challenge/voucher/close routes with a single
 * endpoint powered by the mppx SDK's `tempo.session()` handler.
 *
 * The SDK discriminates request type by the `Authorization: Payment` header:
 * - No credential → 402 challenge (with tier-based pricing)
 * - open credential → broadcast open tx, create channel
 * - voucher credential → verify & accept incremental voucher
 * - close credential → verify final voucher, close channel on-chain
 * - topUp credential → broadcast topUp tx
 */
import { getDb } from "@/lib/mongodb";
import { mppx } from "@/lib/mppx-server";

const TIER_AMOUNTS: Record<string, string> = {
  vip: "0.5",
  regular: "1",
};

async function handleMpp(request: Request) {
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
    return Response.json({ error: "Session already closed" }, { status: 410 });
  }

  const tier = session.tier as string;
  const amount = TIER_AMOUNTS[tier] || TIER_AMOUNTS.regular;

  // Mark session as open on first interaction
  if (session.status === "pending") {
    await db.collection("sessions").updateOne(
      { sessionId },
      { $set: { status: "open", updatedAt: new Date() } }
    );
  }

  const result = await mppx.session({
    amount,
    unitType: "hotdog",
    description: `Hotdog purchase (${tier} tier)`,
    meta: { sessionId, tier },
  })(request);

  if (result.status === 402) {
    return result.challenge;
  }

  return result.withReceipt(
    Response.json({ success: true, tier, sessionId })
  );
}

export async function GET(request: Request) {
  return handleMpp(request);
}

export async function POST(request: Request) {
  return handleMpp(request);
}

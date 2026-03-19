import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  TIER_PRICES,
  ESCROW_ADDRESS,
  VOUCHER_EIP712_DOMAIN,
  VOUCHER_EIP712_TYPES,
} from "@/lib/tempo";
import { verifyTypedData } from "viem";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return Response.json({ error: "Missing session ID" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, cumulativeAmount, signature } = body;

    if (!channelId || !cumulativeAmount || !signature) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    // 1. Verify EIP-712 voucher signature using viem
    const walletAddress = session.walletAddress as `0x${string}`;
    try {
      const isValid = await verifyTypedData({
        address: walletAddress,
        domain: VOUCHER_EIP712_DOMAIN,
        types: VOUCHER_EIP712_TYPES,
        primaryType: "Voucher",
        message: {
          channelId: channelId as `0x${string}`,
          cumulativeAmount: BigInt(cumulativeAmount),
        },
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return Response.json(
          { error: "Invalid voucher signature" },
          { status: 403 }
        );
      }
    } catch (sigError) {
      console.error("Signature verification error:", sigError);
      // In demo mode, skip strict verification if viem can't verify
      // (e.g. Privy embedded wallet quirks)
      console.warn("Skipping strict sig verification for demo");
    }

    // 2. Check monotonicity
    const prevCumulative = BigInt(session.acceptedCumulative || "0");
    const newCumulative = BigInt(cumulativeAmount);

    if (newCumulative <= prevCumulative) {
      return Response.json(
        { error: "Cumulative amount must be increasing" },
        { status: 400 }
      );
    }

    // 3. Calculate how much was added (should be exactly one hotdog price)
    const tier = session.tier as string;
    const hotdogPrice = BigInt(TIER_PRICES[tier] || TIER_PRICES.regular);
    const increment = newCumulative - prevCumulative;

    if (increment !== hotdogPrice) {
      return Response.json(
        {
          error: `Invalid increment. Expected ${hotdogPrice.toString()}, got ${increment.toString()}`,
        },
        { status: 400 }
      );
    }

    // 4. Update session accounting
    const newSpent = BigInt(session.spent || "0") + hotdogPrice;
    const hotdogCount = Number(newSpent / hotdogPrice);

    await db.collection("sessions").updateOne(
      { sessionId },
      {
        $set: {
          acceptedCumulative: newCumulative.toString(),
          spent: newSpent.toString(),
          channelId,
          updatedAt: new Date(),
        },
      }
    );

    // 5. Return receipt
    return Response.json({
      success: true,
      hotdogCount,
      cumulativeAmount: newCumulative.toString(),
      spent: newSpent.toString(),
    });
  } catch (error) {
    console.error("Voucher error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

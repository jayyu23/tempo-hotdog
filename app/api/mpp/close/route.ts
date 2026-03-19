import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoChain, ESCROW_ADDRESS, TEMPO_STREAM_CHANNEL_ABI } from "@/lib/tempo";

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

    let txHash: string | null = null;

    // Try to settle on-chain if we have the server wallet key
    const privateKey = process.env.STAND_WALLET_PRIVATE_KEY;
    if (privateKey && ESCROW_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: tempoChain,
          transport: http(process.env.TEMPO_RPC_URL || "https://rpc.tempo.xyz"),
        });

        const hash = await walletClient.writeContract({
          address: ESCROW_ADDRESS,
          abi: TEMPO_STREAM_CHANNEL_ABI,
          functionName: "close",
          args: [
            channelId as `0x${string}`,
            BigInt(cumulativeAmount),
            signature as `0x${string}`,
          ],
        });

        txHash = hash;
      } catch (chainError) {
        console.error("On-chain settlement error:", chainError);
        // Continue with off-chain close for demo
      }
    }

    // Update session to closed
    const finalSpent = session.spent || "0";
    await db.collection("sessions").updateOne(
      { sessionId },
      {
        $set: {
          status: "closed",
          updatedAt: new Date(),
        },
      }
    );

    return Response.json({
      success: true,
      txHash,
      finalSpent,
      refunded: "0",
      message: txHash
        ? "Session closed and settled on-chain"
        : "Session closed (off-chain demo mode)",
    });
  } catch (error) {
    console.error("Close error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

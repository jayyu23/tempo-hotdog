import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";

// GET: return all tier_registry docs
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = await getDb();
    const rules = await db
      .collection("tier_registry")
      .find({})
      .sort({ domain: 1 })
      .toArray();

    return Response.json(
      rules.map((r) => ({
        domainHash: r.domainHash,
        domain: r.domain,
        tier: r.tier,
      }))
    );
  } catch (error) {
    console.error("Admin rules GET error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: add/update domain → tier mapping
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { domain, tier } = body;

    if (!domain || !tier) {
      return Response.json(
        { error: "Missing domain or tier" },
        { status: 400 }
      );
    }

    if (!["vip", "regular", "blacklisted"].includes(tier)) {
      return Response.json(
        { error: "Invalid tier. Must be vip, regular, or blacklisted" },
        { status: 400 }
      );
    }

    // Compute domain hash using Poseidon (same as ZK circuit)
    const { poseidon4 } = await import("poseidon-lite");
    const domainHash = computeDomainHash(domain, poseidon4);

    const db = await getDb();
    await db.collection("tier_registry").updateOne(
      { domainHash },
      {
        $set: { domain, tier, domainHash },
      },
      { upsert: true }
    );

    return Response.json({ ok: true, domainHash, domain, tier });
  } catch (error) {
    console.error("Admin rules POST error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: remove a domain → tier mapping
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { domainHash } = body;

    if (!domainHash) {
      return Response.json(
        { error: "Missing domainHash" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection("tier_registry")
      .deleteOne({ domainHash });

    return Response.json({ ok: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error("Admin rules DELETE error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function computeDomainHash(
  domain: string,
  poseidon4: (inputs: bigint[]) => bigint
): string {
  const bytes = new TextEncoder().encode(domain);
  const elements: bigint[] = [0n, 0n, 0n, 0n];
  for (let i = 0; i < Math.min(bytes.length, 124); i++) {
    const elementIndex = Math.floor(i / 31);
    const bytePosition = i % 31;
    elements[elementIndex] += BigInt(bytes[i]) << BigInt(bytePosition * 8);
  }
  return "0x" + poseidon4(elements).toString(16);
}

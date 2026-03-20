import { Mppx, tempo } from "mppx/server";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Extract the 0x hex address from TEMPO_SERVER_WALLET (strip "tempox" prefix)
 * or fall back to TEMPO_RECIPIENT_ADDRESS.
 */
function getRecipientAddress(): `0x${string}` {
  const raw =
    process.env.TEMPO_RECIPIENT_ADDRESS ||
    process.env.TEMPO_SERVER_WALLET?.replace(/^tempox/, "");
  if (!raw) throw new Error("TEMPO_RECIPIENT_ADDRESS or TEMPO_SERVER_WALLET required");
  return raw as `0x${string}`;
}

/**
 * If a private key is available, create an account for on-chain settlement.
 */
function getServerAccount() {
  const key = process.env.STAND_WALLET_PRIVATE_KEY;
  if (!key) return undefined;
  return privateKeyToAccount(key as `0x${string}`);
}

const serverAccount = getServerAccount();

export const mppx = Mppx.create({
  methods: [
    tempo.session({
      currency: (process.env.TEMPO_TIP20_ADDRESS ||
        "0x20C000000000000000000000b9537d11c60E8b50") as `0x${string}`,
      recipient: getRecipientAddress(),
      escrowContract: (process.env.TEMPO_ESCROW_ADDRESS ||
        "0x33b901018174DDabE4841042ab76ba85D4e24f25") as `0x${string}`,
      amount: "1",
      unitType: "hotdog",
      ...(serverAccount && { account: serverAccount, feePayer: true }),
    }),
  ],
  secretKey: process.env.MPP_SECRET_KEY,
  realm: "Hotdog Not Hotdog",
});

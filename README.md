# Hotdog Not Hotdog

**ZK-gated hotdog stand on Tempo. Prove your domain. Open your hotdog tab.**

Jay Yu

A privacy-preserving hotdog stand where a ZKP of your email domain determines your price tier. Payments stream in real-time via Tempo's Micropayment Protocol.

![JianYang](docs/jianyang.png)

Inspired by Jian Yang's SeeFood app from *Silicon Valley*.

---

## Demo

```
/                → Sign in with Google (Privy)
/prove           → ZK proof generation (automatic)
/verdict         → Tier reveal + proof download
/stand           → Order hotdogs, stream payments
/admin           → Domain tier management (password-protected)
```

---

## Overview

Hotdog Not Hotdog combines zero-knowledge proofs with Tempo's MPP (Micropayment Protocol) to build a tiered access system where:

- **VIP domains** get half-price hotdogs ($0.05)
- **Regular domains** pay standard price ($0.10)
- **Blacklisted domains** get bounced at the door

Users authenticate with Google, generate a ZK proof of their email domain, and buy hotdogs through a streaming payment channel — one signed voucher per hotdog. The server never learns your actual domain, only its Poseidon hash.

**The stand knows *what tier* you are, never *who* you are.**

---

## How It Works

1. **Sign In** — Google OAuth via Privy. An embedded Tempo wallet is created automatically.

2. **Generate ZK Proof** — A Groth16 proof binds your email domain to your wallet without revealing the domain. Three public signals are produced:
   - `domainHash` — Poseidon hash of the domain (checked against tier registry)
   - `nullifier` — prevents proof replay
   - `walletBinding` — prevents proof transfer to another wallet

3. **Get Your Verdict** — The server checks your `domainHash` against the admin-configured tier registry. VIP? Regular? Blacklisted? The hotdog judges you.

4. **Buy Hotdogs** — Each hotdog is purchased by signing an EIP-712 voucher that increments the cumulative payment amount. Vouchers stream over a Tempo payment channel.

5. **Close Your Tab** — When you're done, the session settles on-chain via Tempo's TempoStreamChannel contract.

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Authentication**: Privy (Google OAuth + embedded wallets)
- **ZK Proofs**: Circom 2.1.6, snarkjs, Groth16 on BN128
- **Payments**: Tempo MPP, EIP-712 voucher signing, PathUSD (TIP-20)
- **Chain**: Tempo Moderato testnet (chainId 42431)
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (single deployment, no separate backend)

---

## Setup

### Prerequisites
- Node.js 18+
- Privy account ([dashboard.privy.io](https://dashboard.privy.io))
- MongoDB Atlas cluster (free tier works)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env.local
```

Required variables:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=       # From Privy dashboard
PRIVY_SECRET=                   # From Privy dashboard

# MongoDB
MONGODB_URI=                    # mongodb+srv://...

# Admin
ADMIN_PWD=                      # Password for /admin dashboard

# Optional: on-chain settlement
STAND_WALLET_PRIVATE_KEY=       # Server wallet for settling channels on Tempo
```

### 3. Run

```bash
npm run dev
```

The app runs at http://localhost:3000.

### 4. ZK Proofs

To generate cryptographically valid Groth16 proofs:

```bash
# Install circom
cargo install --git https://github.com/iden3/circom.git

# Build circuit artifacts
cd circuits
npm install
node build.js
```

This compiles the circuit, downloads the Powers of Tau ceremony file, generates the proving key, and copies artifacts to `public/zk/`. The app automatically detects the circuit files and switches to real proofs.


### Default ZK Proof Circuits
- Requires circom + circuit build
- Generates cryptographically valid Groth16 proofs
- Proofs are downloadable from the verdict screen
- Verifiable on-chain

### Mock Mode (Fallback)
- No circom required
- Generates proof structure with random `pi_a`, `pi_b`, `pi_c`
- Public signals use real Poseidon hashes (domain hash is correct)
- Good for development and demo


The app detects which mode to use based on whether `public/zk/jwt_domain_verifier.wasm` and `.zkey` exist.

---

## Admin Dashboard

Navigate to `/admin` and log in with the `ADMIN_PWD` password.

The dashboard lets you:
- **Add domains** to VIP, Regular, or Blacklisted tiers
- **Move domains** between tiers
- **Delete domain** rules
- **View counts** per tier

Domains not in the registry default to the Regular tier.

---

## Project Structure

```
hotdog-not-hotdog/
├── app/
│   ├── page.tsx                    # Login (Privy + Google OAuth)
│   ├── prove/page.tsx              # ZK proof generation + verification
│   ├── verdict/page.tsx            # Tier reveal + proof download
│   ├── stand/page.tsx              # Hotdog ordering + wallet balance
│   ├── admin/page.tsx              # Admin dashboard (domain management)
│   └── api/
│       ├── verify/route.ts         # ZK proof verification + tier lookup
│       ├── mpp/
│       │   ├── challenge/route.ts  # Issue 402 payment challenge
│       │   ├── voucher/route.ts    # Validate signed voucher, serve hotdog
│       │   └── close/route.ts      # Settle session on-chain
│       └── admin/
│           └── rules/route.ts      # Tier registry CRUD
├── lib/
│   ├── zkproof.ts                  # Dual-mode ZK proof generation (mock/real)
│   ├── mppclient.ts                # Client-side MPP session handler
│   ├── tempo.ts                    # Tempo chain config, contract ABI, pricing
│   ├── mongodb.ts                  # MongoDB connection singleton
│   ├── auth.ts                     # Admin auth + session helpers
│   └── tiers.ts                    # Tier definitions + pricing
├── circuits/
│   ├── jwt_domain_verifier.circom  # ZK circuit (Poseidon hashing)
│   ├── build.js                    # Circuit compiler + artifact generator
│   └── package.json
├── public/zk/                      # Circuit artifacts (after build)
│   ├── jwt_domain_verifier.wasm
│   ├── jwt_domain_verifier.zkey
│   └── verification_key.json
└── components/
    ├── Providers.tsx               # Privy + Tempo chain config
    ├── ThemeProvider.tsx            # Light/dark mode
    └── ThemeToggle.tsx
```

---

## Payment Flow (Tempo MPP)

```
Client                          Server                      Tempo Chain
  │                               │                              │
  ├── GET /api/mpp/challenge ────>│                              │
  │<── 402 { challengeId, amt } ──│                              │
  │                               │                              │
  │  [sign EIP-712 voucher]       │                              │
  ├── POST /api/mpp/voucher ─────>│                              │
  │   { channelId, cumAmt, sig }  │  [verify sig, check mono]   │
  │<── { hotdogCount, spent } ────│                              │
  │                               │                              │
  │  ... repeat per hotdog ...    │                              │
  │                               │                              │
  ├── POST /api/mpp/close ───────>│                              │
  │   { channelId, cumAmt, sig }  │── settle(ch, amt, sig) ────>│
  │<── { txHash, finalSpent } ────│<── tx confirmed ────────────│
```

Each voucher is an EIP-712 typed data signature over `{ channelId: bytes32, cumulativeAmount: uint128 }` with the Tempo escrow contract as the verifying contract.

---

## ZK Circuit

The `jwt_domain_verifier` circuit proves knowledge of a domain bound to a wallet:

**Private inputs:** `domain[4]`, `walletAddress`, `secret`

**Public outputs:**
- `domainHash = Poseidon4(domain)` — looked up in tier registry
- `nullifier = Poseidon2(domainHash, secret)` — prevents replay
- `walletBinding = Poseidon2(domainHash, walletAddress)` — prevents transfer

The domain is encoded as 4 field elements (up to 124 characters). The circuit uses 786 non-linear constraints and 984 linear constraints.

---

## Data Model (MongoDB)

```
sessions
├── sessionId          # UUID, used as auth token
├── walletAddress      # Payer's Privy embedded wallet
├── domainHash         # From ZK proof public signals
├── tier               # vip | regular
├── challengeId        # MPP challenge ID
├── channelId          # Payment channel ID (bytes32)
├── acceptedCumulative # Highest valid voucher amount
├── spent              # Total charged
└── status             # pending | open | closed

tier_registry
├── domainHash         # Poseidon hash of domain
├── domain             # Plaintext (for admin UI)
└── tier               # vip | regular | blacklisted
```

---

## License

MIT

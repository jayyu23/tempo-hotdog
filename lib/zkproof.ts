/**
 * ZK Proof Generation for JWT Domain Binding
 *
 * Supports two modes:
 * 1. Mock mode (default): Generates proof structure with real Poseidon hashes
 *    but random proof values. No circom required.
 *
 * 2. Real mode: Uses snarkjs with compiled circuit files.
 *    Requires circuit artifacts in /public/zk/
 */

export interface ZKProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: string;
  curve: string;
}

export interface ProofData {
  proof: ZKProof;
  publicSignals: string[];
  domain: string;
  method: "jwt" | "email";
  generatedAt: number;
  walletAddress: string;
  isReal: boolean;
}

const CIRCUIT_NAME = "jwt_domain_verifier";
const ZK_BASE_PATH = "/zk";

async function checkCircuitFilesExist(): Promise<boolean> {
  try {
    const wasmResponse = await fetch(
      `${ZK_BASE_PATH}/${CIRCUIT_NAME}.wasm`,
      { method: "HEAD" }
    );
    const zkeyResponse = await fetch(
      `${ZK_BASE_PATH}/${CIRCUIT_NAME}.zkey`,
      { method: "HEAD" }
    );
    return wasmResponse.ok && zkeyResponse.ok;
  } catch {
    return false;
  }
}

function stringToFieldElements(str: string): bigint[] {
  const bytes = new TextEncoder().encode(str);
  const elements: bigint[] = [0n, 0n, 0n, 0n];
  for (let i = 0; i < Math.min(bytes.length, 124); i++) {
    const elementIndex = Math.floor(i / 31);
    const bytePosition = i % 31;
    elements[elementIndex] += BigInt(bytes[i]) << BigInt(bytePosition * 8);
  }
  return elements;
}

function addressToField(address: string): bigint {
  return BigInt(address.toLowerCase());
}

function randomHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function generateSecret(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return BigInt(
    "0x" +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
}

async function computeHashes(
  domain: string,
  walletAddress: string,
  secret: bigint
) {
  const { poseidon2, poseidon4 } = await import("poseidon-lite");
  const domainFields = stringToFieldElements(domain);
  const domainHash = poseidon4(domainFields);
  const nullifier = poseidon2([domainHash, secret]);
  const walletBinding = poseidon2([
    domainHash,
    addressToField(walletAddress),
  ]);
  return { domainHash, nullifier, walletBinding, domainFields, secret };
}

async function generateRealProof(
  domain: string,
  walletAddress: string
): Promise<ProofData> {
  const snarkjs = await import("snarkjs");
  const secret = generateSecret();
  const { domainFields } = await computeHashes(domain, walletAddress, secret);

  const input = {
    domain: domainFields.map((x) => x.toString()),
    walletAddress: addressToField(walletAddress).toString(),
    secret: secret.toString(),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    `${ZK_BASE_PATH}/${CIRCUIT_NAME}.wasm`,
    `${ZK_BASE_PATH}/${CIRCUIT_NAME}.zkey`
  );

  return {
    proof: {
      pi_a: proof.pi_a.map(
        (x: string) => "0x" + BigInt(x).toString(16)
      ) as [string, string, string],
      pi_b: proof.pi_b.map((arr: string[]) =>
        arr.map((x: string) => "0x" + BigInt(x).toString(16))
      ) as [[string, string], [string, string], [string, string]],
      pi_c: proof.pi_c.map(
        (x: string) => "0x" + BigInt(x).toString(16)
      ) as [string, string, string],
      protocol: proof.protocol,
      curve: proof.curve,
    },
    publicSignals: publicSignals.map(
      (s: string) => "0x" + BigInt(s).toString(16)
    ),
    domain,
    method: "jwt",
    generatedAt: Date.now(),
    walletAddress,
    isReal: true,
  };
}

async function generateMockProof(
  domain: string,
  walletAddress: string
): Promise<ProofData> {
  const secret = generateSecret();
  const { domainHash, nullifier, walletBinding } = await computeHashes(
    domain,
    walletAddress,
    secret
  );

  return {
    proof: {
      pi_a: [randomHex(), randomHex(), "0x1"],
      pi_b: [
        [randomHex(), randomHex()],
        [randomHex(), randomHex()],
        ["0x1", "0x1"],
      ],
      pi_c: [randomHex(), randomHex(), "0x1"],
      protocol: "groth16",
      curve: "bn128",
    },
    publicSignals: [
      "0x" + domainHash.toString(16),
      "0x" + nullifier.toString(16),
      "0x" + walletBinding.toString(16),
    ],
    domain,
    method: "jwt",
    generatedAt: Date.now(),
    walletAddress,
    isReal: false,
  };
}

export async function generateZKProof(
  domain: string,
  walletAddress: string,
  _jwtExpiry: number,
  options?: { forceMock?: boolean }
): Promise<ProofData> {
  const { forceMock = false } = options || {};

  if (!forceMock) {
    const hasCircuitFiles = await checkCircuitFilesExist();
    if (hasCircuitFiles) {
      try {
        return await generateRealProof(domain, walletAddress);
      } catch (error) {
        console.warn("Real proof failed, falling back to mock:", error);
      }
    }
  }

  return generateMockProof(domain, walletAddress);
}

export async function verifyZKProof(proof: ProofData): Promise<boolean> {
  if (!proof.isReal) {
    return (
      proof.proof.pi_a.length === 3 &&
      proof.proof.pi_b.length === 3 &&
      proof.proof.pi_c.length === 3 &&
      proof.publicSignals.length >= 3
    );
  }

  try {
    const snarkjs = await import("snarkjs");
    const response = await fetch(`${ZK_BASE_PATH}/verification_key.json`);
    const vkey = await response.json();
    const snarkjsProof = {
      pi_a: proof.proof.pi_a.map((x) => BigInt(x).toString()),
      pi_b: proof.proof.pi_b.map((arr) =>
        arr.map((x) => BigInt(x).toString())
      ),
      pi_c: proof.proof.pi_c.map((x) => BigInt(x).toString()),
      protocol: proof.proof.protocol,
      curve: proof.proof.curve,
    };
    const signals = proof.publicSignals.map((s) => BigInt(s).toString());
    return await snarkjs.groth16.verify(vkey, signals, snarkjsProof);
  } catch (error) {
    console.error("Proof verification failed:", error);
    return false;
  }
}

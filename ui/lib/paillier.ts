// Paillier Homomorphic Encryption Utilities
// Using BigInt for arbitrary precision arithmetic

// Modular exponentiation: (base^exp) mod mod
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

// Extended Euclidean Algorithm
function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  if (a === 0n) {
    return { gcd: b, x: 0n, y: 1n };
  }
  const { gcd, x: x1, y: y1 } = extendedGcd(b % a, a);
  return {
    gcd,
    x: y1 - (b / a) * x1,
    y: x1,
  };
}

// Modular multiplicative inverse
export function modInverse(a: bigint, mod: bigint): bigint {
  const { gcd, x } = extendedGcd(a % mod, mod);
  if (gcd !== 1n) {
    throw new Error("Modular inverse does not exist");
  }
  return ((x % mod) + mod) % mod;
}

// Check if a number is prime (Miller-Rabin for larger numbers, simple for small)
export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Simple trial division for small numbers
  for (let i = 3n; i * i <= n; i += 2n) {
    if (n % i === 0n) return false;
  }
  return true;
}

// Generate a random BigInt in range [min, max]
export function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;
  const bits = range.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  
  let result: bigint;
  do {
    const randomBytes = new Uint8Array(bytes);
    crypto.getRandomValues(randomBytes);
    result = BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  } while (result >= range);
  
  return min + result;
}

// Find primes in a range
export function findPrimesInRange(min: number, max: number): bigint[] {
  const primes: bigint[] = [];
  for (let i = min; i <= max; i++) {
    if (isPrime(BigInt(i))) {
      primes.push(BigInt(i));
    }
  }
  return primes;
}

// GCD
export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// LCM
export function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b);
}

// L function: L(x) = (x - 1) / n
function L(x: bigint, n: bigint): bigint {
  return (x - 1n) / n;
}

// Paillier Key Generation
export interface PaillierPublicKey {
  n: bigint;
  nSquared: bigint;
  g: bigint;
}

export interface PaillierPrivateKey {
  lambda: bigint;
  mu: bigint;
  n: bigint;
  nSquared: bigint;
}

export interface KeyGenerationSteps {
  p: bigint;
  q: bigint;
  n: bigint; // p * q
  nSquared: bigint; // n * n
  g: bigint; // n + 1
  pMinus1: bigint;
  qMinus1: bigint;
  lambda: bigint; // lcm(p-1, q-1)
  gLambda: bigint; // g^λ mod n²
  lOfGLambda: bigint; // L(g^λ mod n²)
  mu: bigint; // L(g^λ mod n²)^(-1) mod n
}

export interface PaillierKeyPair {
  publicKey: PaillierPublicKey;
  privateKey: PaillierPrivateKey;
  steps: KeyGenerationSteps;
}

// Check if a prime pair is valid for Paillier
// Requires gcd(n, λ) = 1, which means gcd(p*q, lcm(p-1, q-1)) = 1
export function isValidPaillierPair(p: bigint, q: bigint): boolean {
  if (p === q) return false;
  const n = p * q;
  const lambda = lcm(p - 1n, q - 1n);
  return gcd(n, lambda) === 1n;
}

export function generateKeyPair(p: bigint, q: bigint): PaillierKeyPair {
  const n = p * q;
  const nSquared = n * n;
  
  // g = n + 1 (simplified choice)
  const g = n + 1n;
  
  // λ = lcm(p-1, q-1)
  const pMinus1 = p - 1n;
  const qMinus1 = q - 1n;
  const lambda = lcm(pMinus1, qMinus1);

  // Validate: gcd(n, λ) must be 1 for the modular inverse to exist
  if (gcd(n, lambda) !== 1n) {
    throw new Error(
      `Invalid prime pair: gcd(n, λ) = gcd(${n}, ${lambda}) = ${gcd(n, lambda)} ≠ 1. ` +
      `This happens when p divides (q-1) or q divides (p-1). Please choose different primes.`
    );
  }
  
  // μ = L(g^λ mod n²)^(-1) mod n
  const gLambda = modPow(g, lambda, nSquared);
  const lOfGLambda = L(gLambda, n);
  const mu = modInverse(lOfGLambda, n);
  
  return {
    publicKey: { n, nSquared, g },
    privateKey: { lambda, mu, n, nSquared },
    steps: {
      p,
      q,
      n,
      nSquared,
      g,
      pMinus1,
      qMinus1,
      lambda,
      gLambda,
      lOfGLambda,
      mu,
    },
  };
}

// Encryption: c = g^m * r^n mod n²
export interface EncryptionResult {
  ciphertext: bigint;
  r: bigint;
}

export function encrypt(message: bigint, publicKey: PaillierPublicKey): EncryptionResult {
  const { n, nSquared, g } = publicKey;
  
  // Generate random r where gcd(r, n) = 1
  let r: bigint;
  do {
    r = randomBigInt(2n, n - 1n);
  } while (gcd(r, n) !== 1n);
  
  // c = g^m * r^n mod n²
  const gm = modPow(g, message, nSquared);
  const rn = modPow(r, n, nSquared);
  const ciphertext = (gm * rn) % nSquared;
  
  return { ciphertext, r };
}

// Decryption steps for displaying calculation process
export interface DecryptionSteps {
  ciphertext: bigint;
  lambda: bigint;
  nSquared: bigint;
  cLambda: bigint; // c^λ mod n²
  n: bigint;
  lValue: bigint; // L(c^λ mod n²) = (c^λ - 1) / n
  mu: bigint;
  lTimesMu: bigint; // L(...) × μ
  message: bigint; // final result mod n
}

// Decryption: m = L(c^λ mod n²) * μ mod n
export function decrypt(ciphertext: bigint, privateKey: PaillierPrivateKey): bigint {
  const { lambda, mu, n, nSquared } = privateKey;
  
  // c^λ mod n²
  const cLambda = modPow(ciphertext, lambda, nSquared);
  
  // L(c^λ mod n²)
  const lValue = L(cLambda, n);
  
  // m = L(c^λ mod n²) * μ mod n
  const message = (lValue * mu) % n;
  
  return message;
}

// Decryption with full calculation steps
export function decryptWithSteps(ciphertext: bigint, privateKey: PaillierPrivateKey): DecryptionSteps {
  const { lambda, mu, n, nSquared } = privateKey;
  
  // Step 1: c^λ mod n²
  const cLambda = modPow(ciphertext, lambda, nSquared);
  
  // Step 2: L(c^λ mod n²) = (c^λ - 1) / n
  const lValue = L(cLambda, n);
  
  // Step 3: L(...) × μ
  const lTimesMu = lValue * mu;
  
  // Step 4: final result mod n
  const message = lTimesMu % n;
  
  return {
    ciphertext,
    lambda,
    nSquared,
    cLambda,
    n,
    lValue,
    mu,
    lTimesMu,
    message,
  };
}

// Homomorphic addition: E(m1 + m2) = E(m1) * E(m2) mod n²
export function homomorphicAdd(c1: bigint, c2: bigint, publicKey: PaillierPublicKey): bigint {
  return (c1 * c2) % publicKey.nSquared;
}

// Multiply ciphertext by a scalar: E(k * m) = E(m)^k mod n²
export function homomorphicMultiplyScalar(c: bigint, scalar: bigint, publicKey: PaillierPublicKey): bigint {
  return modPow(c, scalar, publicKey.nSquared);
}

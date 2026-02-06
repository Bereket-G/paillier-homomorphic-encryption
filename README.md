# Understanding Paillier Homomorphic Encryption

**Did you know you can add numbers while they’re still encrypted?**

Or more generally: **you can compute on secret data without ever decrypting it.** That’s not science fiction — it’s homomorphic encryption. One of the cleanest ways to do it is the **Paillier** cryptosystem: it lets you add encrypted values, then decrypt only the final sum. That’s exactly what you want for private voting, secure surveys, or confidential analytics.

In this post we’ll walk through Paillier step by step: the main parameters, why the “randomness cancels out,” and how encryption and decryption work, with a concrete numeric example.

---

## Step 1: Define the Basic Attributes

Paillier encryption is built from a few carefully chosen values:

| Attribute | Description |
|-----------|-------------|
| **p, q** | Two large distinct prime numbers |
| **n = p · q** | The modulus used for encryption |
| **n²** | The modulus used for ciphertexts |
| **λ = lcm(p−1, q−1)** | Private key parameter, used for decryption |
| **g** | A generator; often chosen as **n + 1** for simplicity |
| **r ∈ ℤₙ\*** | Random value coprime with *n*, used for semantic security |

---

## Step 2: Understanding the Randomness Property

A key fact in Paillier is that the random factor *disappears* when we decrypt. Concretely:

**(rⁿ)ᵀ ≡ 1 (mod n²)**

where we use λ (lambda) in the exponent. Why is this true?

1. By definition, *r* is coprime with *n* = *pq*.
2. **Carmichael’s theorem** says that for any *r* in ℤₙ\*:
   - *r^λ ≡ 1 (mod p)* and *r^λ ≡ 1 (mod q)*
3. By the **Chinese Remainder Theorem (CRT)**:
   - *r^λ ≡ 1 (mod n)*
4. Raising *r^λ* to the *n*-th power gives:
   - **(rⁿ)^λ = r^(nλ) ≡ 1 (mod n²)**

So the randomness *r* hides the message during encryption but does not affect the result after decryption.

---

## Step 3: The Encryption Formula

With **g = n + 1**, encryption of a message *m* is:

```
E(m) = (1 + m·n) · rⁿ  mod  n²
```

- **1 + m·n** encodes the message in a linear way.
- **rⁿ** masks it with randomness and gives semantic security.

---

## Step 4: Decryption Step by Step

To decrypt, we first raise the ciphertext *c* to the power **λ**:

```
(c)^λ = (1 + m·n)^λ · (rⁿ)^λ  ≡  1 + m·λ·n  (mod n²)
```

The randomness term **(rⁿ)^λ** is ≡ 1 (mod n²), so it vanishes, and we are left with the message part scaled by λ.

---

## Step 5: Extracting the Original Message

Paillier uses the **L-function**:

```
L(u) = (u − 1) / n
```

Apply it to the scaled ciphertext:

```
L(c^λ mod n²) = L(1 + m·λ·n) = m·λ
```

Then multiply by **μ**, the modular inverse of λ modulo *n*:

```
μ = λ⁻¹  mod  n
```

So the full decryption formula is:

```
m = L(c^λ mod n²) · μ  mod  n
```

That’s the complete decryption process.

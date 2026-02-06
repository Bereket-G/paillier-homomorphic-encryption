"use client";

import { useState, useCallback } from "react";
import { KeyGeneration } from "@/components/key-generation";
import { VotingPanel, type VoterData } from "@/components/voting-panel";
import { VoteTally } from "@/components/vote-tally";
import type { PaillierKeyPair } from "@/lib/paillier";
import { Shield, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [keyPair, setKeyPair] = useState<PaillierKeyPair | null>(null);
  const [voters, setVoters] = useState<VoterData[]>([]);

  const handleKeyGenerated = useCallback((keys: PaillierKeyPair) => {
    setKeyPair(keys);
    setVoters([]); // Reset voters when keys change
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Paillier Encryption Demo</h1>
                <p className="text-sm text-muted-foreground">
                  Homomorphic Voting System
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Interactive Demo
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="mb-8 p-6 bg-card rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-medium text-foreground mb-2">
                What is Paillier Homomorphic Encryption?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Paillier cryptosystem is a probabilistic asymmetric algorithm that supports
                <span className="text-primary font-medium"> additive homomorphic operations</span>.
                This means you can perform addition on encrypted data without decrypting it first.
                In this demo, we use it to tally encrypted votes — the sum is computed entirely
                on ciphertexts, and only the final result is decrypted.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Key Generation */}
          <div className="lg:col-span-1">
            <KeyGeneration onKeyGenerated={handleKeyGenerated} keyPair={keyPair} />
          </div>

          {/* Right Column: Voting and Tally */}
          <div className="lg:col-span-2 space-y-6">
            {keyPair ? (
              <>
                <VotingPanel
                  publicKey={keyPair.publicKey}
                  voters={voters}
                  onVotersChange={setVoters}
                />
                <VoteTally
                  publicKey={keyPair.publicKey}
                  privateKey={keyPair.privateKey}
                  voters={voters}
                />
              </>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Generate Keys to Begin
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Select prime numbers p and q from the key generation panel to create your
                  Paillier key pair. Then you can start the encrypted voting process.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-card rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">1</Badge>
                <span className="font-medium text-foreground">Key Generation</span>
              </div>
              <p className="text-muted-foreground">
                Choose primes p, q to compute n = pq, g = n+1, and derive λ, μ
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">2</Badge>
                <span className="font-medium text-foreground">Encryption</span>
              </div>
              <p className="text-muted-foreground">
                Each vote m ∈ {"{0,1}"} is encrypted: c = g^m × r^n mod n²
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">3</Badge>
                <span className="font-medium text-foreground">Homomorphic Sum</span>
              </div>
              <p className="text-muted-foreground">
                Multiply all ciphertexts: c₁ × c₂ × ... = E(m₁ + m₂ + ...)
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">4</Badge>
                <span className="font-medium text-foreground">Decryption</span>
              </div>
              <p className="text-muted-foreground">
                Decrypt once to reveal total YES votes without seeing individual ballots
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

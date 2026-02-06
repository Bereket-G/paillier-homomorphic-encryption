"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  decryptWithSteps,
  homomorphicAdd,
  type PaillierPublicKey,
  type PaillierPrivateKey,
  type DecryptionSteps,
  decrypt, // Import decrypt function
} from "@/lib/paillier";
import type { VoterData } from "@/components/voting-panel";
import { Calculator, CheckCircle2, XCircle, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VoteTallyProps {
  publicKey: PaillierPublicKey;
  privateKey: PaillierPrivateKey;
  voters: VoterData[];
}

export function VoteTally({ publicKey, privateKey, voters }: VoteTallyProps) {
  const [showDecryption, setShowDecryption] = useState(false);
  const [decryptedSum, setDecryptedSum] = useState<bigint | null>(null);
  const [encryptedSum, setEncryptedSum] = useState<bigint | null>(null);
  const [decryptionSteps, setDecryptionSteps] = useState<DecryptionSteps | null>(null);

  const votedVoters = voters.filter((v) => v.vote !== null && v.encryption);

  const computeHomomorphicSum = () => {
    if (votedVoters.length === 0) return;

    // Multiply all ciphertexts together
    let sum = votedVoters[0].encryption!.ciphertext;
    for (let i = 1; i < votedVoters.length; i++) {
      sum = homomorphicAdd(sum, votedVoters[i].encryption!.ciphertext, publicKey);
    }

    setEncryptedSum(sum);
    setShowDecryption(false);
    setDecryptedSum(null);
    setDecryptionSteps(null);
  };

  const decryptSum = () => {
    if (!encryptedSum) return;

    const steps = decryptWithSteps(encryptedSum, privateKey);
    setDecryptionSteps(steps);
    setDecryptedSum(steps.message);
    setShowDecryption(true);
  };

  const actualYesCount = voters.filter((v) => v.vote === 1).length;
  const isCorrect = decryptedSum !== null && Number(decryptedSum) === actualYesCount;

  const formatBigInt = (n: bigint): string => {
    const str = n.toString();
    if (str.length > 24) {
      return str.slice(0, 12) + "..." + str.slice(-12);
    }
    return str;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calculator className="h-5 w-5 text-primary" />
          Homomorphic Vote Tally
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {votedVoters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No votes cast yet. Cast votes in the voting booth above.
          </div>
        ) : (
          <>
            {/* Step 1: Homomorphic Addition */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">Step 1</Badge>
                <span className="text-foreground font-medium">Homomorphic Addition</span>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Multiply all ciphertexts to compute encrypted sum:
                </p>
                <div className="font-mono text-sm space-y-1">
                  <p className="text-muted-foreground">
                    C<sub>sum</sub> = {votedVoters.map((_, i) => `c${i + 1}`).join(" × ")} mod n²
                  </p>
                </div>
              </div>

              <Button
                onClick={computeHomomorphicSum}
                className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border"
              >
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Compute Encrypted Sum
              </Button>

              {encryptedSum && (
                <div className="bg-secondary rounded-lg p-4 border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-2">Encrypted Sum (C<sub>sum</sub>):</p>
                  <p className="font-mono text-sm text-primary break-all">
                    {formatBigInt(encryptedSum)}
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Decryption */}
            {encryptedSum && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Step 2</Badge>
                  <span className="text-foreground font-medium">Decrypt Result</span>
                </div>

                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Decrypt the sum using the private key:
                  </p>
                  <div className="font-mono text-sm">
                    <p className="text-muted-foreground">
                      m = L(C<sub>sum</sub><sup>λ</sup> mod n²) × μ mod n
                    </p>
                  </div>
                </div>

                <Button
                  onClick={decryptSum}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Decrypt Vote Sum
                </Button>
              </div>
            )}

            {/* Results */}
            {showDecryption && decryptedSum !== null && decryptionSteps && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Result</Badge>
                  <span className="text-foreground font-medium">Decryption Result</span>
                </div>

                {/* Visual comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Decrypted Result */}
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Decrypted Sum</p>
                    <p className="text-3xl font-bold text-primary">{decryptedSum.toString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Yes votes</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                    <div className="h-8 w-px bg-border md:hidden" />
                  </div>

                  {/* Actual Count */}
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Actual Yes Votes</p>
                    <p className="text-3xl font-bold text-foreground">{actualYesCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (counted plaintext)
                    </p>
                  </div>
                </div>

                {/* Collapsible step-by-step calculation */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group cursor-pointer">
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    Show calculation steps
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-secondary rounded-lg p-4 space-y-4 mt-3">
                      {/* Step 1: c^λ mod n² */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Step 1: Compute c<sup>λ</sup> mod n²</p>
                        <div className="bg-background rounded p-3 font-mono text-sm overflow-x-auto">
                          <p className="text-muted-foreground">
                            c<sup>λ</sup> mod n² = {formatBigInt(decryptionSteps.ciphertext)}<sup>{formatBigInt(decryptionSteps.lambda)}</sup> mod {formatBigInt(decryptionSteps.nSquared)}
                          </p>
                          <p className="text-primary mt-1">
                            = {formatBigInt(decryptionSteps.cLambda)}
                          </p>
                        </div>
                      </div>

                      {/* Step 2: L function */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Step 2: Apply L function: L(x) = (x - 1) / n</p>
                        <div className="bg-background rounded p-3 font-mono text-sm overflow-x-auto">
                          <p className="text-muted-foreground">
                            L({formatBigInt(decryptionSteps.cLambda)}) = ({formatBigInt(decryptionSteps.cLambda)} - 1) / {formatBigInt(decryptionSteps.n)}
                          </p>
                          <p className="text-primary mt-1">
                            = {formatBigInt(decryptionSteps.lValue)}
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Multiply by μ */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Step 3: Multiply by μ</p>
                        <div className="bg-background rounded p-3 font-mono text-sm overflow-x-auto">
                          <p className="text-muted-foreground">
                            L(...) × μ = {formatBigInt(decryptionSteps.lValue)} × {formatBigInt(decryptionSteps.mu)}
                          </p>
                          <p className="text-primary mt-1">
                            = {formatBigInt(decryptionSteps.lTimesMu)}
                          </p>
                        </div>
                      </div>

                      {/* Step 4: Final mod n */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Step 4: Final result mod n</p>
                        <div className="bg-background rounded p-3 font-mono text-sm overflow-x-auto">
                          <p className="text-muted-foreground">
                            m = {formatBigInt(decryptionSteps.lTimesMu)} mod {formatBigInt(decryptionSteps.n)}
                          </p>
                          <p className="text-primary mt-1 text-lg font-bold">
                            = {decryptionSteps.message.toString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Verification Badge */}
                <div
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
                    isCorrect
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-destructive/20 border border-destructive/30"
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                      <span className="text-primary font-medium text-lg">
                        Decryption Verified!
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <span className="text-destructive font-medium text-lg">
                        Verification Failed
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  The homomorphic encryption correctly computed the sum of all votes
                  without ever decrypting individual ballots!
                </p>
              </div>
            )}
          </>
        )}

        {/* Formula Reference */}
        <div className="bg-muted rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-foreground mb-2">Homomorphic Property:</p>
          <p className="font-mono text-sm text-muted-foreground">
            E(m₁) × E(m₂) mod n² = E(m₁ + m₂)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Multiplying ciphertexts equals encrypting the sum of plaintexts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

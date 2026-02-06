"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encrypt, type PaillierPublicKey, type EncryptionResult } from "@/lib/paillier";
import { Users, ThumbsUp, ThumbsDown, Plus, Trash2, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface VoterData {
  id: number;
  name: string;
  vote: 0 | 1 | null;
  encryption: EncryptionResult | null;
}

interface VotingPanelProps {
  publicKey: PaillierPublicKey;
  voters: VoterData[];
  onVotersChange: (voters: VoterData[]) => void;
}

export function VotingPanel({ publicKey, voters, onVotersChange }: VotingPanelProps) {
  const addVoter = () => {
    const newVoter: VoterData = {
      id: Date.now(),
      name: `Voter ${voters.length + 1}`,
      vote: null,
      encryption: null,
    };
    onVotersChange([...voters, newVoter]);
  };

  const removeVoter = (id: number) => {
    onVotersChange(voters.filter((v) => v.id !== id));
  };

  const castVote = (id: number, vote: 0 | 1) => {
    const updatedVoters = voters.map((voter) => {
      if (voter.id === id) {
        const message = BigInt(vote);
        const encryption = encrypt(message, publicKey);
        return { ...voter, vote, encryption };
      }
      return voter;
    });
    onVotersChange(updatedVoters);
  };

  const formatBigInt = (n: bigint): string => {
    const str = n.toString();
    if (str.length > 16) {
      return str.slice(0, 8) + "..." + str.slice(-8);
    }
    return str;
  };

  const votedCount = voters.filter((v) => v.vote !== null).length;
  const yesCount = voters.filter((v) => v.vote === 1).length;
  const noCount = voters.filter((v) => v.vote === 0).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Vote className="h-5 w-5 text-primary" />
            Voting Booth
          </CardTitle>
          <Button
            onClick={addVoter}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Voter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <Badge variant="secondary" className="bg-secondary text-foreground">
            <Users className="h-3 w-3 mr-1" />
            {voters.length} Voters
          </Badge>
          <Badge variant="secondary" className="bg-secondary text-foreground">
            {votedCount} / {voters.length} Voted
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {yesCount} Yes
          </Badge>
          <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
            <ThumbsDown className="h-3 w-3 mr-1" />
            {noCount} No
          </Badge>
        </div>

        {voters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No voters yet. Click &quot;Add Voter&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Voter</TableHead>
                  <TableHead className="text-muted-foreground">Vote</TableHead>
                  <TableHead className="text-muted-foreground">Random r</TableHead>
                  <TableHead className="text-muted-foreground">Ciphertext c</TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voters.map((voter) => (
                  <TableRow key={voter.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium text-foreground">
                      {voter.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={voter.vote === 1 ? "default" : "outline"}
                          onClick={() => castVote(voter.id, 1)}
                          className={
                            voter.vote === 1
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant={voter.vote === 0 ? "default" : "outline"}
                          onClick={() => castVote(voter.id, 0)}
                          className={
                            voter.vote === 0
                              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          No
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {voter.encryption ? (
                        <span className="text-primary">{formatBigInt(voter.encryption.r)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-xs">
                      {voter.encryption ? (
                        <span className="text-foreground break-all">
                          {formatBigInt(voter.encryption.ciphertext)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVoter(voter.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Encryption Formula */}
        <div className="bg-secondary rounded-lg p-4 mt-4">
          <p className="text-sm text-muted-foreground mb-2">Encryption Formula:</p>
          <p className="font-mono text-sm text-foreground">
            {"c = g^m × r^n mod n²"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Where m ∈ {"{ 0, 1 }"} (No = 0, Yes = 1), r is random, and (n, g) is the public key
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

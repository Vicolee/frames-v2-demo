"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useAccount, useSignMessage, usePublicClient } from "wagmi";
import { useFrameContext } from "~/components/providers/frame-provider";
import { encodeHeader, encodePayload, type JsonFarcasterSignatureHeader } from "@farcaster/jfs";
import { type Hex } from "viem";

// Helper to convert signature to base64url
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function SignManifest() {
  const [domain, setDomain] = useState("frames-v2-demo-lilac.vercel.app");
  const [fidInput, setFidInput] = useState("");
  const [encodedHeader, setEncodedHeader] = useState<string | null>(null);
  const [encodedPayload, setEncodedPayload] = useState<string | null>(null);
  const [accountAssociation, setAccountAssociation] = useState<{
    header: string;
    payload: string;
    signature: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { user } = useFrameContext();
  const publicClient = usePublicClient();
  const { signMessage, data: signature, isPending, reset } = useSignMessage();

  // Pre-fill FID input from context when it becomes available
  useEffect(() => {
    if (user?.fid && !fidInput) {
      setFidInput(user.fid.toString());
    }
  }, [user?.fid, fidInput]);

  // Parse FID from input
  const fid = fidInput ? parseInt(fidInput, 10) : undefined;

  const handleSignManifest = () => {
    if (!address || !fid || isNaN(fid)) {
      setError("Wallet not connected or FID not valid");
      return;
    }

    setError(null);
    setAccountAssociation(null);
    reset();

    try {
      // Create JFS header
      const header: JsonFarcasterSignatureHeader = {
        fid,
        type: "custody",
        key: address as Hex,
      };

      // Create JFS payload
      const payload = { domain };

      // Encode header and payload
      const headerEncoded = encodeHeader(header);
      const payloadEncoded = encodePayload(payload);

      setEncodedHeader(headerEncoded);
      setEncodedPayload(payloadEncoded);

      // Sign the message: header.payload
      const signingInput = `${headerEncoded}.${payloadEncoded}`;
      signMessage({ message: signingInput });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create signature");
    }
  };

  // Process signature when it arrives
  useEffect(() => {
    if (signature && encodedHeader && encodedPayload) {
      // Convert hex signature to base64url
      // Remove 0x prefix and convert hex to bytes, then to base64url
      const hexString = signature.slice(2); // Remove 0x
      const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const base64 = btoa(String.fromCharCode(...bytes));
      const encodedSignature = toBase64Url(base64);

      setAccountAssociation({
        header: encodedHeader,
        payload: encodedPayload,
        signature: encodedSignature,
      });

      // Optionally verify the signature using public client (smart wallet support)
      if (publicClient && address) {
        publicClient.verifyMessage({
          address,
          message: `${encodedHeader}.${encodedPayload}`,
          signature,
        }).then(isValid => {
          if (!isValid) {
            console.warn("Signature verification failed - this may be expected for some smart wallets before deployment");
          }
        }).catch(err => {
          console.warn("Could not verify signature:", err);
        });
      }
    }
  }, [signature, encodedHeader, encodedPayload, publicClient, address]);

  const copyToClipboard = () => {
    if (accountAssociation) {
      navigator.clipboard.writeText(JSON.stringify(accountAssociation, null, 2));
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground mb-2">
        Sign a JSON Farcaster Signature (JFS) for manifest domain verification. 
        This generates an <code className="bg-muted px-1 rounded">accountAssociation</code> object for your <code className="bg-muted px-1 rounded">farcaster.json</code>.
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">FID</label>
        <input
          type="number"
          value={fidInput}
          onChange={(e) => setFidInput(e.target.value)}
          className="w-full p-2 border border-border rounded text-sm"
          placeholder="Your Farcaster ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Domain</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full p-2 border border-border rounded text-sm"
          placeholder="your-domain.com"
        />
        <p className="text-xs text-muted-foreground mt-1">
          The domain to sign for (without https://)
        </p>
      </div>

      <Button
        onClick={handleSignManifest}
        disabled={isPending || !address || !fid || isNaN(fid)}
        className="w-full"
      >
        {isPending ? "Signing..." : "Sign Manifest"}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {accountAssociation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Account Association</div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
            >
              Copy
            </Button>
          </div>
          <pre className="p-3 bg-muted border border-border rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(accountAssociation, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground">
            Add this to your <code className="bg-muted px-1 rounded">/.well-known/farcaster.json</code> manifest.
          </p>
        </div>
      )}
    </div>
  );
}


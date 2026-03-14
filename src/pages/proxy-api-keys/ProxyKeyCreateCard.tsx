import type { FormEvent } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProxyKeyCreateCardProps {
  authAvailable: boolean;
  createDisabled: boolean;
  creatingProxyKey: boolean;
  handleCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  latestGeneratedKey: string | null;
  proxyKeyLimit: number;
  proxyKeyName: string;
  proxyKeyNotes: string;
  proxyKeysUsed: number;
  remainingKeys: number;
  setProxyKeyName: (value: string) => void;
  setProxyKeyNotes: (value: string) => void;
}

export function ProxyKeyCreateCard({
  authAvailable,
  createDisabled,
  creatingProxyKey,
  handleCreateSubmit,
  latestGeneratedKey,
  proxyKeyLimit,
  proxyKeyName,
  proxyKeyNotes,
  proxyKeysUsed,
  remainingKeys,
  setProxyKeyName,
  setProxyKeyNotes,
}: ProxyKeyCreateCardProps) {
  return (
    <form onSubmit={handleCreateSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Create proxy key</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a name and optional note, then create a new client credential.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestGeneratedKey ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                    New secret
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This full key is shown once. Store it before leaving the page.
                  </p>
                </div>
                <CopyButton
                  value={latestGeneratedKey}
                  label="Copy key"
                  targetLabel="API key"
                  variant="outline"
                />
              </div>
              <div className="mt-4 rounded-md border bg-background px-3 py-3">
                <p className="break-all font-mono text-sm">{latestGeneratedKey}</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="proxy-key-name" className="text-xs text-muted-foreground">
                Name
              </Label>
              <Input
                id="proxy-key-name"
                value={proxyKeyName}
                onChange={(event) => setProxyKeyName(event.target.value)}
                placeholder="Production client"
                disabled={creatingProxyKey || !authAvailable}
                className="w-56"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="proxy-key-notes" className="text-xs text-muted-foreground">
                Notes
              </Label>
              <Input
                id="proxy-key-notes"
                value={proxyKeyNotes}
                onChange={(event) => setProxyKeyNotes(event.target.value)}
                placeholder="Used by the main website"
                disabled={creatingProxyKey || !authAvailable}
                className="w-72"
              />
            </div>

            <Button type="submit" disabled={createDisabled}>
              {creatingProxyKey
                ? "Creating..."
                : remainingKeys === 0
                  ? "Key limit reached"
                  : "Create key"}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {proxyKeysUsed} / {proxyKeyLimit} keys used
            </p>
            <p>
              {remainingKeys} slot{remainingKeys === 1 ? "" : "s"} remaining.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

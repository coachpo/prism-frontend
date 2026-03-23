import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  proxyKeyName: string;
  proxyKeyNotes: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setProxyKeyName: (value: string) => void;
  setProxyKeyNotes: (value: string) => void;
};

export function EditProxyKeyDialog({
  open,
  proxyKeyName,
  proxyKeyNotes,
  saving,
  onOpenChange,
  onSubmit,
  setProxyKeyName,
  setProxyKeyNotes,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Proxy API Key</DialogTitle>
          <DialogDescription>
            Update the stored name and note for this issued key. Rotating the secret is a
            separate action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxy-key-edit-name">Name</Label>
            <Input
              id="proxy-key-edit-name"
              value={proxyKeyName}
              onChange={(event) => setProxyKeyName(event.target.value)}
              placeholder="Production client"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxy-key-edit-note">Note</Label>
            <Input
              id="proxy-key-edit-note"
              value={proxyKeyNotes}
              onChange={(event) => setProxyKeyNotes(event.target.value)}
              placeholder="Used by the main website"
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !proxyKeyName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

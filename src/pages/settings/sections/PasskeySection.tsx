import { useState, useEffect } from "react";
import { Fingerprint, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { registerPasskey } from "@/lib/webauthn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PasskeyCredential {
  id: number;
  device_name: string | null;
  backup_eligible: boolean | null;
  backup_state: boolean | null;
  created_at: string;
  last_used_at: string | null;
}

export function PasskeySection() {
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  // Registration dialog state
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  
  // Removal dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [passkeyToRemove, setPasskeyToRemove] = useState<PasskeyCredential | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      setIsSupported(false);
      setLoading(false);
      return;
    }

    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      const response = await api.settings.auth.webauthn.listCredentials();
      setPasskeys(response.items);
    } catch {
      toast.error("Failed to load passkeys");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setDeviceName("");
    setRegisterDialogOpen(true);
  };

  const handleRegisterSubmit = async () => {
    if (!deviceName.trim()) {
      toast.error("Device name is required");
      return;
    }

    setRegistering(true);
    try {
      await registerPasskey(deviceName.trim());
      toast.success("Passkey registered successfully");
      setRegisterDialogOpen(false);
      await fetchPasskeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveClick = (passkey: PasskeyCredential) => {
    setPasskeyToRemove(passkey);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!passkeyToRemove) return;

    setRemoving(true);
    try {
      await api.settings.auth.webauthn.revokeCredential(passkeyToRemove.id);
      toast.success("Passkey removed successfully");
      setRemoveDialogOpen(false);
      setPasskeyToRemove(null);
      await fetchPasskeys();
    } catch {
      toast.error("Failed to remove passkey");
    } finally {
      setRemoving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <section id="passkeys" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Fingerprint className="h-4 w-4" />
                Passkeys
              </CardTitle>
              <CardDescription className="text-xs">
                Sign in securely with your device's fingerprint, face recognition, or screen lock.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {passkeys.length} Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Your browser or device does not support Passkeys (WebAuthn).
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={handleRegisterClick} disabled={loading || registering}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register New Passkey
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <p className="text-sm text-muted-foreground">Loading passkeys...</p>
                </div>
              ) : passkeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                  <Fingerprint className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No passkeys registered</p>
                  <p className="text-xs text-muted-foreground">
                    Register a passkey to sign in without a password.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {passkeys.map((passkey) => (
                    <Card key={passkey.id} className="shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {passkey.device_name || `Passkey #${passkey.id}`}
                            </p>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <p>Created: {formatDate(passkey.created_at)}</p>
                              <p>Last used: {formatDate(passkey.last_used_at)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveClick(passkey)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove passkey</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Passkey</DialogTitle>
            <DialogDescription>
              Give this device a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                placeholder="e.g., My MacBook Pro"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterDialogOpen(false)}
              disabled={registering}
            >
              Cancel
            </Button>
            <Button onClick={handleRegisterSubmit} disabled={registering || !deviceName.trim()}>
              {registering ? "Registering..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the passkey "{passkeyToRemove?.device_name || `Passkey #${passkeyToRemove?.id ?? ""}`}"? You will no longer be able to use this device to sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { buildPasskeyMetadata, getPasskeyStateBadge } from "./passkeyMetadata";
import { usePasskeyManagement } from "./usePasskeyManagement";

export function PasskeysCard({ authEnabled }: { authEnabled: boolean }) {
  const {
    deviceName,
    handleRegisterClick,
    handleRegisterSubmit,
    handleRemoveClick,
    handleRemoveConfirm,
    isPasskeySupported,
    loadingPasskeys,
    passkeyToRemove,
    passkeys,
    registerDialogOpen,
    registering,
    removeDialogOpen,
    removing,
    setDeviceName,
    setRegisterDialogOpen,
    setRemoveDialogOpen,
  } = usePasskeyManagement(authEnabled);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fingerprint className="h-4 w-4" />
                  Passkeys
                </CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {passkeys.length} registered
                </Badge>
              </div>
              <CardDescription className="max-w-2xl text-sm leading-6">
                Sign in with Touch ID, Face ID, Windows Hello, or your device screen lock.
                Existing passkeys appear below so you can review or remove them quickly.
              </CardDescription>
            </div>

            <Button
              type="button"
              onClick={handleRegisterClick}
              disabled={!authEnabled || !isPasskeySupported || loadingPasskeys || registering}
              className="h-9 w-9 rounded-full p-0 sm:w-auto sm:rounded-md sm:px-4"
            >
              <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
              <span className="hidden sm:inline">Add passkey</span>
              <span className="sr-only sm:hidden">Add passkey</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {!authEnabled ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
              <Fingerprint className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Authentication is disabled</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Enable authentication to register and manage passkeys.
              </p>
            </div>
          ) : !isPasskeySupported ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Your browser or device does not support Passkeys (WebAuthn).
              </p>
            </div>
          ) : loadingPasskeys ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">Loading passkeys...</p>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
              <Fingerprint className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No passkeys registered</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add a passkey to sign in with biometrics or your device lock screen instead of
                typing a password every time.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/70">
              <div className="divide-y divide-border/70">
                {passkeys.map((passkey) => {
                  const passkeyName = passkey.device_name || `Passkey #${passkey.id}`;
                  const stateBadge = getPasskeyStateBadge(passkey);

                  return (
                    <div
                      key={passkey.id}
                      className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50">
                          <Fingerprint className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {passkeyName}
                            </p>
                            {stateBadge ? (
                              <Badge variant="outline" className={stateBadge.className}>
                                {stateBadge.label}
                              </Badge>
                            ) : null}
                          </div>

                          <p className="text-sm leading-6 text-muted-foreground">
                            {buildPasskeyMetadata(passkey)}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveClick(passkey)}
                        aria-label={`Remove ${passkeyName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                onChange={(event) => setDeviceName(event.target.value)}
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

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the passkey "
              {passkeyToRemove?.device_name || `Passkey #${passkeyToRemove?.id ?? ""}`}
              "? You will no longer be able to use this device to sign in.
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
            <Button variant="destructive" onClick={handleRemoveConfirm} disabled={removing}>
              {removing ? "Removing..." : "Remove Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

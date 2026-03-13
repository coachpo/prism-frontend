import { useEffect, useState, type ReactNode } from "react";
import { Fingerprint, MailCheck, Plus, Shield, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { registerPasskey } from "@/lib/webauthn";
import type { AuthSettings } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SwitchController } from "@/components/SwitchController";

interface AuthenticationSectionProps {
  authSettings: AuthSettings | null;
  authEnabled: boolean;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  passwordError: string | null;
  setPassword: (value: string) => void;
  passwordConfirm: string;
  passwordMismatch: boolean;
  setPasswordConfirm: (value: string) => void;
  emailVerificationOtp: string;
  setEmailVerificationOtp: (value: string) => void;
  sendingEmailVerification: boolean;
  confirmingEmailVerification: boolean;
  authSaving: boolean;
  onRequestEmailVerification: () => Promise<void>;
  onConfirmEmailVerification: () => Promise<void>;
  onSaveAuthSettings: (nextEnabled?: boolean) => Promise<void>;
}

interface PasskeyCredential {
  id: number;
  device_name: string | null;
  backup_eligible: boolean | null;
  backup_state: boolean | null;
  created_at: string;
  last_used_at: string | null;
}

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
  style: "short",
});

function formatCreatedDate(dateString: string) {
  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unknown date";
  }

  return createdDateFormatter.format(timestamp);
}

function formatRelativeLastUsed(dateString: string | null) {
  if (!dateString) {
    return "Not used yet";
  }

  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unknown last use";
  }

  const delta = timestamp.getTime() - Date.now();
  const absoluteDelta = Math.abs(delta);

  if (absoluteDelta < 60_000) {
    return "just now";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];

  for (const [unit, size] of units) {
    if (absoluteDelta >= size) {
      return relativeTimeFormatter.format(Math.round(delta / size), unit);
    }
  }

  return "just now";
}

function getPasskeyStateBadge(passkey: PasskeyCredential) {
  if (passkey.backup_state) {
    return {
      label: "Synced",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (passkey.backup_eligible === true) {
    return {
      label: "Backup ready",
      className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  if (passkey.backup_eligible === false) {
    return {
      label: "Device-bound",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return null;
}

function buildPasskeyMetadata(passkey: PasskeyCredential) {
  const parts = [`Created ${formatCreatedDate(passkey.created_at)}`];

  if (passkey.last_used_at) {
    parts.push(`Last used ${formatRelativeLastUsed(passkey.last_used_at)}`);
  } else {
    parts.push("Not used yet");
  }

  if (passkey.backup_state) {
    parts.push("Synced to your account");
  } else if (passkey.backup_eligible === true) {
    parts.push("Backup capable");
  } else if (passkey.backup_eligible === false) {
    parts.push("Stored on this device");
  }

  return parts.join(" · ");
}

export function AuthenticationSection({
  authSettings,
  authEnabled,
  username,
  setUsername,
  email,
  setEmail,
  password,
  passwordError,
  setPassword,
  passwordConfirm,
  passwordMismatch,
  setPasswordConfirm,
  emailVerificationOtp,
  setEmailVerificationOtp,
  sendingEmailVerification,
  confirmingEmailVerification,
  authSaving,
  onRequestEmailVerification,
  onConfirmEmailVerification,
  onSaveAuthSettings,
}: AuthenticationSectionProps) {
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(true);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [passkeyToRemove, setPasskeyToRemove] = useState<PasskeyCredential | null>(null);
  const [removing, setRemoving] = useState(false);

  const [emailEditorOpen, setEmailEditorOpen] = useState(false);
  const verificationPending = Boolean(authSettings?.pending_email);
  const verifiedEmail = authSettings?.email ?? null;
  const emailVerified = Boolean(
    verifiedEmail && authSettings?.email_bound_at && !verificationPending
  );
  const emailChanged = Boolean(email.trim()) && email.trim() !== (verifiedEmail ?? "");
  const showEmailEditor =
    emailEditorOpen || verificationPending || emailChanged || !emailVerified;
  const usernameReady = username.trim().length > 0;
  const passwordReady = authSettings?.has_password
    ? !passwordError && !passwordMismatch
    : Boolean(password) && !passwordError && !passwordMismatch;
  const emailReady = emailVerified;
  const setupReady = usernameReady && emailReady && passwordReady;
  const statusDescription = authEnabled
    ? "Operator sign-in is active for the Web UI and protected proxy traffic."
    : "Complete the operator account and recovery email setup below before turning on sign-in.";

  useEffect(() => {
    if (!window.PublicKeyCredential) {
      setIsPasskeySupported(false);
      setLoadingPasskeys(false);
      return;
    }

    void fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      const response = await api.settings.auth.webauthn.listCredentials();
      setPasskeys(response.items);
    } catch {
      toast.error("Failed to load passkeys");
    } finally {
      setLoadingPasskeys(false);
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
    if (!passkeyToRemove) {
      return;
    }

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

  return (
    <section id="authentication" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Configure the single Prism operator account and verified recovery email
                used for sign-in.
              </CardDescription>
            </div>
            <Badge variant={authEnabled ? "default" : "outline"} className="w-fit">
              {authEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Authentication status</CardTitle>
              <CardDescription>
                <span className="font-medium text-foreground">
                  Authentication: {authEnabled ? "On" : "Off"}
                </span>{" "}
                {statusDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SwitchController
                label="Enable authentication"
                description="Sign-in can only be enabled after the operator account and recovery email are fully configured."
                checked={authEnabled}
                disabled={authSaving || (!setupReady && !authEnabled)}
                onCheckedChange={(checked) => {
                  void onSaveAuthSettings(checked);
                }}
                className="border-border bg-muted/20"
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Operator account</CardTitle>
                <CardDescription>
                  Configure the single local operator identity used to sign in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldShell
                  label="Username"
                  helper="This will be the only local sign-in name for this Prism instance."
                >
                  <Input
                    id="auth-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin"
                  />
                </FieldShell>

                <FieldShell
                  label="Password"
                  helper={
                    passwordError
                      ? passwordError
                      : authSettings?.has_password
                      ? "Leave blank to keep the current password."
                      : "Set a password before enabling authentication."
                  }
                  helperClassName={passwordError ? "text-destructive" : undefined}
                >
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </FieldShell>

                <FieldShell
                  label="Confirm password"
                  helper={
                    passwordMismatch
                      ? "Passwords must match before you can continue."
                      : "Repeat the password exactly to confirm it."
                  }
                  helperClassName={passwordMismatch ? "text-destructive" : undefined}
                >
                  <Input
                    id="auth-password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                  />
                </FieldShell>

                <div className="rounded-lg border bg-muted/30 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Save setup changes before enabling authentication if you update the
                      operator account.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onSaveAuthSettings(authEnabled)}
                      disabled={authSaving || Boolean(passwordError) || passwordMismatch}
                    >
                      {authSaving ? "Saving..." : "Save account changes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recovery email</CardTitle>
                <CardDescription>
                  Verify a recovery email before authentication can be turned on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailVerified && !showEmailEditor ? (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Verified email</p>
                        <p className="text-sm text-muted-foreground">{verifiedEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        >
                          Verified
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEmail(authSettings?.email ?? "");
                            setEmailEditorOpen(true);
                          }}
                        >
                          Change email
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FieldShell
                      label="Email address"
                      helper="If you change the recovery email, you must verify the new address with OTP."
                    >
                      <Input
                        id="auth-email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="operator@example.com"
                      />
                    </FieldShell>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void onRequestEmailVerification()}
                        disabled={sendingEmailVerification || !email.trim()}
                      >
                        <MailCheck className="mr-2 h-3.5 w-3.5" />
                        {sendingEmailVerification
                          ? "Sending code..."
                          : verificationPending
                            ? "Resend code"
                            : "Send verification code"}
                      </Button>
                    </div>

                    {showEmailEditor ? (
                      <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-4">
                        <p className="text-sm font-medium">Verify email</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {verificationPending
                            ? `A verification code was sent to ${authSettings?.pending_email}. Enter it below to confirm.`
                            : "Send a verification code after changing the email address."}
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                          <FieldShell label="Verification code">
                            <Input
                              value={emailVerificationOtp}
                              onChange={(event) =>
                                setEmailVerificationOtp(event.target.value)
                              }
                              placeholder="Enter OTP"
                            />
                          </FieldShell>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              onClick={() => void onConfirmEmailVerification()}
                              disabled={
                                confirmingEmailVerification || !emailVerificationOtp.trim()
                              }
                            >
                              <MailCheck className="mr-2 h-3.5 w-3.5" />
                              {confirmingEmailVerification ? "Verifying..." : "Verify"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none">
            <CardHeader className="gap-4 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Fingerprint className="h-4 w-4 text-primary" />
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
                  disabled={!isPasskeySupported || loadingPasskeys || registering}
                  className="h-9 w-9 rounded-full p-0 sm:w-auto sm:rounded-md sm:px-4"
                >
                  <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
                  <span className="hidden sm:inline">Add passkey</span>
                  <span className="sr-only sm:hidden">Add passkey</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {!isPasskeySupported ? (
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
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-primary">
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
    </section>
  );
}

function FieldShell({
  label,
  helper,
  helperClassName,
  children,
}: {
  label: string;
  helper?: string;
  helperClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {helper ? (
        <p className={`text-xs ${helperClassName ?? "text-muted-foreground"}`}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

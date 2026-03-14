import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthenticationFieldShell } from "./AuthenticationFieldShell";
import type { AuthenticationSectionProps } from "./types";

export function AuthenticationSetupGrid({
  authEnabled,
  authSaving,
  authSettings,
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
  onRequestEmailVerification,
  onConfirmEmailVerification,
  onSaveAuthSettings,
}: AuthenticationSectionProps) {
  const [emailEditorOpen, setEmailEditorOpen] = useState(false);

  const verificationPending = Boolean(authSettings?.pending_email);
  const verifiedEmail = authSettings?.email ?? null;
  const emailVerified = Boolean(
    verifiedEmail && authSettings?.email_bound_at && !verificationPending
  );
  const emailChanged = Boolean(email.trim()) && email.trim() !== (verifiedEmail ?? "");
  const showEmailEditor = emailEditorOpen || verificationPending || emailChanged || !emailVerified;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operator account</CardTitle>
          <CardDescription>
            Configure the single local operator identity used to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthenticationFieldShell
            label="Username"
            helper="This will be the only local sign-in name for this Prism instance."
            htmlFor="auth-username"
          >
            <Input
              id="auth-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </AuthenticationFieldShell>

          <AuthenticationFieldShell
            label="Password"
            helper={
              passwordError
                ? passwordError
                : authSettings?.has_password
                  ? "Leave blank to keep the current password."
                  : "Set a password before enabling authentication."
            }
            helperClassName={passwordError ? "text-destructive" : undefined}
            htmlFor="auth-password"
          >
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </AuthenticationFieldShell>

          <AuthenticationFieldShell
            label="Confirm password"
            helper={
              passwordMismatch
                ? "Passwords must match before you can continue."
                : "Repeat the password exactly to confirm it."
            }
            helperClassName={passwordMismatch ? "text-destructive" : undefined}
            htmlFor="auth-password-confirm"
          >
            <Input
              id="auth-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </AuthenticationFieldShell>

          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Save setup changes before enabling authentication if you update the operator account.
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
              <AuthenticationFieldShell
                label="Email address"
                helper="If you change the recovery email, you must verify the new address with OTP."
                htmlFor="auth-email"
              >
                <Input
                  id="auth-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="operator@example.com"
                />
              </AuthenticationFieldShell>

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
                    <AuthenticationFieldShell label="Verification code">
                      <Input
                        value={emailVerificationOtp}
                        onChange={(event) => setEmailVerificationOtp(event.target.value)}
                        placeholder="Enter OTP"
                      />
                    </AuthenticationFieldShell>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={() => void onConfirmEmailVerification()}
                        disabled={confirmingEmailVerification || !emailVerificationOtp.trim()}
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
  );
}

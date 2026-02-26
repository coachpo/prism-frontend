import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Download, RotateCcw, ShieldOff, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { ConfigImportSchema } from "@/lib/configImportValidation";
import type { ApiKeyResponse, ConfigImportRequest, PasskeyResponse } from "@/lib/types";
import {
  base64UrlToArrayBuffer,
  isWebAuthnSupported,
  uint8ArrayToBase64Url,
} from "@/lib/webauthn";

export function SettingsPage() {
  const auth = useAuth();

  const [email, setEmail] = useState("admin@example.com");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("StrongPassword!123");

  const [setupChallengeId, setSetupChallengeId] = useState("");
  const [setupOtpCode, setSetupOtpCode] = useState("");
  const [setupDebugOtp, setSetupDebugOtp] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [disableChallengeId, setDisableChallengeId] = useState("");
  const [disableOtpCode, setDisableOtpCode] = useState("");
  const [disableDebugOtp, setDisableDebugOtp] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState("default-key");
  const [newApiKeyExpiresAt, setNewApiKeyExpiresAt] = useState("");
  const [newPlainApiKey, setNewPlainApiKey] = useState<string | null>(null);

  const [passkeys, setPasskeys] = useState<PasskeyResponse[]>([]);
  const [passkeyName, setPasskeyName] = useState("Laptop Passkey");
  const [passkeyOtpChallengeId, setPasskeyOtpChallengeId] = useState("");
  const [passkeyOtpCode, setPasskeyOtpCode] = useState("");
  const [passkeyDebugOtp, setPasskeyDebugOtp] = useState<string | null>(null);

  const [revokeOtpChallengeId, setRevokeOtpChallengeId] = useState("");
  const [revokeOtpCode, setRevokeOtpCode] = useState("");
  const [revokeDebugOtp, setRevokeDebugOtp] = useState<string | null>(null);

  const [configPayload, setConfigPayload] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageSecurity = useMemo(
    () => auth.authEnabled && auth.isAuthenticated,
    [auth.authEnabled, auth.isAuthenticated],
  );

  async function loadSecurityData() {
    if (!canManageSecurity) {
      setApiKeys([]);
      setPasskeys([]);
      return;
    }
    try {
      const [nextKeys, nextPasskeys] = await Promise.all([
        api.auth.listApiKeys(),
        api.auth.listPasskeys(),
      ]);
      setApiKeys(nextKeys);
      setPasskeys(nextPasskeys);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load security settings";
      toast.error(message);
    }
  }

  useEffect(() => {
    void loadSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageSecurity]);

  async function requestSetupOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.setupRequestOtp({ email });
      setSetupChallengeId(challenge.otp_challenge_id);
      setSetupDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setSetupOtpCode(challenge.debug_otp_code);
      }
      toast.success("Setup OTP requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function enableAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await auth.enableAuth({
        email,
        username,
        password,
        otp_challenge_id: setupChallengeId,
        otp_code: setupOtpCode,
      });
      await auth.refreshStatus();
      toast.success("Authentication enabled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enable auth";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestDisableOtp() {
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.disableRequestOtp();
      setDisableChallengeId(challenge.otp_challenge_id);
      setDisableDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setDisableOtpCode(challenge.debug_otp_code);
      }
      toast.success("Disable-auth OTP requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request disable OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function disableAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.auth.disableConfirm({
        otp_challenge_id: disableChallengeId,
        otp_code: disableOtpCode,
      });
      await auth.refreshStatus();
      toast.success("Authentication disabled and auth data purged");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to disable authentication";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeAllSessions() {
    setIsSubmitting(true);
    try {
      await api.auth.revokeAllSessions();
      toast.success("All sessions revoked");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke sessions";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.auth.createApiKey({
        name: newApiKeyName,
        expires_at: newApiKeyExpiresAt || null,
      });
      setNewPlainApiKey(created.plain_api_key);
      toast.success("API key created (shown once)");
      await loadSecurityData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create API key";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeApiKey(keyId: string) {
    setIsSubmitting(true);
    try {
      await api.auth.revokeApiKey(keyId);
      toast.success("API key revoked");
      await loadSecurityData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke API key";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestPasskeyCreateOtp() {
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.requestPasskeyOtp({ email, action: "create" });
      setPasskeyOtpChallengeId(challenge.otp_challenge_id);
      setPasskeyDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setPasskeyOtpCode(challenge.debug_otp_code);
      }
      toast.success("Passkey create OTP requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request passkey OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createPasskey() {
    setIsSubmitting(true);
    try {
      if (!isWebAuthnSupported()) {
        throw new Error("Passkeys are not supported in this browser");
      }
      const begin = await api.auth.beginPasskeyRegistration({
        otp_challenge_id: passkeyOtpChallengeId,
        otp_code: passkeyOtpCode,
        name: passkeyName,
      });
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64UrlToArrayBuffer(begin.challenge),
          rp: {
            id: begin.rp_id,
            name: begin.rp_name,
          },
          user: {
            id: new TextEncoder().encode(begin.user_id),
            name: begin.user_name,
            displayName: begin.user_name,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          timeout: 60_000,
          attestation: "none",
          authenticatorSelection: {
            userVerification: "required",
          },
        },
      });
      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error("Failed to create WebAuthn credential");
      }

      const response = credential.response;
      if (!(response instanceof AuthenticatorAttestationResponse)) {
        throw new Error("Invalid WebAuthn attestation response");
      }

      await api.auth.finishPasskeyRegistration({
        challenge_id: begin.challenge_id,
        credential_id: uint8ArrayToBase64Url(credential.rawId),
        attestation_object: uint8ArrayToBase64Url(response.attestationObject),
        client_data_json: uint8ArrayToBase64Url(response.clientDataJSON),
        transports: response.getTransports?.() ?? null,
        name: passkeyName,
      });
      toast.success("Passkey created");
      await loadSecurityData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create passkey";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestPasskeyRevokeOtp() {
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.requestPasskeyOtp({ email, action: "revoke" });
      setRevokeOtpChallengeId(challenge.otp_challenge_id);
      setRevokeDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setRevokeOtpCode(challenge.debug_otp_code);
      }
      toast.success("Passkey revoke OTP requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request revoke OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokePasskey(passkeyId: string) {
    setIsSubmitting(true);
    try {
      await api.auth.revokePasskey(passkeyId, {
        otp_challenge_id: revokeOtpChallengeId,
        otp_code: revokeOtpCode,
      });
      toast.success("Passkey revoked");
      await loadSecurityData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke passkey";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function exportConfig() {
    setIsSubmitting(true);
    try {
      const payload = await api.config.export();
      const template: ConfigImportRequest = {
        profiles: payload.profiles.map((profile) => ({
          ...profile,
          api_key: "",
          models: profile.models.map((model) => ({
            ...model,
            pricing: model.pricing ? { ...model.pricing } : null,
          })),
        })),
      };
      setConfigPayload(JSON.stringify(template, null, 2));
      toast.success("Config template generated. Fill profile api_key values before importing.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export config";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function importConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const parsed: ConfigImportRequest = ConfigImportSchema.parse(JSON.parse(configPayload));
      await api.config.import(parsed);
      toast.success("Config imported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import config";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings & Security</h1>
        <p className="text-sm text-muted-foreground">
          Configure authentication lifecycle, API keys, passkeys, and V2 config import/export.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication status</CardTitle>
          <CardDescription>
            auth_enabled={String(auth.authEnabled)} • has_passkey={String(auth.hasPasskey)} •
            api_key_count={auth.apiKeyCount}
          </CardDescription>
        </CardHeader>
      </Card>

      {!auth.authEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Enable authentication</CardTitle>
            <CardDescription>
              Setup requires OTP verification and creates the single admin account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={requestSetupOtp}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="setup_email">Email</Label>
                <Input
                  id="setup_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="md:col-span-2 w-full md:w-auto">
                Request setup OTP
              </Button>
            </form>

            <form className="grid gap-4 border-t pt-4 md:grid-cols-2" onSubmit={enableAuth}>
              <div className="space-y-2">
                <Label htmlFor="setup_username">Username</Label>
                <Input
                  id="setup_username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_password">Password</Label>
                <Input
                  id="setup_password"
                  type="password"
                  minLength={12}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_challenge">OTP challenge ID</Label>
                <Input
                  id="setup_challenge"
                  value={setupChallengeId}
                  onChange={(event) => setSetupChallengeId(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_code">OTP code</Label>
                <Input
                  id="setup_code"
                  value={setupOtpCode}
                  onChange={(event) => setSetupOtpCode(event.target.value)}
                  minLength={6}
                  maxLength={6}
                  required
                />
                {setupDebugOtp && (
                  <p className="text-xs text-muted-foreground">
                    Debug OTP: <code>{setupDebugOtp}</code>
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="md:col-span-2">
                Enable authentication
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canManageSecurity && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change current password using verified current credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={changePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    minLength={12}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="md:col-span-2 w-full md:w-auto" disabled={isSubmitting}>
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API keys</CardTitle>
              <CardDescription>Create up to 10 active API keys; key values are returned once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={createApiKey}>
                <div className="space-y-2">
                  <Label htmlFor="api_key_name">Name</Label>
                  <Input
                    id="api_key_name"
                    value={newApiKeyName}
                    onChange={(event) => setNewApiKeyName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key_expiry">Expires at (optional)</Label>
                  <Input
                    id="api_key_expiry"
                    type="datetime-local"
                    value={newApiKeyExpiresAt}
                    onChange={(event) => setNewApiKeyExpiresAt(event.target.value)}
                  />
                </div>
                <Button type="submit" className="md:col-span-2 w-full md:w-auto" disabled={isSubmitting}>
                  Create API key
                </Button>
              </form>

              {newPlainApiKey && (
                <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium">Copy this API key now (shown once)</p>
                  <code className="mt-1 block break-all text-xs">{newPlainApiKey}</code>
                </div>
              )}

              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {key.key_prefix} • created {new Date(key.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => void revokeApiKey(key.id)}>
                      Revoke
                    </Button>
                  </div>
                ))}
                {!apiKeys.length && (
                  <p className="text-sm text-muted-foreground">No API keys yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Passkey create/revoke requires OTP and uses browser-native WebAuthn flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="passkey_email">Email for OTP actions</Label>
                  <Input
                    id="passkey_email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passkey_name">Passkey name</Label>
                  <Input
                    id="passkey_name"
                    value={passkeyName}
                    onChange={(event) => setPasskeyName(event.target.value)}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" onClick={() => void requestPasskeyCreateOtp()}>
                    Request create OTP
                  </Button>
                  <Button type="button" onClick={() => void createPasskey()}>
                    Create passkey
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passkey_create_challenge">Create OTP challenge ID</Label>
                  <Input
                    id="passkey_create_challenge"
                    value={passkeyOtpChallengeId}
                    onChange={(event) => setPasskeyOtpChallengeId(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passkey_create_code">Create OTP code</Label>
                  <Input
                    id="passkey_create_code"
                    value={passkeyOtpCode}
                    onChange={(event) => setPasskeyOtpCode(event.target.value)}
                    minLength={6}
                    maxLength={6}
                  />
                  {passkeyDebugOtp && (
                    <p className="text-xs text-muted-foreground">
                      Debug OTP: <code>{passkeyDebugOtp}</code>
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded border p-3 space-y-3">
                <p className="font-medium text-sm">Revoke flow</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Revoke OTP challenge ID"
                    value={revokeOtpChallengeId}
                    onChange={(event) => setRevokeOtpChallengeId(event.target.value)}
                  />
                  <Input
                    placeholder="Revoke OTP code"
                    value={revokeOtpCode}
                    onChange={(event) => setRevokeOtpCode(event.target.value)}
                    minLength={6}
                    maxLength={6}
                  />
                </div>
                {revokeDebugOtp && (
                  <p className="text-xs text-muted-foreground">
                    Debug OTP: <code>{revokeDebugOtp}</code>
                  </p>
                )}
                <Button type="button" variant="outline" onClick={() => void requestPasskeyRevokeOtp()}>
                  Request revoke OTP
                </Button>
              </div>

              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <div key={passkey.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
                    <div>
                      <p className="font-medium">{passkey.name ?? "Unnamed passkey"}</p>
                      <p className="text-xs text-muted-foreground">
                        created {new Date(passkey.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => void revokePasskey(passkey.id)}>
                      Revoke
                    </Button>
                  </div>
                ))}
                {!passkeys.length && (
                  <p className="text-sm text-muted-foreground">No passkeys configured.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disable authentication</CardTitle>
              <CardDescription>
                <span className="text-destructive font-medium">Destructive:</span> disabling auth
                purges user, passkey, API key, and OTP records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void requestDisableOtp()}>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Request disable OTP
                </Button>
                <Button type="button" variant="outline" onClick={() => void revokeAllSessions()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Revoke all sessions
                </Button>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={disableAuth}>
                <div className="space-y-2">
                  <Label htmlFor="disable_challenge">Disable OTP challenge ID</Label>
                  <Input
                    id="disable_challenge"
                    value={disableChallengeId}
                    onChange={(event) => setDisableChallengeId(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disable_code">Disable OTP code</Label>
                  <Input
                    id="disable_code"
                    value={disableOtpCode}
                    onChange={(event) => setDisableOtpCode(event.target.value)}
                    minLength={6}
                    maxLength={6}
                    required
                  />
                  {disableDebugOtp && (
                    <p className="text-xs text-muted-foreground">
                      Debug OTP: <code>{disableDebugOtp}</code>
                    </p>
                  )}
                </div>
                <Button type="submit" variant="destructive" disabled={isSubmitting} className="md:col-span-2">
                  Confirm disable auth
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Config import/export</CardTitle>
          <CardDescription>
            Export generates an import template; set each <code>profile.api_key</code> before import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void exportConfig()} disabled={isSubmitting}>
              <Download className="mr-2 h-4 w-4" />
              Export config
            </Button>
          </div>

          <form className="space-y-3" onSubmit={importConfig}>
            <Label htmlFor="config_payload">Config JSON</Label>
            <textarea
              id="config_payload"
              className="min-h-64 w-full rounded-md border bg-background px-3 py-2 text-xs"
              value={configPayload}
              onChange={(event) => setConfigPayload(event.target.value)}
              placeholder="Paste config template JSON with profile.api_key values"
            />
            <p className="text-xs text-muted-foreground">
              Import requires non-empty <code>api_key</code> for every profile.
            </p>
            <Button type="submit" disabled={isSubmitting || !configPayload.trim()}>
              <Upload className="mr-2 h-4 w-4" />
              Import config
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

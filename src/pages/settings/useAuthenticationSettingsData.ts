import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { api } from "@/lib/api";
import type { AuthSettings } from "@/lib/types";
import { toast } from "sonner";
import { validateAuthPassword } from "./settingsPageHelpers";

interface UseAuthenticationSettingsDataInput {
  navigate: NavigateFunction;
  refreshAuth: () => Promise<void>;
  revision: number;
}

export function useAuthenticationSettingsData({
  navigate,
  refreshAuth,
  revision,
}: UseAuthenticationSettingsDataInput) {
  const [authSettings, setAuthSettings] = useState<AuthSettings | null>(null);
  const [authEnabledInput, setAuthEnabledInput] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authSaving, setAuthSaving] = useState(false);
  const [emailVerificationOtp, setEmailVerificationOtp] = useState("");
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [confirmingEmailVerification, setConfirmingEmailVerification] = useState(false);

  const fetchAuthSettings = useCallback(async () => {
    try {
      const data = await api.settings.auth.get();
      setAuthSettings(data);
      setAuthEnabledInput(data.auth_enabled);
      setAuthUsername(data.username ?? "");
      setAuthEmail(data.pending_email ?? data.email ?? "");
      setAuthPassword("");
      setAuthPasswordConfirm("");
      setEmailVerificationOtp("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load authentication settings");
    }
  }, []);

  useEffect(() => {
    void fetchAuthSettings();
  }, [fetchAuthSettings, revision]);

  const authPasswordError = useMemo(() => validateAuthPassword(authPassword), [authPassword]);
  const authPasswordMismatch = useMemo(
    () => Boolean(authPassword) && authPassword !== authPasswordConfirm,
    [authPassword, authPasswordConfirm]
  );

  const handleSaveAuthSettings = useCallback(
    async (nextEnabled?: boolean) => {
      const wasEnabled = authSettings?.auth_enabled ?? false;
      const isDisablingAuth = nextEnabled === false && wasEnabled;

      if (!isDisablingAuth && authPasswordError) {
        toast.error(authPasswordError);
        return;
      }
      if (!isDisablingAuth && authPasswordMismatch) {
        toast.error("Passwords do not match");
        return;
      }

      const targetEnabled = nextEnabled ?? authEnabledInput;
      setAuthEnabledInput(targetEnabled);
      setAuthSaving(true);

      try {
        const saved = await api.settings.auth.update({
          auth_enabled: targetEnabled,
          username: authUsername.trim() || null,
          password: isDisablingAuth ? null : authPassword || null,
        });

        setAuthSettings(saved);
        setAuthEnabledInput(saved.auth_enabled);
        setAuthUsername(saved.username ?? "");
        setAuthEmail(saved.pending_email ?? saved.email ?? "");
        setAuthPassword("");
        setAuthPasswordConfirm("");

        try {
          await refreshAuth();
        } catch {
          void 0;
        }

        if (!wasEnabled && saved.auth_enabled) {
          toast.success("Authentication enabled. Sign in to continue.");
          navigate("/login", { replace: true });
          return;
        }

        toast.success("Authentication settings saved");
      } catch (error) {
        setAuthEnabledInput(authSettings?.auth_enabled ?? false);
        toast.error(error instanceof Error ? error.message : "Failed to save authentication settings");
      } finally {
        setAuthSaving(false);
      }
    },
    [authEnabledInput, authPassword, authPasswordError, authPasswordMismatch, authSettings, authUsername, navigate, refreshAuth]
  );

  const handleRequestEmailVerification = useCallback(async () => {
    if (!authEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setSendingEmailVerification(true);
    try {
      const result = await api.settings.auth.requestEmailVerification({
        email: authEmail.trim(),
      });
      setAuthSettings((prev) =>
        prev
          ? {
              ...prev,
              email: result.email,
              email_bound_at: result.email_bound_at,
              pending_email: result.pending_email,
              email_verification_required: Boolean(result.pending_email),
            }
          : prev
      );
      toast.success("Verification code sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setSendingEmailVerification(false);
    }
  }, [authEmail]);

  const handleConfirmEmailVerification = useCallback(async () => {
    if (!emailVerificationOtp.trim()) {
      toast.error("Verification code is required");
      return;
    }

    setConfirmingEmailVerification(true);
    try {
      const result = await api.settings.auth.confirmEmailVerification({
        otp_code: emailVerificationOtp.trim(),
      });
      setAuthSettings((prev) =>
        prev
          ? {
              ...prev,
              email: result.email,
              email_bound_at: result.email_bound_at,
              pending_email: result.pending_email,
              email_verification_required: Boolean(result.pending_email),
            }
          : prev
      );
      setAuthEmail(result.email ?? authEmail);
      setEmailVerificationOtp("");
      toast.success("Email verified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify email");
    } finally {
      setConfirmingEmailVerification(false);
    }
  }, [authEmail, emailVerificationOtp]);

  return {
    authEmail,
    authEnabledInput,
    authPassword,
    authPasswordConfirm,
    authPasswordError,
    authPasswordMismatch,
    authSaving,
    authSettings,
    authUsername,
    confirmingEmailVerification,
    emailVerificationOtp,
    handleConfirmEmailVerification,
    handleRequestEmailVerification,
    handleSaveAuthSettings,
    sendingEmailVerification,
    setAuthEmail,
    setAuthPassword,
    setAuthPasswordConfirm,
    setAuthUsername,
    setEmailVerificationOtp,
  };
}

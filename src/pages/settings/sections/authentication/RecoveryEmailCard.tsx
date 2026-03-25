import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { Input } from "@/components/ui/input";
import { AuthenticationFieldShell } from "./AuthenticationFieldShell";
import type { AuthenticationSectionProps } from "./types";

type RecoveryEmailCardProps = Pick<
  AuthenticationSectionProps,
  | "authSettings"
  | "confirmingEmailVerification"
  | "email"
  | "emailVerificationOtp"
  | "onConfirmEmailVerification"
  | "onRequestEmailVerification"
  | "sendingEmailVerification"
  | "setEmail"
  | "setEmailVerificationOtp"
>;

export function RecoveryEmailCard({
  authSettings,
  confirmingEmailVerification,
  email,
  emailVerificationOtp,
  onConfirmEmailVerification,
  onRequestEmailVerification,
  sendingEmailVerification,
  setEmail,
  setEmailVerificationOtp,
}: RecoveryEmailCardProps) {
  const { locale } = useLocale();
  const [emailEditorOpen, setEmailEditorOpen] = useState(false);
  const verificationPending = Boolean(authSettings?.pending_email);
  const verifiedEmail = authSettings?.email ?? null;
  const emailVerified = Boolean(
    verifiedEmail && authSettings?.email_bound_at && !verificationPending,
  );
  const emailChanged = Boolean(email.trim()) && email.trim() !== (verifiedEmail ?? "");
  const showEmailEditor = emailEditorOpen || verificationPending || emailChanged || !emailVerified;

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{locale === "zh-CN" ? "恢复邮箱" : "Recovery email"}</CardTitle>
        <CardDescription>
          {locale === "zh-CN"
            ? "在开启身份验证前，必须先验证一个恢复邮箱。"
            : "Verify a recovery email before authentication can be turned on."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailVerified && !showEmailEditor ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{locale === "zh-CN" ? "已验证邮箱" : "Verified email"}</p>
                  <p className="text-sm text-muted-foreground">{verifiedEmail}</p>
                </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  >
                    {locale === "zh-CN" ? "已验证" : "Verified"}
                  </Badge>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmail(authSettings?.email ?? "");
                    setEmailEditorOpen(true);
                  }}
                  >
                    {locale === "zh-CN" ? "更改邮箱" : "Change email"}
                  </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
              <AuthenticationFieldShell
                label={locale === "zh-CN" ? "邮箱地址" : "Email address"}
                helper={locale === "zh-CN" ? "如果你更改了恢复邮箱，则必须使用 OTP 验证新的地址。" : "If you change the recovery email, you must verify the new address with OTP."}
                htmlFor="auth-email"
              >
              <Input
                id="auth-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                  placeholder={locale === "zh-CN" ? "operator@example.com" : "operator@example.com"}
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
                    ? locale === "zh-CN"
                      ? "发送中..."
                      : "Sending code..."
                    : verificationPending
                      ? locale === "zh-CN"
                        ? "重新发送验证码"
                        : "Resend code"
                      : locale === "zh-CN"
                        ? "发送验证码"
                        : "Send verification code"}
                </Button>
              </div>

            {showEmailEditor ? (
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-4">
                <p className="text-sm font-medium">{locale === "zh-CN" ? "验证邮箱" : "Verify email"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {verificationPending
                    ? locale === "zh-CN"
                      ? `验证码已发送至 ${authSettings?.pending_email}。请在下方输入验证码完成确认。`
                      : `A verification code was sent to ${authSettings?.pending_email}. Enter it below to confirm.`
                    : locale === "zh-CN"
                      ? "更改邮箱地址后，请先发送验证码。"
                      : "Send a verification code after changing the email address."}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <AuthenticationFieldShell label={locale === "zh-CN" ? "验证码" : "Verification code"}>
                    <Input
                      value={emailVerificationOtp}
                      onChange={(event) => setEmailVerificationOtp(event.target.value)}
                      placeholder={locale === "zh-CN" ? "输入 OTP" : "Enter OTP"}
                    />
                  </AuthenticationFieldShell>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => void onConfirmEmailVerification()}
                      disabled={confirmingEmailVerification || !emailVerificationOtp.trim()}
                      >
                        <MailCheck className="mr-2 h-3.5 w-3.5" />
                        {confirmingEmailVerification
                          ? locale === "zh-CN"
                            ? "验证中..."
                            : "Verifying..."
                          : locale === "zh-CN"
                            ? "验证"
                            : "Verify"}
                      </Button>
                    </div>
                  </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

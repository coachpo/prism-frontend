import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { Input } from "@/components/ui/input";
import { AuthenticationFieldShell } from "./AuthenticationFieldShell";
import type { AuthenticationSectionProps } from "./types";

type OperatorEmailCardProps = Pick<
  AuthenticationSectionProps,
  | "authEnabled"
  | "authSaving"
  | "authSettings"
  | "onSaveAuthSettings"
  | "password"
  | "passwordConfirm"
  | "passwordError"
  | "passwordMismatch"
  | "setPassword"
  | "setPasswordConfirm"
  | "setUsername"
  | "username"
>;

export function OperatorEmailCard({
  authEnabled,
  authSaving,
  authSettings,
  onSaveAuthSettings,
  password,
  passwordConfirm,
  passwordError,
  passwordMismatch,
  setPassword,
  setPasswordConfirm,
  setUsername,
  username,
}: OperatorEmailCardProps) {
  const { locale } = useLocale();
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{locale === "zh-CN" ? "操作员账户" : "Operator account"}</CardTitle>
        <CardDescription>
          {locale === "zh-CN"
            ? "配置用于登录的唯一本地操作员身份。"
            : "Configure the single local operator identity used to sign in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthenticationFieldShell
          label={locale === "zh-CN" ? "用户名" : "Username"}
          helper={locale === "zh-CN" ? "这将是此 Prism 实例唯一的本地登录名。" : "This will be the only local sign-in name for this Prism instance."}
          htmlFor="auth-username"
        >
          <Input
            id="auth-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={locale === "zh-CN" ? "管理员" : "admin"}
          />
        </AuthenticationFieldShell>

        <AuthenticationFieldShell
          label={locale === "zh-CN" ? "密码" : "Password"}
          helper={
            passwordError
              ? passwordError
              : authSettings?.has_password
                ? locale === "zh-CN"
                  ? "留空可保留当前密码。"
                  : "Leave blank to keep the current password."
                : locale === "zh-CN"
                  ? "请先设置密码，再启用身份验证。"
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
          label={locale === "zh-CN" ? "确认密码" : "Confirm password"}
          helper={
            passwordMismatch
              ? locale === "zh-CN"
                ? "继续之前，两次输入的密码必须一致。"
                : "Passwords must match before you can continue."
              : locale === "zh-CN"
                ? "请再次准确输入密码以确认。"
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
                {locale === "zh-CN"
                  ? "如果你更新了操作员账户，请先保存设置更改，再启用身份验证。"
                  : "Save setup changes before enabling authentication if you update the operator account."}
              </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onSaveAuthSettings(authEnabled)}
              disabled={authSaving || Boolean(passwordError) || passwordMismatch}
            >
              {authSaving
                ? locale === "zh-CN"
                  ? "保存中..."
                  : "Saving..."
                : locale === "zh-CN"
                  ? "保存账户更改"
                  : "Save account changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

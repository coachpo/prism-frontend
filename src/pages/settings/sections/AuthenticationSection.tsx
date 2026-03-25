import { Shield } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthenticationSetupGrid } from "./authentication/AuthenticationSetupGrid";
import { AuthenticationStatusCard } from "./authentication/AuthenticationStatusCard";
import { PasskeysCard } from "./authentication/PasskeysCard";
import type { AuthenticationSectionProps } from "./authentication/types";

export function AuthenticationSection({
  authEnabled,
  authSettings,
  authSaving,
  password,
  passwordError,
  passwordMismatch,
  username,
  ...props
}: AuthenticationSectionProps) {
  const { locale } = useLocale();
  const usernameReady = username.trim().length > 0;
  const passwordReady = authSettings?.has_password
    ? !passwordError && !passwordMismatch
    : Boolean(password) && !passwordError && !passwordMismatch;
  const emailReady = Boolean(
    authSettings?.email && authSettings.email_bound_at && !authSettings.pending_email
  );
  const setupReady = usernameReady && emailReady && passwordReady;
  const statusDescription = authEnabled
    ? locale === "zh-CN"
      ? "Web UI 和受保护的代理流量已启用操作员登录。"
      : "Operator sign-in is active for the Web UI and protected proxy traffic."
    : locale === "zh-CN"
      ? "请先完成下方的操作员账户和恢复邮箱设置，再开启登录。"
      : "Complete the operator account and recovery email setup below before turning on sign-in.";

  return (
    <section id="authentication" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                {locale === "zh-CN" ? "身份验证" : "Authentication"}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === "zh-CN"
                  ? "配置唯一的 Prism 操作员账户和已验证的恢复邮箱，用于登录。适用于所有配置档案。"
                  : "Configure the single Prism operator account and verified recovery email used for sign-in. Applies to all profiles."}
              </CardDescription>
            </div>
            <Badge variant={authEnabled ? "default" : "outline"} className="w-fit">
              {authEnabled ? (locale === "zh-CN" ? "已启用" : "Enabled") : locale === "zh-CN" ? "已禁用" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthenticationStatusCard
            authEnabled={authEnabled}
            authSaving={authSaving}
            setupReady={setupReady}
            statusDescription={statusDescription}
            onSaveAuthSettings={props.onSaveAuthSettings}
          />

          <AuthenticationSetupGrid
            authEnabled={authEnabled}
            authSaving={authSaving}
            authSettings={authSettings}
            password={password}
            passwordError={passwordError}
            passwordMismatch={passwordMismatch}
            username={username}
            {...props}
          />

          <PasskeysCard authEnabled={authEnabled} />
        </CardContent>
      </Card>
    </section>
  );
}

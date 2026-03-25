import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { SwitchController } from "@/components/SwitchController";

interface AuthenticationStatusCardProps {
  authEnabled: boolean;
  authSaving: boolean;
  setupReady: boolean;
  statusDescription: string;
  onSaveAuthSettings: (nextEnabled?: boolean) => Promise<void>;
}

export function AuthenticationStatusCard({
  authEnabled,
  authSaving,
  setupReady,
  statusDescription,
  onSaveAuthSettings,
}: AuthenticationStatusCardProps) {
  const { locale } = useLocale();
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{locale === "zh-CN" ? "身份验证状态" : "Authentication status"}</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">
            {locale === "zh-CN" ? "身份验证：" : "Authentication: "}
            {authEnabled ? (locale === "zh-CN" ? "开启" : "On") : locale === "zh-CN" ? "关闭" : "Off"}
          </span>{" "}
          {statusDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SwitchController
          label={locale === "zh-CN" ? "启用身份验证" : "Enable authentication"}
          description={
            locale === "zh-CN"
              ? "只有在操作员账户和恢复邮箱都完成配置后，才可以启用登录。"
              : "Sign-in can only be enabled after the operator account and recovery email are fully configured."
          }
          checked={authEnabled}
          disabled={authSaving || (!setupReady && !authEnabled)}
          onCheckedChange={(checked) => {
            void onSaveAuthSettings(checked);
          }}
          className="border-border bg-muted/20"
        />
      </CardContent>
    </Card>
  );
}

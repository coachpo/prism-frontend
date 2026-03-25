import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";

interface ProxyKeyStatusCalloutProps {
  authEnabled: boolean;
}

export function ProxyKeyStatusCallout({ authEnabled }: ProxyKeyStatusCalloutProps) {
  const { locale } = useLocale();
  return (
    <div
      className={
        authEnabled
          ? "rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4"
          : "rounded-lg border border-amber-500/25 bg-amber-500/10 p-4"
      }
    >
      <div className="flex items-start gap-3">
        {authEnabled ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {authEnabled
              ? locale === "zh-CN"
                ? "这些密钥已用于受保护的代理流量。"
                : "Keys are active for protected proxy traffic."
              : locale === "zh-CN"
                ? "这些密钥已准备就绪，但在启用身份验证前不会生效。"
                : "Keys are prepared but not enforced until authentication is enabled."}
          </p>
          <p className="text-sm text-muted-foreground">
            {authEnabled
              ? locale === "zh-CN"
                ? "发送到 `/v1/*` 和 `/v1beta/*` 的请求必须携带有效密钥。"
                : "Requests to `/v1/*` and `/v1beta/*` must present a valid key."
              : locale === "zh-CN"
                ? "当你准备好强制使用这些密钥时，请在设置中启用身份验证。"
                : "Enable authentication in Settings when you are ready to enforce these keys."}
          </p>
        </div>
      </div>
    </div>
  );
}

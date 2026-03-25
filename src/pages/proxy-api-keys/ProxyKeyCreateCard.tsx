import type { ComponentProps } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

interface ProxyKeyCreateCardProps {
  authAvailable: boolean;
  createDisabled: boolean;
  creatingProxyKey: boolean;
  handleCreateSubmit: FormSubmitHandler;
  latestGeneratedKey: string | null;
  proxyKeyLimit: number;
  proxyKeyName: string;
  proxyKeyNotes: string;
  proxyKeysUsed: number;
  remainingKeys: number;
  setProxyKeyName: (value: string) => void;
  setProxyKeyNotes: (value: string) => void;
}

export function ProxyKeyCreateCard({
  authAvailable,
  createDisabled,
  creatingProxyKey,
  handleCreateSubmit,
  latestGeneratedKey,
  proxyKeyLimit,
  proxyKeyName,
  proxyKeyNotes,
  proxyKeysUsed,
  remainingKeys,
  setProxyKeyName,
  setProxyKeyNotes,
}: ProxyKeyCreateCardProps) {
  const { locale } = useLocale();
  return (
    <form onSubmit={handleCreateSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{locale === "zh-CN" ? "创建代理密钥" : "Create proxy key"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {locale === "zh-CN"
                ? "添加名称和可选备注，然后创建一个新的客户端凭证。"
                : "Add a name and optional note, then create a new client credential."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestGeneratedKey ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                    {locale === "zh-CN" ? "新密钥" : "New secret"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "zh-CN"
                      ? "完整密钥只会显示一次。离开页面前请妥善保存。"
                      : "This full key is shown once. Store it before leaving the page."}
                  </p>
                </div>
                <CopyButton
                  value={latestGeneratedKey}
                  label={locale === "zh-CN" ? "复制密钥" : "Copy key"}
                  targetLabel={locale === "zh-CN" ? "API 密钥" : "API key"}
                  variant="outline"
                />
              </div>
              <div className="mt-4 rounded-md border bg-background px-3 py-3">
                <p className="break-all font-mono text-sm">{latestGeneratedKey}</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="proxy-key-name" className="text-xs text-muted-foreground">
                {locale === "zh-CN" ? "名称" : "Name"}
              </Label>
              <Input
                id="proxy-key-name"
                value={proxyKeyName}
                onChange={(event) => setProxyKeyName(event.target.value)}
                placeholder={locale === "zh-CN" ? "生产客户端" : "Production client"}
                disabled={creatingProxyKey || !authAvailable}
                className="w-56"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="proxy-key-notes" className="text-xs text-muted-foreground">
                {locale === "zh-CN" ? "备注" : "Notes"}
              </Label>
              <Input
                id="proxy-key-notes"
                value={proxyKeyNotes}
                onChange={(event) => setProxyKeyNotes(event.target.value)}
                placeholder={locale === "zh-CN" ? "供主站使用" : "Used by the main website"}
                disabled={creatingProxyKey || !authAvailable}
                className="w-72"
              />
            </div>

            <Button type="submit" disabled={createDisabled}>
              {creatingProxyKey
                ? locale === "zh-CN"
                  ? "创建中..."
                  : "Creating..."
                : remainingKeys === 0
                  ? locale === "zh-CN"
                    ? "已达到密钥上限"
                    : "Key limit reached"
                  : locale === "zh-CN"
                    ? "创建密钥"
                    : "Create key"}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {locale === "zh-CN"
                ? `${proxyKeysUsed} / ${proxyKeyLimit} 个密钥已使用`
                : `${proxyKeysUsed} / ${proxyKeyLimit} keys used`}
            </p>
            <p>
              {locale === "zh-CN"
                ? `${remainingKeys} 个可用名额剩余。`
                : `${remainingKeys} slot${remainingKeys === 1 ? "" : "s"} remaining.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

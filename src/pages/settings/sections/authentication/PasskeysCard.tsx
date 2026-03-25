import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { buildPasskeyMetadata, getPasskeyStateBadge } from "./passkeyMetadata";
import { usePasskeyManagement } from "./usePasskeyManagement";

export function PasskeysCard({ authEnabled }: { authEnabled: boolean }) {
  const { locale } = useLocale();
  const {
    deviceName,
    handleRegisterClick,
    handleRegisterSubmit,
    handleRemoveClick,
    handleRemoveConfirm,
    isPasskeySupported,
    loadingPasskeys,
    passkeyToRemove,
    passkeys,
    registerDialogOpen,
    registering,
    removeDialogOpen,
    removing,
    setDeviceName,
    setRegisterDialogOpen,
    setRemoveDialogOpen,
  } = usePasskeyManagement(authEnabled);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fingerprint className="h-4 w-4" />
                  {locale === "zh-CN" ? "通行密钥" : "Passkeys"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {locale === "zh-CN" ? `已注册 ${passkeys.length} 个` : `${passkeys.length} registered`}
                </Badge>
              </div>
              <CardDescription className="max-w-2xl text-sm leading-6">
                {locale === "zh-CN"
                  ? "使用 Touch ID、Face ID、Windows Hello 或设备锁屏进行登录。已存在的通行密钥会显示在下方，方便你快速查看或移除。"
                  : "Sign in with Touch ID, Face ID, Windows Hello, or your device screen lock. Existing passkeys appear below so you can review or remove them quickly."}
              </CardDescription>
            </div>

            <Button
              type="button"
              onClick={handleRegisterClick}
              disabled={!authEnabled || !isPasskeySupported || loadingPasskeys || registering}
              className="h-9 w-9 rounded-full p-0 sm:w-auto sm:rounded-md sm:px-4"
            >
              <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
              <span className="hidden sm:inline">{locale === "zh-CN" ? "新增通行密钥" : "Add passkey"}</span>
              <span className="sr-only sm:hidden">{locale === "zh-CN" ? "新增通行密钥" : "Add passkey"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {!authEnabled ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
              <Fingerprint className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{locale === "zh-CN" ? "身份验证已禁用" : "Authentication is disabled"}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {locale === "zh-CN" ? "启用身份验证后即可注册和管理通行密钥。" : "Enable authentication to register and manage passkeys."}
              </p>
            </div>
          ) : !isPasskeySupported ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {locale === "zh-CN" ? "你的浏览器或设备不支持通行密钥（WebAuthn）。" : "Your browser or device does not support Passkeys (WebAuthn)."}
              </p>
            </div>
          ) : loadingPasskeys ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">{locale === "zh-CN" ? "正在加载通行密钥..." : "Loading passkeys..."}</p>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
              <Fingerprint className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{locale === "zh-CN" ? "当前没有已注册的通行密钥" : "No passkeys registered"}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {locale === "zh-CN"
                  ? "新增通行密钥后，即可使用生物识别或设备锁屏登录，而无需每次输入密码。"
                  : "Add a passkey to sign in with biometrics or your device lock screen instead of typing a password every time."}
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
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50">
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
                        aria-label={locale === "zh-CN" ? `移除 ${passkeyName}` : `Remove ${passkeyName}`}
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

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "zh-CN" ? "注册通行密钥" : "Register Passkey"}</DialogTitle>
            <DialogDescription>
              {locale === "zh-CN" ? "为此设备命名，便于后续识别。" : "Give this device a name to help you identify it later."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">{locale === "zh-CN" ? "设备名称" : "Device Name"}</Label>
              <Input
                id="device-name"
                placeholder={locale === "zh-CN" ? "例如：我的 MacBook Pro" : "e.g., My MacBook Pro"}
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
              {locale === "zh-CN" ? "取消" : "Cancel"}
            </Button>
            <Button onClick={handleRegisterSubmit} disabled={registering || !deviceName.trim()}>
              {registering
                ? locale === "zh-CN"
                  ? "注册中..."
                  : "Registering..."
                : locale === "zh-CN"
                  ? "继续"
                  : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "zh-CN" ? "移除通行密钥" : "Remove Passkey"}</DialogTitle>
            <DialogDescription>
              {locale === "zh-CN"
                ? `确定要移除通行密钥“${passkeyToRemove?.device_name || `Passkey #${passkeyToRemove?.id ?? ""}`}”吗？移除后将无法再使用此设备登录。`
                : `Are you sure you want to remove the passkey "${passkeyToRemove?.device_name || `Passkey #${passkeyToRemove?.id ?? ""}`}"? You will no longer be able to use this device to sign in.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={removing}
            >
              {locale === "zh-CN" ? "取消" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleRemoveConfirm} disabled={removing}>
              {removing
                ? locale === "zh-CN"
                  ? "移除中..."
                  : "Removing..."
                : locale === "zh-CN"
                  ? "移除通行密钥"
                  : "Remove Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

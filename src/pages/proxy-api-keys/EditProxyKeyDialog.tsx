import type { ComponentProps } from "react";
import { SwitchController } from "@/components/SwitchController";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
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

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

type Props = {
  open: boolean;
  proxyKeyActive: boolean;
  proxyKeyName: string;
  proxyKeyNotes: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: FormSubmitHandler;
  setProxyKeyActive: (value: boolean) => void;
  setProxyKeyName: (value: string) => void;
  setProxyKeyNotes: (value: string) => void;
};

export function EditProxyKeyDialog({
  open,
  proxyKeyActive,
  proxyKeyName,
  proxyKeyNotes,
  saving,
  onOpenChange,
  onSubmit,
  setProxyKeyActive,
  setProxyKeyName,
  setProxyKeyNotes,
}: Props) {
  const { locale } = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "编辑代理 API 密钥" : "Edit Proxy API Key"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? "更新这个已发放密钥的名称、备注和启用状态。轮换密钥是单独的操作。"
              : "Update the stored name, note, and active state for this issued key. Rotating the secret is a separate action."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxy-key-edit-name">{locale === "zh-CN" ? "名称" : "Name"}</Label>
            <Input
              id="proxy-key-edit-name"
              value={proxyKeyName}
              onChange={(event) => setProxyKeyName(event.target.value)}
              placeholder={locale === "zh-CN" ? "生产客户端" : "Production client"}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxy-key-edit-note">{locale === "zh-CN" ? "备注" : "Note"}</Label>
            <Input
              id="proxy-key-edit-note"
              value={proxyKeyNotes}
              onChange={(event) => setProxyKeyNotes(event.target.value)}
              placeholder={locale === "zh-CN" ? "供主站使用" : "Used by the main website"}
              disabled={saving}
            />
          </div>

          <SwitchController
            label={locale === "zh-CN" ? "启用" : "Active"}
            checked={proxyKeyActive}
            onCheckedChange={setProxyKeyActive}
            disabled={saving}
            className="border-border bg-muted/20"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {locale === "zh-CN" ? "取消" : "Cancel"}
            </Button>
            <Button type="submit" disabled={saving || !proxyKeyName.trim()}>
              {saving
                ? locale === "zh-CN"
                  ? "保存中..."
                  : "Saving..."
                : locale === "zh-CN"
                  ? "保存"
                  : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

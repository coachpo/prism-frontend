import { EmptyState } from "@/components/EmptyState";
import { useLocale } from "@/i18n/useLocale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProxyApiKey } from "@/lib/types";
import { ProxyKeyCard } from "./ProxyKeyCard";

interface ProxyKeysListCardProps {
  authEnabled: boolean;
  deletingProxyKeyId: number | null;
  displayedProxyKeys: ProxyApiKey[];
  onDelete: (item: ProxyApiKey) => void;
  onEdit: (item: ProxyApiKey) => void;
  onRotate: (keyId: number) => void;
  rotatingProxyKeyId: number | null;
}

export function ProxyKeysListCard({
  authEnabled,
  deletingProxyKeyId,
  displayedProxyKeys,
  onDelete,
  onEdit,
  onRotate,
  rotatingProxyKeyId,
}: ProxyKeysListCardProps) {
  const { locale } = useLocale();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{locale === "zh-CN" ? "已发放密钥" : "Issued keys"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {locale === "zh-CN"
                ? "直接在下方列表中编辑元数据、轮换或删除密钥。"
                : "Edit metadata, rotate, or delete keys directly from the list below."}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {locale === "zh-CN"
              ? `${displayedProxyKeys.length} 个密钥`
              : `${displayedProxyKeys.length} key${displayedProxyKeys.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {displayedProxyKeys.length === 0 ? (
          <EmptyState
            title={locale === "zh-CN" ? "还没有创建代理密钥。" : "No proxy keys created yet."}
            className="rounded-md border border-dashed px-3 py-6 [&>div:first-child]:hidden"
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  <TableHead>{locale === "zh-CN" ? "名称 / 备注" : "Name / note"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "预览" : "Preview"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "创建时间" : "Created"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "更新时间" : "Updated"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "最后使用" : "Last used"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "最后 IP" : "Last IP"}</TableHead>
                  <TableHead className="text-right">{locale === "zh-CN" ? "操作" : "Operation"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProxyKeys.map((item) => {
                  const rotating = rotatingProxyKeyId === item.id;
                  const deleting = deletingProxyKeyId === item.id;

                  return (
                    <ProxyKeyCard
                      key={item.id}
                      item={item}
                      authEnabled={authEnabled}
                      rotating={rotating}
                      deleting={deleting}
                      onEdit={() => onEdit(item)}
                      onRotate={() => onRotate(item.id)}
                      onDelete={() => onDelete(item)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { PageHeader } from "@/components/PageHeader";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import { DeleteProxyKeyDialog } from "./proxy-api-keys/DeleteProxyKeyDialog";
import { EditProxyKeyDialog } from "./proxy-api-keys/EditProxyKeyDialog";
import { ProxyApiKeysPageSkeleton } from "./proxy-api-keys/ProxyApiKeysPageSkeleton";
import { ProxyKeyCreateCard } from "./proxy-api-keys/ProxyKeyCreateCard";
import { ProxyKeysListCard } from "./proxy-api-keys/ProxyKeysListCard";
import { ProxyKeyStatusCallout } from "./proxy-api-keys/ProxyKeyStatusCallout";
import { useProxyApiKeysPageData } from "./proxy-api-keys/useProxyApiKeysPageData";

export function ProxyApiKeysPage() {
  const { locale } = useLocale();
  const data = useProxyApiKeysPageData();
  const authStatusLabel = data.authSettings
    ? data.authSettings.auth_enabled
      ? locale === "zh-CN"
        ? "身份验证开启"
        : "Authentication On"
      : locale === "zh-CN"
        ? "身份验证关闭"
        : "Authentication Off"
    : locale === "zh-CN"
      ? "身份验证不可用"
      : "Authentication Unavailable";

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh-CN" ? "代理 API 密钥" : "Proxy API Keys"}
        description={
          locale === "zh-CN"
            ? "管理上游客户端用于访问 Prism 代理的机器凭证。适用于所有配置档案。"
            : "Manage machine credentials used by upstream clients to access the Prism proxy. Applies to all profiles."
        }
      >
        <Badge variant="outline" className={data.authStatusTone}>
          {authStatusLabel}
        </Badge>
      </PageHeader>

      {data.pageLoading ? (
        <ProxyApiKeysPageSkeleton />
      ) : (
        <>
          <ProxyKeyCreateCard
            authAvailable={Boolean(data.authSettings)}
            createDisabled={data.createDisabled}
            creatingProxyKey={data.creatingProxyKey}
            handleCreateSubmit={data.handleCreateSubmit}
            latestGeneratedKey={data.latestGeneratedKey}
            proxyKeyLimit={data.proxyKeyLimit}
            proxyKeyName={data.proxyKeyName}
            proxyKeyNotes={data.proxyKeyNotes}
            proxyKeysUsed={data.proxyKeys.length}
            remainingKeys={data.remainingKeys}
            setProxyKeyName={data.setProxyKeyName}
            setProxyKeyNotes={data.setProxyKeyNotes}
          />

          <ProxyKeyStatusCallout authEnabled={Boolean(data.authSettings?.auth_enabled)} />

          <ProxyKeysListCard
            displayedProxyKeys={data.displayedProxyKeys}
            authEnabled={Boolean(data.authSettings?.auth_enabled)}
            rotatingProxyKeyId={data.rotatingProxyKeyId}
            deletingProxyKeyId={data.deletingProxyKeyId}
            onRotate={(keyId) => {
              void data.handleRotateProxyKey(keyId);
            }}
            onEdit={data.startEditingProxyKey}
            onDelete={data.setDeleteConfirm}
          />
        </>
      )}

      <EditProxyKeyDialog
        open={data.editingProxyKey !== null}
        proxyKeyActive={data.editingProxyKeyActive}
        proxyKeyName={data.editingProxyKeyName}
        proxyKeyNotes={data.editingProxyKeyNotes}
        saving={data.savingEditedProxyKeyId !== null}
        onOpenChange={data.handleEditDialogOpenChange}
        onSubmit={data.handleEditSubmit}
        setProxyKeyActive={data.setEditingProxyKeyActive}
        setProxyKeyName={data.setEditingProxyKeyName}
        setProxyKeyNotes={data.setEditingProxyKeyNotes}
      />

      <DeleteProxyKeyDialog
        deleteConfirm={data.deleteConfirm}
        deletingProxyKeyId={data.deletingProxyKeyId}
        onClose={() => data.setDeleteConfirm(null)}
        onDelete={() => void data.handleDeleteProxyKey()}
        onOpenChange={data.handleDeleteDialogOpenChange}
      />
    </div>
  );
}

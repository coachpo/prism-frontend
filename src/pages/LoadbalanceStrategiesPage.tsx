import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { DeleteLoadbalanceStrategyDialog } from "./loadbalance-strategies/DeleteLoadbalanceStrategyDialog";
import { LoadbalanceStrategiesTable } from "./loadbalance-strategies/LoadbalanceStrategiesTable";
import { LoadbalanceStrategyDialog } from "./loadbalance-strategies/LoadbalanceStrategyDialog";
import { useLoadbalanceStrategiesPageData } from "./loadbalance-strategies/useLoadbalanceStrategiesPageData";

export function LoadbalanceStrategiesPage() {
  const { locale } = useLocale();
  const { selectedProfile, revision } = useProfileContext();
  const selectedProfileLabel = selectedProfile
    ? `${selectedProfile.name} (#${selectedProfile.id})`
    : "the selected profile";
  const data = useLoadbalanceStrategiesPageData(revision);

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh-CN" ? "负载均衡策略" : "Loadbalance Strategies"}
        description={
          locale === "zh-CN"
            ? "管理此配置档案可复用的原生模型路由策略"
            : "Manage reusable native-model routing strategies for this profile"
        }
      />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Badge
            variant="outline"
            className="w-fit border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
          >
            {locale === "zh-CN" ? "配置档案作用域设置" : "Profile-scoped settings"}
          </Badge>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {locale === "zh-CN"
              ? `此处的更改会影响 ${selectedProfileLabel} 及绑定到这些策略的原生模型。`
              : `Changes here affect ${selectedProfileLabel} and native models attached to these strategies.`}
          </p>
        </div>
      </div>

      <LoadbalanceStrategiesTable
        loadbalanceStrategies={data.loadbalanceStrategies}
        loadbalanceStrategiesLoading={data.loadbalanceStrategiesLoading}
        loadbalanceStrategyPreparingEditId={data.loadbalanceStrategyPreparingEditId}
        onCreate={data.openCreateLoadbalanceStrategyDialog}
        onDelete={data.handleDeleteLoadbalanceStrategyClick}
        onEdit={data.handleEditLoadbalanceStrategy}
      />

      <LoadbalanceStrategyDialog
        editingLoadbalanceStrategy={data.editingLoadbalanceStrategy}
        loadbalanceStrategyForm={data.loadbalanceStrategyForm}
        loadbalanceStrategySaving={data.loadbalanceStrategySaving}
        onClose={data.closeLoadbalanceStrategyDialog}
        onOpenChange={data.setLoadbalanceStrategyDialogOpen}
        onSave={data.handleSaveLoadbalanceStrategy}
        open={data.loadbalanceStrategyDialogOpen}
        setLoadbalanceStrategyForm={data.setLoadbalanceStrategyForm}
      />

      <DeleteLoadbalanceStrategyDialog
        deleteLoadbalanceStrategyConfirm={data.deleteLoadbalanceStrategyConfirm}
        loadbalanceStrategyDeleting={data.loadbalanceStrategyDeleting}
        onClose={() => data.setDeleteLoadbalanceStrategyConfirm(null)}
        onDelete={data.handleDeleteLoadbalanceStrategy}
      />
    </div>
  );
}

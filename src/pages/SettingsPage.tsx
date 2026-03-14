import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { BackupSection } from "./settings/sections/BackupSection";
import { BillingCurrencySection } from "./settings/sections/BillingCurrencySection";
import { TimezoneSection } from "./settings/sections/TimezoneSection";
import { AuditConfigurationSection } from "./settings/sections/AuditConfigurationSection";
import { AuthenticationSection } from "./settings/sections/AuthenticationSection";
import { RetentionDeletionSection } from "./settings/sections/RetentionDeletionSection";
import { DeleteConfirmDialog } from "./settings/dialogs/DeleteConfirmDialog";
import { RuleDialog } from "./settings/dialogs/RuleDialog";
import { DeleteRuleConfirmDialog } from "./settings/dialogs/DeleteRuleConfirmDialog";
import { SettingsSectionsNav } from "./settings/SettingsSectionsNav";
import { useSettingsSectionNavigation } from "./settings/useSettingsSectionNavigation";
import { useSettingsPageData } from "./settings/useSettingsPageData";

export function SettingsPage() {
  const location = useLocation();
  const auditConfigurationRef = useRef<HTMLDivElement | null>(null);
  const { activeSectionId, setActiveSectionId, isAuditConfigurationFocused } =
    useSettingsSectionNavigation(location);
  const data = useSettingsPageData();

  const handleJumpToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    setActiveSectionId(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage profile-scoped backup, reporting, privacy, and retention controls"
      />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Badge
            variant="outline"
            className="w-fit border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
          >
            Profile-scoped settings
          </Badge>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Changes here affect {data.selectedProfileLabel} and its runtime traffic.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <SettingsSectionsNav
            activeSectionId={activeSectionId}
            onJumpToSection={handleJumpToSection}
          />
        </aside>

        <div className="space-y-6">
          <BackupSection
            selectedProfileLabel={data.selectedProfileLabel}
            exportSecretsAcknowledged={data.exportSecretsAcknowledged}
            setExportSecretsAcknowledged={data.setExportSecretsAcknowledged}
            exporting={data.exporting}
            handleExport={data.handleExport}
            fileInputRef={data.fileInputRef}
            handleFileSelect={data.handleFileSelect}
            selectedFile={data.selectedFile}
            parsedConfig={data.parsedConfig}
            importSummary={data.importSummary}
            importing={data.importing}
            handleImport={data.handleImport}
          />

          <AuthenticationSection
            authSettings={data.authSettings}
            authEnabled={data.authEnabledInput}
            username={data.authUsername}
            setUsername={data.setAuthUsername}
            email={data.authEmail}
            setEmail={data.setAuthEmail}
            password={data.authPassword}
            passwordError={data.authPasswordError}
            setPassword={data.setAuthPassword}
            passwordConfirm={data.authPasswordConfirm}
            passwordMismatch={data.authPasswordMismatch}
            setPasswordConfirm={data.setAuthPasswordConfirm}
            emailVerificationOtp={data.emailVerificationOtp}
            setEmailVerificationOtp={data.setEmailVerificationOtp}
            sendingEmailVerification={data.sendingEmailVerification}
            confirmingEmailVerification={data.confirmingEmailVerification}
            onRequestEmailVerification={data.handleRequestEmailVerification}
            onConfirmEmailVerification={data.handleConfirmEmailVerification}
            authSaving={data.authSaving}
            onSaveAuthSettings={data.handleSaveAuthSettings}
          />

          <BillingCurrencySection
            billingDirty={data.billingDirty}
            renderSectionSaveState={data.renderSaveStateForSection}
            handleSaveCostingSettings={data.handleSaveCostingSettings}
            costingUnavailable={data.costingUnavailable}
            costingLoading={data.costingLoading}
            costingSaving={data.costingSaving}
            costingForm={data.costingForm}
            setCostingForm={data.setCostingForm}
            normalizedCurrentCosting={data.normalizedCurrentCosting}
            nativeModels={data.nativeModels}
            modelLabelMap={data.modelLabelMap}
            mappingConnections={data.mappingConnections}
            mappingLoading={data.mappingLoading}
            mappingModelId={data.mappingModelId}
            setMappingModelId={data.setMappingModelId}
            loadMappingConnections={data.loadMappingConnections}
            mappingEndpointId={data.mappingEndpointId}
            setMappingEndpointId={data.setMappingEndpointId}
            mappingEndpointOptions={data.mappingEndpointOptions}
            mappingFxRate={data.mappingFxRate}
            setMappingFxRate={data.setMappingFxRate}
            addMappingFxError={data.addMappingFxError}
            handleAddFxMapping={data.handleAddFxMapping}
            editingMappingKey={data.editingMappingKey}
            editingMappingFxRate={data.editingMappingFxRate}
            setEditingMappingFxRate={data.setEditingMappingFxRate}
            editMappingFxError={data.editMappingFxError}
            handleSaveEditFxMapping={data.handleSaveEditFxMapping}
            handleCancelEditFxMapping={data.handleCancelEditFxMapping}
            handleStartEditFxMapping={data.handleStartEditFxMapping}
            handleDeleteFxMapping={data.handleDeleteFxMapping}
          />

          <TimezoneSection
            timezoneDirty={data.timezoneDirty}
            renderSectionSaveState={data.renderSaveStateForSection}
            handleSaveCostingSettings={data.handleSaveCostingSettings}
            costingUnavailable={data.costingUnavailable}
            costingLoading={data.costingLoading}
            costingSaving={data.costingSaving}
            costingForm={data.costingForm}
            setCostingForm={data.setCostingForm}
            timezonePreviewText={data.timezonePreviewText}
            timezonePreviewZone={data.timezonePreviewZone}
          />

          <AuditConfigurationSection
            auditConfigurationRef={auditConfigurationRef}
            isAuditConfigurationFocused={isAuditConfigurationFocused}
            providers={data.providers}
            toggleAudit={data.toggleAudit}
            toggleBodies={data.toggleBodies}
            loadingRules={data.loadingRules}
            systemRulesOpen={data.systemRulesOpen}
            setSystemRulesOpen={data.setSystemRulesOpen}
            systemRules={data.systemRules}
            userRulesOpen={data.userRulesOpen}
            setUserRulesOpen={data.setUserRulesOpen}
            customRules={data.customRules}
            handleToggleRule={data.handleToggleRule}
            openAddRuleDialog={data.openAddRuleDialog}
            openEditRuleDialog={data.openEditRuleDialog}
            setDeleteRuleConfirm={data.setDeleteRuleConfirm}
          />

          <RetentionDeletionSection
            selectedProfileLabel={data.selectedProfileLabel}
            cleanupType={data.cleanupType}
            setCleanupType={data.setCleanupType}
            retentionPreset={data.retentionPreset}
            setRetentionPreset={data.setRetentionPreset}
            deleting={data.deleting}
            handleOpenDeleteConfirm={data.handleOpenDeleteConfirm}
          />
        </div>
      </div>

      <DeleteConfirmDialog
        deleteConfirm={data.deleteConfirm}
        setDeleteConfirm={data.setDeleteConfirm}
        selectedProfileLabel={data.selectedProfileLabel}
        deleteConfirmPhrase={data.deleteConfirmPhrase}
        setDeleteConfirmPhrase={data.setDeleteConfirmPhrase}
        handleBatchDelete={data.handleBatchDelete}
        deleting={data.deleting}
        isDeletePhraseValid={data.isDeletePhraseValid}
      />

      <RuleDialog
        ruleDialogOpen={data.ruleDialogOpen}
        setRuleDialogOpen={data.setRuleDialogOpen}
        editingRule={data.editingRule}
        ruleForm={data.ruleForm}
        setRuleForm={data.setRuleForm}
        handleSaveRule={data.handleSaveRule}
      />

      <DeleteRuleConfirmDialog
        deleteRuleConfirm={data.deleteRuleConfirm}
        setDeleteRuleConfirm={data.setDeleteRuleConfirm}
        handleDeleteRule={data.handleDeleteRule}
      />
    </div>
  );
}

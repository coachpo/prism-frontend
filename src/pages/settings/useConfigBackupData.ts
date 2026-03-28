import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import { ConfigImportSchema } from "@/lib/configImportValidation";
import type { ConfigImportRequest } from "@/lib/types";
import { toast } from "sonner";

interface UseConfigBackupDataInput {
  bumpRevision: () => void;
}

export function useConfigBackupData({ bumpRevision }: UseConfigBackupDataInput) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSecretsAcknowledged, setExportSecretsAcknowledged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ConfigImportRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetSelectedFile = () => {
    setSelectedFile(null);
    setParsedConfig(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const importSummary = useMemo(() => {
    const endpointsCount = parsedConfig?.endpoints?.length ?? 0;
    const strategiesCount = parsedConfig?.loadbalance_strategies?.length ?? 0;
    const modelsCount = parsedConfig?.models?.length ?? 0;
    const connectionsCount =
      parsedConfig?.models?.reduce((total, model) => total + (model.connections?.length ?? 0), 0) ?? 0;

    return {
      endpointsCount,
      strategiesCount,
      modelsCount,
      connectionsCount,
    };
  }, [parsedConfig]);

  const handleExport = async () => {
    const messages = getStaticMessages();
    if (!exportSecretsAcknowledged) {
      toast.error(messages.settingsBackupData.acknowledgeSecretsBeforeExport);
      return;
    }

    setExporting(true);
    try {
      const data = await api.config.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      anchor.href = url;
      anchor.download = `gateway-config-${date}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(messages.settingsBackupData.exportSucceeded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.settingsBackupData.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const messages = getStaticMessages();
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = ConfigImportSchema.safeParse(parsed);

      if (!validation.success) {
        const errors = validation.error.issues
          .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(messages.settingsBackupData.invalidConfigPayload(errors));
      }

      setParsedConfig(validation.data as ConfigImportRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.settingsBackupData.invalidJsonFile);
      resetSelectedFile();
    }
  };

  const handleImport = async () => {
    const messages = getStaticMessages();
    if (!parsedConfig) {
      return;
    }

    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(messages.settingsBackupData.importSucceeded(
        String(result.endpoints_imported),
        String(result.strategies_imported),
        String(result.models_imported),
        String(result.connections_imported),
      ));
      resetSelectedFile();
      bumpRevision();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.settingsBackupData.importFailed);
    } finally {
      setImporting(false);
    }
  };

  return {
    exportSecretsAcknowledged,
    exporting,
    fileInputRef,
    handleExport,
    handleFileSelect,
    handleImport,
    importSummary,
    importing,
    parsedConfig,
    selectedFile,
    setExportSecretsAcknowledged,
  };
}

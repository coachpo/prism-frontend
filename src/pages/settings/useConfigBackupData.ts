import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
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
    if (!exportSecretsAcknowledged) {
      toast.error("Acknowledge that endpoint API keys are included before exporting.");
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
      toast.success("Configuration exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
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
        throw new Error(`Invalid configuration payload: ${errors}`);
      }

      setParsedConfig(validation.data as ConfigImportRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON file");
      resetSelectedFile();
    }
  };

  const handleImport = async () => {
    if (!parsedConfig) {
      return;
    }

    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(
        `Imported ${result.endpoints_imported} endpoints, ${result.strategies_imported} strategies, ${result.models_imported} models, ${result.connections_imported} connections`
      );
      resetSelectedFile();
      bumpRevision();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
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

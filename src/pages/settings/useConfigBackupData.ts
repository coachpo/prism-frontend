import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { getCurrentLocale } from "@/i18n/format";
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
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!exportSecretsAcknowledged) {
      toast.error(
        isChinese
          ? "请先确认导出中包含端点 API 密钥。"
          : "Acknowledge that endpoint API keys are included before exporting.",
      );
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
      toast.success(isChinese ? "配置导出成功" : "Configuration exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "导出失败" : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const isChinese = getCurrentLocale() === "zh-CN";
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
      toast.error(error instanceof Error ? error.message : isChinese ? "无效的 JSON 文件" : "Invalid JSON file");
      resetSelectedFile();
    }
  };

  const handleImport = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!parsedConfig) {
      return;
    }

    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(
        isChinese
          ? `已导入 ${result.endpoints_imported} 个端点、${result.strategies_imported} 个策略、${result.models_imported} 个模型、${result.connections_imported} 个连接`
          : `Imported ${result.endpoints_imported} endpoints, ${result.strategies_imported} strategies, ${result.models_imported} models, ${result.connections_imported} connections`
      );
      resetSelectedFile();
      bumpRevision();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "导入失败" : "Import failed");
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

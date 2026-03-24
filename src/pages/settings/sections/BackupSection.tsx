import type { ChangeEvent, RefObject } from "react";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConfigImportRequest } from "@/lib/types";

interface BackupSectionProps {
  selectedProfileLabel: string;
  exportSecretsAcknowledged: boolean;
  setExportSecretsAcknowledged: (checked: boolean) => void;
  exporting: boolean;
  handleExport: () => Promise<void>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  selectedFile: File | null;
  parsedConfig: ConfigImportRequest | null;
  importSummary: {
    endpointsCount: number;
    strategiesCount: number;
    modelsCount: number;
    connectionsCount: number;
  };
  importing: boolean;
  handleImport: () => Promise<void>;
}

export function BackupSection({
  selectedProfileLabel,
  exportSecretsAcknowledged,
  setExportSecretsAcknowledged,
  exporting,
  handleExport,
  fileInputRef,
  handleFileSelect,
  selectedFile,
  parsedConfig,
  importSummary,
  importing,
  handleImport,
}: BackupSectionProps) {
  return (
    <section id="backup" tabIndex={-1} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Backup</h2>
        <p className="text-sm text-muted-foreground">
          Export or restore configuration snapshots for {selectedProfileLabel}.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              Export
            </CardTitle>
            <CardDescription className="text-xs">
              Download models, endpoints, blocklist rules, and reporting settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Exports include decrypted endpoint API keys. Handle backup files as
                sensitive credentials.
              </span>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input"
                checked={exportSecretsAcknowledged}
                onChange={(event) =>
                  setExportSecretsAcknowledged(event.currentTarget.checked)
                }
              />
              <span>I understand this export includes endpoint API keys.</span>
            </label>

            <Button
              onClick={() => void handleExport()}
              disabled={!exportSecretsAcknowledged || exporting}
              className="w-full"
            >
              {exporting ? "Exporting..." : "Export Configuration"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              Import
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a version 3 JSON backup file and restore this profile's
              configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
            />

            {selectedFile && parsedConfig && (
              <p className="text-sm text-muted-foreground">
                Loaded {selectedFile.name}: {importSummary.endpointsCount} endpoints,{" "}
                {importSummary.strategiesCount} strategies, {importSummary.modelsCount} models,{" "}
                {importSummary.connectionsCount} connections.
              </p>
            )}

            <Button
              onClick={() => void handleImport()}
              disabled={!parsedConfig || importing}
              variant="destructive"
              className="w-full"
            >
              {importing ? "Importing..." : "Import Configuration"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

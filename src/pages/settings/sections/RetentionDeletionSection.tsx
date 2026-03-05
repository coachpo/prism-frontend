import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RetentionDeletionSectionProps {
  selectedProfileLabel: string;
  cleanupType: "" | "requests" | "audits";
  setCleanupType: (type: "" | "requests" | "audits") => void;
  retentionPreset: "" | "7" | "30" | "90" | "all";
  setRetentionPreset: (preset: "" | "7" | "30" | "90" | "all") => void;
  deleting: boolean;
  handleOpenDeleteConfirm: () => void;
}

export function RetentionDeletionSection({
  selectedProfileLabel,
  cleanupType,
  setCleanupType,
  retentionPreset,
  setRetentionPreset,
  deleting,
  handleOpenDeleteConfirm,
}: RetentionDeletionSectionProps) {
  return (
    <section id="retention-deletion" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trash2 className="h-4 w-4" />
            Retention & Deletion
          </CardTitle>
          <CardDescription className="text-xs">
            Delete historical logs in {selectedProfileLabel} with explicit retention and confirmation controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Log type</Label>
              <Select
                value={cleanupType}
                onValueChange={(value) =>
                  setCleanupType(value as "requests" | "audits")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select log type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requests">Request Logs</SelectItem>
                  <SelectItem value="audits">Audit Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delete logs older than</Label>
              <Select
                value={retentionPreset}
                onValueChange={(value) =>
                  setRetentionPreset(value as "7" | "30" | "90" | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retention" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="all" className="text-destructive">
                    All logs
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={deleting || !cleanupType || !retentionPreset}
                onClick={handleOpenDeleteConfirm}
              >
                Delete logs
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This deletes data in {selectedProfileLabel} and cannot be undone.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

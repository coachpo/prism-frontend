import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import type { SettingsSaveSection } from "./types";

interface SectionSaveStateProps {
  section: SettingsSaveSection;
  isDirty: boolean;
  recentlySavedSection: SettingsSaveSection | null;
}

export function renderSectionSaveState({
  section,
  isDirty,
  recentlySavedSection,
}: SectionSaveStateProps): ReactNode {
  if (isDirty) {
    return <StatusBadge label="Unsaved changes" intent="warning" />;
  }

  if (recentlySavedSection === section) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      >
        <Check className="h-3 w-3" />
        Saved
      </Badge>
    );
  }

  return null;
}

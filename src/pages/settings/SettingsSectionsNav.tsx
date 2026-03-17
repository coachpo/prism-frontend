import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SETTINGS_SECTIONS } from "./settingsPageHelpers";

interface SettingsSectionsNavProps {
  activeSectionId: string;
  onJumpToSection: (sectionId: string) => void;
}

export function SettingsSectionsNav({
  activeSectionId,
  onJumpToSection,
}: SettingsSectionsNavProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Settings Sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {SETTINGS_SECTIONS.map((section) => (
          <Button
            key={section.id}
            type="button"
            variant={activeSectionId === section.id ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onJumpToSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchController } from "@/components/SwitchController";

interface AuthenticationStatusCardProps {
  authEnabled: boolean;
  authSaving: boolean;
  setupReady: boolean;
  statusDescription: string;
  onSaveAuthSettings: (nextEnabled?: boolean) => Promise<void>;
}

export function AuthenticationStatusCard({
  authEnabled,
  authSaving,
  setupReady,
  statusDescription,
  onSaveAuthSettings,
}: AuthenticationStatusCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Authentication status</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">
            Authentication: {authEnabled ? "On" : "Off"}
          </span>{" "}
          {statusDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SwitchController
          label="Enable authentication"
          description="Sign-in can only be enabled after the operator account and recovery email are fully configured."
          checked={authEnabled}
          disabled={authSaving || (!setupReady && !authEnabled)}
          onCheckedChange={(checked) => {
            void onSaveAuthSettings(checked);
          }}
          className="border-border bg-muted/20"
        />
      </CardContent>
    </Card>
  );
}

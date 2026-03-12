import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";

import { useAuth } from "@/context/useAuth";
import type { LoginSessionDuration } from "@/lib/types";
import { authenticateWithPasskey, isWebAuthnSupported } from "@/lib/webauthn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authEnabled, authenticated, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionDuration, setSessionDuration] = useState<LoginSessionDuration>("session");
  const [submitting, setSubmitting] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  if (!loading && !authEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!loading && authenticated) {
    const fromLocation = (location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null)?.from;
    const nextPath = fromLocation
      ? `${fromLocation.pathname ?? ""}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
      : null;
    return <Navigate to={nextPath || "/dashboard"} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const fromLocation = (location.state as {
        from?: { pathname?: string; search?: string; hash?: string };
      } | null)?.from;
      const nextPath = fromLocation
        ? `${fromLocation.pathname ?? ""}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
        : null;
      await login(username.trim(), password, sessionDuration);
      navigate(nextPath || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!isWebAuthnSupported()) {
      toast.error("Your browser does not support Passkeys. Please use a modern browser or try another login method.");
      return;
    }

    setPasskeyLoading(true);
    try {
      const fromLocation = (location.state as {
        from?: { pathname?: string; search?: string; hash?: string };
      } | null)?.from;
      const nextPath = fromLocation
        ? `${fromLocation.pathname ?? ""}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
        : null;

      // We pass the username if it's filled, otherwise undefined for discoverable credentials
      const result = await authenticateWithPasskey(username.trim() || undefined);

      if (result.success && result.authenticated) {
        // We need to trigger the auth context to refresh its state
        // Since authenticateWithPasskey sets the cookie, we just need to reload the page or trigger a refresh
        // The easiest way is to let the AuthContext handle it by reloading or navigating
        window.location.href = nextPath || "/dashboard";
      } else {
        toast.error("Passkey authentication failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Passkey authentication failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Authentication is enabled for this Prism instance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Keep me signed in for</Label>
              <Select value={sessionDuration} onValueChange={(value: LoginSessionDuration) => setSessionDuration(value)}>
                <SelectTrigger id="session-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Current browser session</SelectItem>
                  <SelectItem value="7_days">7 days</SelectItem>
                  <SelectItem value="30_days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="link" className="px-0" onClick={() => navigate("/forgot-password")}>Forgot password?</Button>
              <Button type="submit" disabled={submitting || loading || passkeyLoading}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePasskeyLogin}
            disabled={submitting || loading || passkeyLoading}
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            {passkeyLoading ? "Authenticating..." : "Sign in with Passkey"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

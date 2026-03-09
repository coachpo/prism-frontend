import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authEnabled, authenticated, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      await login(username.trim(), password);
      navigate(nextPath || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
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
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="link" className="px-0" onClick={() => navigate("/forgot-password")}>Forgot password?</Button>
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

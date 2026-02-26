import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passkeyCredentialId, setPasskeyCredentialId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await auth.loginPassword({ username_or_email: usernameOrEmail, password });
      toast.success("Logged in");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasskeyLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await auth.loginPasskey(usernameOrEmail, passkeyCredentialId);
      toast.success("Passkey login successful");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkey login failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!auth.authEnabled) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Authentication is currently disabled</CardTitle>
            <CardDescription>
              Prism V2 is running in open mode. Set up authentication before exposing this
              deployment publicly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/auth/setup">Go to auth setup</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">Continue to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Sign in to Prism V2
          </CardTitle>
          <CardDescription>
            Use password login or passkey login to access protected profile management APIs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="passkey">Passkey</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form className="space-y-4" onSubmit={handlePasswordLogin}>
                <div className="space-y-2">
                  <Label htmlFor="username_or_email">Username or email</Label>
                  <Input
                    id="username_or_email"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button className="w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="passkey">
              <form className="space-y-4" onSubmit={handlePasskeyLogin}>
                <div className="space-y-2">
                  <Label htmlFor="passkey_user">Username or email</Label>
                  <Input
                    id="passkey_user"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credential_id" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Credential ID
                  </Label>
                  <Input
                    id="credential_id"
                    placeholder="Paste registered credential ID"
                    value={passkeyCredentialId}
                    onChange={(event) => setPasskeyCredentialId(event.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    For now, Prism uses the credential ID generated during passkey registration.
                  </p>
                </div>

                <Button className="w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Verifying..." : "Sign in with passkey"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/password-reset" className="text-primary hover:underline">
              Reset password
            </Link>
            <Link to="/auth/setup" className="text-primary hover:underline">
              Auth setup
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

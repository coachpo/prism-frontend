import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export function AuthSetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@example.com");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("StrongPassword!123");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.setupRequestOtp({ email });
      setOtpChallengeId(challenge.otp_challenge_id);
      setDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setOtpCode(challenge.debug_otp_code);
      }
      toast.success("OTP challenge created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function enableAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await auth.enableAuth({
        email,
        username,
        password,
        otp_challenge_id: otpChallengeId,
        otp_code: otpCode,
      });
      toast.success("Authentication enabled");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enable auth";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (auth.authEnabled) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Authentication is already enabled</CardTitle>
            <CardDescription>
              This Prism instance is protected. Sign in to continue managing provider profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Go to login</Link>
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
            <ShieldAlert className="h-5 w-5" />
            Initial authentication setup
          </CardTitle>
          <CardDescription>
            Request an OTP and enable password/JWT security for Prism V2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={requestOtp}>
            <div className="space-y-2">
              <Label htmlFor="setup_email">Admin email</Label>
              <Input
                id="setup_email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Requesting..." : "Request setup OTP"}
            </Button>
          </form>

          <form className="space-y-4 border-t pt-4" onSubmit={enableAuth}>
            <div className="space-y-2">
              <Label htmlFor="setup_username">Username</Label>
              <Input
                id="setup_username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_password">Password</Label>
              <Input
                id="setup_password"
                type="password"
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_otp_challenge">OTP challenge ID</Label>
              <Input
                id="setup_otp_challenge"
                value={otpChallengeId}
                onChange={(event) => setOtpChallengeId(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_otp_code">OTP code</Label>
              <Input
                id="setup_otp_code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                maxLength={6}
                minLength={6}
                required
              />
              {debugOtp && (
                <p className="text-xs text-muted-foreground">
                  Debug OTP from backend: <code>{debugOtp}</code>
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Enabling..." : "Enable authentication"}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground">
            Already configured?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Go to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("StrongPassword!123");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const challenge = await api.auth.passwordResetRequestOtp({ email });
      setOtpChallengeId(challenge.otp_challenge_id);
      setDebugOtp(challenge.debug_otp_code);
      if (challenge.debug_otp_code) {
        setOtpCode(challenge.debug_otp_code);
      }
      toast.success("Reset OTP requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.auth.passwordResetConfirm({
        otp_challenge_id: otpChallengeId,
        otp_code: otpCode,
        new_password: newPassword,
      });
      toast.success("Password reset complete");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Password reset</CardTitle>
          <CardDescription>
            Request an OTP challenge and confirm a new admin password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={requestOtp}>
            <div className="space-y-2">
              <Label htmlFor="reset_email">Email</Label>
              <Input
                id="reset_email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Requesting..." : "Request reset OTP"}
            </Button>
          </form>

          <form className="space-y-4 border-t pt-4" onSubmit={confirmReset}>
            <div className="space-y-2">
              <Label htmlFor="reset_challenge">OTP challenge ID</Label>
              <Input
                id="reset_challenge"
                value={otpChallengeId}
                onChange={(event) => setOtpChallengeId(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset_code">OTP code</Label>
              <Input
                id="reset_code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                minLength={6}
                maxLength={6}
                required
              />
              {debugOtp && (
                <p className="text-xs text-muted-foreground">
                  Debug OTP from backend: <code>{debugOtp}</code>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset_password">New password</Label>
              <Input
                id="reset_password"
                type="password"
                minLength={12}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Confirm password reset"}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

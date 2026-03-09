import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.confirmPasswordReset({ otp_code: otpCode.trim(), new_password: newPassword });
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Enter reset code</CardTitle>
          <CardDescription>Use the emailed OTP and choose a new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="otp-code">Reset code</Label>
              <Input id="otp-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="link" className="px-0" onClick={() => navigate("/login")}>Back to login</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

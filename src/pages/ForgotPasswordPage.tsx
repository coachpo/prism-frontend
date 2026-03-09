import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.requestPasswordReset({ username_or_email: usernameOrEmail.trim() });
      toast.success("If the account matches, a reset code has been sent.");
      navigate("/reset-password", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request password reset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter the bound username or email to receive a reset code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username-or-email">Username or email</Label>
              <Input
                id="username-or-email"
                value={usernameOrEmail}
                onChange={(event) => setUsernameOrEmail(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="link" className="px-0" onClick={() => navigate("/login")}>Back to login</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send code"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/i18n/useLocale";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.requestPasswordReset({ username_or_email: usernameOrEmail.trim() });
      toast.success(messages.auth.accountResetCodeSent);
      navigate("/reset-password", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.auth.forgotPasswordError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{messages.auth.resetPasswordTitle}</CardTitle>
          <CardDescription>{messages.auth.forgotPasswordDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username-or-email">{messages.auth.usernameOrEmail}</Label>
              <Input
                id="username-or-email"
                value={usernameOrEmail}
                onChange={(event) => setUsernameOrEmail(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="link" className="px-0" onClick={() => navigate("/login")}>{messages.auth.backToLogin}</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? messages.auth.sending : messages.auth.sendCode}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

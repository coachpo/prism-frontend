import type { ComponentProps } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/clipboard";

type ButtonProps = ComponentProps<typeof Button>;

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
  targetLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  stopPropagation?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  targetLabel,
  successMessage,
  errorMessage,
  stopPropagation = false,
  type = "button",
  variant = "ghost",
  size = "sm",
  children,
  ...props
}: CopyButtonProps) {
  const resolvedTargetLabel = targetLabel ?? label;

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(value);
    if (!copied) {
      toast.error(errorMessage ?? `Failed to copy ${resolvedTargetLabel.toLowerCase()}`);
      return;
    }
    toast.success(successMessage ?? `${resolvedTargetLabel} copied to clipboard`);
  };

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={(event) => {
        if (stopPropagation) {
          event.stopPropagation();
        }
        void handleCopy();
      }}
      {...props}
    >
      {children ?? (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label ? <span>{label}</span> : null}
        </>
      )}
    </Button>
  );
}

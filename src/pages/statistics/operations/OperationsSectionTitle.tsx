import type { LucideIcon } from "lucide-react";

interface OperationsSectionTitleProps {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
}

export function OperationsSectionTitle({
  title,
  icon: Icon,
  iconClassName,
}: OperationsSectionTitleProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Icon className={iconClassName} />
      {title}
    </div>
  );
}

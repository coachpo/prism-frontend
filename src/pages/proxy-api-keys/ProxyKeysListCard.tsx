import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProxyApiKey } from "@/lib/types";
import { ProxyKeyCard } from "./ProxyKeyCard";

interface ProxyKeysListCardProps {
  authEnabled: boolean;
  deletingProxyKeyId: number | null;
  displayedProxyKeys: ProxyApiKey[];
  onDelete: (item: ProxyApiKey) => void;
  onEdit: (item: ProxyApiKey) => void;
  onRotate: (keyId: number) => void;
  rotatingProxyKeyId: number | null;
}

export function ProxyKeysListCard({
  authEnabled,
  deletingProxyKeyId,
  displayedProxyKeys,
  onDelete,
  onEdit,
  onRotate,
  rotatingProxyKeyId,
}: ProxyKeysListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Issued keys</CardTitle>
            <p className="text-sm text-muted-foreground">
              Edit metadata, rotate, or delete keys directly from the list below.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {displayedProxyKeys.length} key{displayedProxyKeys.length === 1 ? "" : "s"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {displayedProxyKeys.length === 0 ? (
          <EmptyState
            title="No proxy keys created yet."
            className="rounded-md border border-dashed px-3 py-6 [&>div:first-child]:hidden"
          />
        ) : (
          <div className="grid gap-2.5">
            {displayedProxyKeys.map((item) => {
              const rotating = rotatingProxyKeyId === item.id;
              const deleting = deletingProxyKeyId === item.id;

              return (
                <ProxyKeyCard
                  key={item.id}
                  item={item}
                  authEnabled={authEnabled}
                  rotating={rotating}
                  deleting={deleting}
                  onEdit={() => onEdit(item)}
                  onRotate={() => onRotate(item.id)}
                  onDelete={() => onDelete(item)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

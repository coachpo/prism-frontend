import { useEffect, useState } from "react";

import { ProviderIcon } from "@/components/ProviderIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { ProviderProfile } from "@/lib/types";
import { formatProviderType } from "@/lib/utils";

interface ProfileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  showAll?: boolean;
  allLabel?: string;
  className?: string;
  placeholder?: string;
}

export function ProfileSelect({
  value,
  onValueChange,
  showAll = true,
  allLabel = "All Profiles",
  className,
  placeholder = "Profile",
}: ProfileSelectProps) {
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);

  useEffect(() => {
    async function loadProfiles() {
      const providers = await api.providers.list();
      const profileSets = await Promise.all(
        providers.map((provider) => api.profiles.listByProvider(provider.provider_type)),
      );
      const merged = profileSets.flat();
      merged.sort((left, right) => {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }
        return left.created_at.localeCompare(right.created_at);
      });
      setProfiles(merged);
    }

    void loadProfiles();
  }, []);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">{allLabel}</SelectItem>}
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            <span className="flex items-center gap-2">
              <ProviderIcon providerType={profile.provider_type} size={14} />
              <span>{profile.name ?? profile.id}</span>
              <span className="text-muted-foreground">({formatProviderType(profile.provider_type)})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

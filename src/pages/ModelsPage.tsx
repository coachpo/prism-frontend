import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { ProviderProfile, ProviderType } from "@/lib/types";

const providerOptions: ProviderType[] = ["openai", "anthropic", "gemini"];

function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function ModelsPage() {
  const [provider, setProvider] = useState<ProviderType>("openai");
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(100);
  const [isDynamic, setIsDynamic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState("");

  async function loadProfiles(nextProvider = provider) {
    setIsLoading(true);
    try {
      const nextProfiles = await api.profiles.listByProvider(nextProvider);
      setProfiles(nextProfiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profiles";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfiles(provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.profiles.create(provider, {
        name: name || null,
        description: description || null,
        endpoint_url: endpointUrl,
        api_key: apiKey,
        priority,
        is_dynamic: isDynamic,
        is_active: isActive,
        tags: normalizeTags(tags),
      });

      setName("");
      setDescription("");
      setEndpointUrl("");
      setApiKey("");
      setPriority(100);
      setIsDynamic(false);
      setIsActive(true);
      setTags("");

      toast.success("Profile created");
      await loadProfiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      toast.error(message);
    }
  }

  async function toggleProfileActive(profile: ProviderProfile, nextIsActive: boolean) {
    try {
      await api.profiles.patch(profile.id, { is_active: nextIsActive });
      await loadProfiles();
      toast.success("Profile updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
  }

  async function deleteProfile(profileId: string) {
    const confirmed = window.confirm("Delete this profile and all model registrations?");
    if (!confirmed) {
      return;
    }
    try {
      await api.profiles.delete(profileId);
      toast.success("Profile deleted");
      await loadProfiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Provider Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Manage provider-specific profiles used by Prism V2 routing and failover.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create profile</CardTitle>
          <CardDescription>
            Add endpoint URL + key for the selected provider and assign priority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateProfile}>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as ProviderType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_name">Name</Label>
              <Input
                id="profile_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endpoint_url">Endpoint URL</Label>
              <Input
                id="endpoint_url"
                type="url"
                value={endpointUrl}
                onChange={(event) => setEndpointUrl(event.target.value)}
                placeholder="https://api.openai.com/v1"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="api_key">API key</Label>
              <Input
                id="api_key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="prod, primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Primary production endpoint"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isDynamic} onCheckedChange={setIsDynamic} id="is_dynamic" />
              <Label htmlFor="is_dynamic">Dynamic routing profile</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="is_active" />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="md:col-span-2">
              <Button className="w-full md:w-auto" type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Create profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{provider} profiles</CardTitle>
          <CardDescription>Priority order determines failover sequence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="rounded border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{profile.name ?? "Unnamed profile"}</p>
                  <p className="text-xs text-muted-foreground">{profile.endpoint_url}</p>
                  <p className="text-xs text-muted-foreground">
                    priority={profile.priority} • dynamic={String(profile.is_dynamic)}
                  </p>
                  {profile.tags.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">tags: {profile.tags.join(", ")}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded border px-2 py-1">
                    <Switch
                      checked={profile.is_active}
                      onCheckedChange={(next) => void toggleProfileActive(profile, next)}
                      id={`active-${profile.id}`}
                    />
                    <Label htmlFor={`active-${profile.id}`} className="text-xs">
                      Active
                    </Label>
                  </div>

                  <Button asChild size="sm" variant="outline">
                    <Link to={`/profiles/${profile.id}`}>Open</Link>
                  </Button>

                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => void deleteProfile(profile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete profile</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!profiles.length && !isLoading && (
            <p className="text-sm text-muted-foreground">No profiles for {provider} yet.</p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading profiles...</p>}
        </CardContent>
      </Card>
    </div>
  );
}

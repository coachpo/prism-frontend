import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type {
  MissingSpecialTokenPricePolicy,
  ProfileModel,
  ProfileModelPricingUpsertRequest,
  ProviderProfile,
} from "@/lib/types";

function parseModelList(raw: string) {
  return raw
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function parseOptionalMicros(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [models, setModels] = useState<ProfileModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEndpointUrl, setEditEndpointUrl] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [editPriority, setEditPriority] = useState(100);
  const [editTags, setEditTags] = useState("");
  const [editMetadataJson, setEditMetadataJson] = useState("{}");
  const [editIsDynamic, setEditIsDynamic] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  const [newModelsCsv, setNewModelsCsv] = useState("");

  const [pricingModelId, setPricingModelId] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [inputMicros, setInputMicros] = useState("");
  const [outputMicros, setOutputMicros] = useState("");
  const [cacheReadMicros, setCacheReadMicros] = useState("");
  const [cacheWriteMicros, setCacheWriteMicros] = useState("");
  const [reasoningMicros, setReasoningMicros] = useState("");
  const [policy, setPolicy] = useState<MissingSpecialTokenPricePolicy>("MAP_TO_OUTPUT");
  const [sourceReference, setSourceReference] = useState("");

  const orderedModels = useMemo(
    () => [...models].sort((a, b) => a.model_id.localeCompare(b.model_id)),
    [models],
  );

  async function loadProfile() {
    if (!id) {
      setError("Missing profile id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [nextProfile, nextModels] = await Promise.all([
        api.profiles.findById(id),
        api.profiles.listModels(id),
      ]);
      if (!nextProfile) {
        throw new Error("Profile not found");
      }

      setProfile(nextProfile);
      setModels(nextModels);

      setEditName(nextProfile.name ?? "");
      setEditDescription(nextProfile.description ?? "");
      setEditEndpointUrl(nextProfile.endpoint_url);
      setEditPriority(nextProfile.priority);
      setEditTags(nextProfile.tags.join(", "));
      setEditMetadataJson(JSON.stringify(nextProfile.metadata ?? {}, null, 2));
      setEditIsDynamic(nextProfile.is_dynamic);
      setEditIsActive(nextProfile.is_active);
      setPricingModelId(nextModels[0]?.model_id ?? "");
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }
    try {
      const metadata = editMetadataJson.trim() ? JSON.parse(editMetadataJson) : null;
      await api.profiles.patch(profile.id, {
        name: editName || null,
        description: editDescription || null,
        endpoint_url: editEndpointUrl,
        api_key: editApiKey.trim() || undefined,
        priority: editPriority,
        tags: editTags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        metadata,
        is_dynamic: editIsDynamic,
        is_active: editIsActive,
      });
      setEditApiKey("");
      toast.success("Profile saved");
      await loadProfile();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to save profile";
      toast.error(message);
    }
  }

  async function addModels(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }
    const parsed = parseModelList(newModelsCsv);
    if (!parsed.length) {
      toast.error("Enter at least one model ID");
      return;
    }

    try {
      await api.profiles.upsertModels(profile.id, { models: parsed });
      setNewModelsCsv("");
      toast.success("Model registrations updated");
      await loadProfile();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to upsert models";
      toast.error(message);
    }
  }

  async function removeModel(modelId: string) {
    if (!profile) {
      return;
    }
    try {
      await api.profiles.deleteModel(profile.id, modelId);
      toast.success("Model removed");
      await loadProfile();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to remove model";
      toast.error(message);
    }
  }

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !pricingModelId) {
      toast.error("Choose a model before saving pricing");
      return;
    }

    const body: ProfileModelPricingUpsertRequest = {
      currency_code: currencyCode.toUpperCase(),
      price_input_micros: parseOptionalMicros(inputMicros),
      price_output_micros: parseOptionalMicros(outputMicros),
      price_cache_read_micros: parseOptionalMicros(cacheReadMicros),
      price_cache_write_micros: parseOptionalMicros(cacheWriteMicros),
      price_reasoning_micros: parseOptionalMicros(reasoningMicros),
      missing_special_token_price_policy: policy,
      source_reference: sourceReference.trim() || null,
    };

    try {
      await api.profiles.upsertPricing(profile.id, pricingModelId, body);
      toast.success("Pricing saved");
      await loadProfile();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to save pricing";
      toast.error(message);
    }
  }

  async function deletePricing() {
    if (!profile || !pricingModelId) {
      return;
    }
    try {
      await api.profiles.deletePricing(profile.id, pricingModelId);
      toast.success("Pricing removed");
      await loadProfile();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to delete pricing";
      toast.error(message);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-destructive">{error ?? "Profile not found"}</p>
          <Button asChild variant="outline">
            <Link to="/profiles">Back to profiles</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.name ?? "Profile detail"}</h1>
          <p className="text-sm text-muted-foreground">
            Provider: {profile.provider_type} • Profile ID: {profile.id}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/profiles">Back to profiles</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>Update endpoint, key, priority, tags, and metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="edit_name">Name</Label>
              <Input id="edit_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_priority">Priority</Label>
              <Input
                id="edit_priority"
                type="number"
                value={editPriority}
                onChange={(e) => setEditPriority(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_description">Description</Label>
              <Input
                id="edit_description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_endpoint">Endpoint URL</Label>
              <Input
                id="edit_endpoint"
                type="url"
                value={editEndpointUrl}
                onChange={(e) => setEditEndpointUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_api_key">Rotate API key (optional)</Label>
              <Input
                id="edit_api_key"
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                placeholder="Leave empty to keep current key"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_tags">Tags</Label>
              <Input
                id="edit_tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="prod, primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_metadata">Metadata JSON</Label>
              <textarea
                id="edit_metadata"
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editMetadataJson}
                onChange={(e) => setEditMetadataJson(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="edit_dynamic" checked={editIsDynamic} onCheckedChange={setEditIsDynamic} />
              <Label htmlFor="edit_dynamic">Dynamic routing</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="edit_active" checked={editIsActive} onCheckedChange={setEditIsActive} />
              <Label htmlFor="edit_active">Active</Label>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Save profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered models</CardTitle>
          <CardDescription>Add one or many model IDs for this profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addModels}>
            <Input
              value={newModelsCsv}
              onChange={(e) => setNewModelsCsv(e.target.value)}
              placeholder="gpt-5.2, gpt-5.3-codex"
            />
            <Button type="submit">Upsert model IDs</Button>
          </form>

          <div className="space-y-2">
            {orderedModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{model.model_id}</p>
                  <p className="text-xs text-muted-foreground">
                    active={String(model.is_active)} • pricing={model.pricing ? "configured" : "none"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => void removeModel(model.model_id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete model registration</span>
                </Button>
              </div>
            ))}
            {!orderedModels.length && (
              <p className="text-sm text-muted-foreground">No models registered.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Upsert per-model pricing used for request cost computation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={savePricing}>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={pricingModelId} onValueChange={setPricingModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {orderedModels.map((model) => (
                    <SelectItem key={model.id} value={model.model_id}>
                      {model.model_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency_code">Currency</Label>
              <Input
                id="currency_code"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_input">Input micros</Label>
              <Input id="price_input" value={inputMicros} onChange={(e) => setInputMicros(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_output">Output micros</Label>
              <Input
                id="price_output"
                value={outputMicros}
                onChange={(e) => setOutputMicros(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_cache_read">Cache read micros</Label>
              <Input
                id="price_cache_read"
                value={cacheReadMicros}
                onChange={(e) => setCacheReadMicros(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_cache_write">Cache write micros</Label>
              <Input
                id="price_cache_write"
                value={cacheWriteMicros}
                onChange={(e) => setCacheWriteMicros(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_reasoning">Reasoning micros</Label>
              <Input
                id="price_reasoning"
                value={reasoningMicros}
                onChange={(e) => setReasoningMicros(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Missing special token policy</Label>
              <Select
                value={policy}
                onValueChange={(value) => setPolicy(value as MissingSpecialTokenPricePolicy)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAP_TO_OUTPUT">MAP_TO_OUTPUT</SelectItem>
                  <SelectItem value="ZERO_COST">ZERO_COST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="source_reference">Source reference</Label>
              <Input
                id="source_reference"
                type="url"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="https://provider-docs.example/pricing"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit">Save pricing</Button>
              <Button type="button" variant="outline" onClick={() => void deletePricing()}>
                Delete pricing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

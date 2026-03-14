import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ModelConfig, ModelConfigListItem, ModelConfigUpdate } from "@/lib/types";
import { buildRedirectTargetOptions } from "./useModelDetailDataSupport";

interface UseModelDetailModelFormInput {
  model: ModelConfig | null;
  allModels: ModelConfigListItem[];
  isEditModelDialogOpen: boolean;
  editRedirectTo: string;
  setEditRedirectTo: (value: string) => void;
  setIsEditModelDialogOpen: (open: boolean) => void;
  fetchModel: () => Promise<void>;
}

export function useModelDetailModelForm({
  model,
  allModels,
  isEditModelDialogOpen,
  editRedirectTo,
  setEditRedirectTo,
  setIsEditModelDialogOpen,
  fetchModel,
}: UseModelDetailModelFormInput) {
  useEffect(() => {
    if (!isEditModelDialogOpen || !model || model.model_type !== "proxy") {
      return;
    }

    setEditRedirectTo(model.redirect_to || "");
  }, [isEditModelDialogOpen, model, setEditRedirectTo]);

  const redirectTargetOptions = useMemo(
    () => buildRedirectTargetOptions(model, allModels),
    [allModels, model],
  );

  const handleEditModelSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!model) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const updateData: ModelConfigUpdate = {
        display_name: (formData.get("display_name") as string) || null,
        model_id: formData.get("model_id") as string,
        redirect_to: model.model_type === "proxy" ? editRedirectTo || null : null,
      };

      try {
        await api.models.update(model.id, updateData);
        toast.success("Model updated");
        setIsEditModelDialogOpen(false);
        void fetchModel();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update model");
      }
    },
    [editRedirectTo, fetchModel, model, setIsEditModelDialogOpen],
  );

  return {
    redirectTargetOptions,
    handleEditModelSubmit,
  };
}

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clearSharedReferenceData } from "@/lib/referenceData";
import type { ModelConfig, ModelConfigListItem, ModelConfigUpdate } from "@/lib/types";
import {
  buildRedirectTargetOptions,
  patchModelListItemFromDetail,
} from "./useModelDetailDataSupport";

interface UseModelDetailModelFormInput {
  model: ModelConfig | null;
  allModels: ModelConfigListItem[];
  isEditModelDialogOpen: boolean;
  revision: number;
  editRedirectTo: string;
  setEditRedirectTo: (value: string) => void;
  setIsEditModelDialogOpen: (open: boolean) => void;
  setAllModels: React.Dispatch<React.SetStateAction<ModelConfigListItem[]>>;
  setModel: React.Dispatch<React.SetStateAction<ModelConfig | null>>;
}

export function useModelDetailModelForm({
  model,
  allModels,
  isEditModelDialogOpen,
  revision,
  editRedirectTo,
  setEditRedirectTo,
  setIsEditModelDialogOpen,
  setAllModels,
  setModel,
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
        const updatedModel = await api.models.update(model.id, updateData);
        clearSharedReferenceData(undefined, revision);
        setModel(updatedModel);
        setAllModels((currentModels) => patchModelListItemFromDetail(currentModels, updatedModel));
        setEditRedirectTo(updatedModel.redirect_to || "");
        toast.success("Model updated");
        setIsEditModelDialogOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update model");
      }
    },
    [editRedirectTo, model, revision, setAllModels, setEditRedirectTo, setIsEditModelDialogOpen, setModel],
  );

  return {
    redirectTargetOptions,
    handleEditModelSubmit,
  };
}

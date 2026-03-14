import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";
import { parseConflictMessage } from "./profileConflictMessageParser";

interface UseProfileDialogStateInput {
  activateProfile: (id: number) => Promise<Profile>;
  canCreateProfile: boolean;
  closeProfileSwitcher: () => void;
  createProfile: (data: { name: string; description: string | null }) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  hasMismatch: boolean;
  selectProfile: (profileId: number) => void;
  selectedIsActive: boolean;
  selectedIsDefault: boolean;
  selectedProfile: Profile | null;
  updateProfile: (id: number, data: { name: string; description: string | null }) => Promise<Profile>;
}

export function useProfileDialogState({
  activateProfile,
  canCreateProfile,
  closeProfileSwitcher,
  createProfile,
  deleteProfile,
  hasMismatch,
  selectProfile,
  selectedIsActive,
  selectedIsDefault,
  selectedProfile,
  updateProfile,
}: UseProfileDialogStateInput) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteConfirmTarget = useMemo(
    () => `delete ${selectedProfile?.name ?? ""}`.trim().toLowerCase(),
    [selectedProfile?.name]
  );
  const isDeleteConfirmMatch = deleteConfirmInput.trim().toLowerCase() === deleteConfirmTarget;

  useEffect(() => {
    if (!editOpen || !selectedProfile) return;
    setNameInput(selectedProfile.name);
    setDescriptionInput(selectedProfile.description ?? "");
  }, [editOpen, selectedProfile]);

  useEffect(() => {
    if (activateOpen && !hasMismatch) {
      setActivateOpen(false);
    }
  }, [activateOpen, hasMismatch]);

  const resetFormFields = () => {
    setNameInput("");
    setDescriptionInput("");
  };

  const openCreateDialog = () => {
    resetFormFields();
    closeProfileSwitcher();
    setCreateOpen(true);
  };

  const openEditDialog = () => {
    if (!selectedProfile) return;
    closeProfileSwitcher();
    setEditOpen(true);
  };

  const openDeleteDialog = () => {
    if (!selectedProfile || selectedIsActive || selectedIsDefault) return;
    closeProfileSwitcher();
    setDeleteConfirmInput("");
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const openActivateDialog = () => {
    if (!hasMismatch) return;
    closeProfileSwitcher();
    setActivateOpen(true);
  };

  const handleCreateProfile = async () => {
    const name = nameInput.trim();
    if (!name) {
      toast.error("Profile name is required");
      return;
    }
    if (!canCreateProfile) {
      toast.error("Maximum 10 profiles reached. Delete a profile to create a new one.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createProfile({
        name,
        description: descriptionInput.trim() || null,
      });
      selectProfile(created.id);
      toast.success(`Created profile ${created.name}`);
      setCreateOpen(false);
      resetFormFields();
    } catch (error) {
      const conflictMessage = parseConflictMessage(error);
      if (conflictMessage) {
        toast.error(conflictMessage);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfile = async () => {
    if (!selectedProfile) return;

    const name = nameInput.trim();
    if (!name) {
      toast.error("Profile name is required");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(selectedProfile.id, {
        name,
        description: descriptionInput.trim() || null,
      });
      toast.success("Profile updated");
      setEditOpen(false);
      resetFormFields();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateProfile = async () => {
    if (!selectedProfile || selectedIsActive) return;

    setIsActivating(true);
    try {
      await activateProfile(selectedProfile.id);
      toast.success(`Activated ${selectedProfile.name} for runtime traffic`);
      setActivateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to activate profile";
      if (message.includes("409") || message.toLowerCase().includes("conflict")) {
        toast.error(
          "Activation conflict detected. Active profile changed elsewhere, profile state was refreshed."
        );
      } else {
        toast.error(message);
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile || !isDeleteConfirmMatch) return;

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProfile(selectedProfile.id);
      toast.success(`Deleted profile ${selectedProfile.name}`);
      setDeleteOpen(false);
      setDeleteConfirmInput("");
      setDeleteError(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete profile");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    activateOpen,
    createOpen,
    deleteConfirmInput,
    deleteConfirmTarget,
    deleteError,
    deleteOpen,
    descriptionInput,
    editOpen,
    handleActivateProfile,
    handleCreateProfile,
    handleDeleteProfile,
    handleEditProfile,
    isActivating,
    isDeleteConfirmMatch,
    isDeleting,
    isSaving,
    nameInput,
    openActivateDialog,
    openCreateDialog,
    openDeleteDialog,
    openEditDialog,
    setActivateOpen,
    setCreateOpen,
    setDeleteConfirmInput,
    setDeleteError,
    setDeleteOpen,
    setDescriptionInput,
    setEditOpen,
    setNameInput,
  };
}

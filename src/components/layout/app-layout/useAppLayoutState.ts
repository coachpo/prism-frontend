import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { MAX_PROFILES, PROFILE_SCOPED_PREFIXES } from "./navigationProfileConfig";
import { useProfileDialogState } from "./useProfileDialogState";
import { useProfileSwitcherState } from "./useProfileSwitcherState";

export function useAppLayoutState() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authEnabled, username, logout } = useAuth();
  const { messages } = useLocale();
  const {
    profiles,
    activeProfile,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    createProfile,
    updateProfile,
    activateProfile,
    deleteProfile,
  } = useProfileContext();

  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const canCreateProfile = profiles.length < MAX_PROFILES;
  const selectedIsActive =
    selectedProfile !== null && activeProfile !== null && selectedProfile.id === activeProfile.id;
  const hasMismatch = selectedProfile !== null && activeProfile !== null && !selectedIsActive;
  const selectedIsDefault = selectedProfile?.is_default ?? false;
  const selectedIsEditable = selectedProfile?.is_editable ?? true;
  const selectedProfileName = selectedProfile?.name ?? messages.common.unavailable;
  const activeProfileName = activeProfile?.name ?? messages.common.unavailable;
  const deleteDisabledReason = selectedIsDefault
    ? messages.profiles.defaultProfileDeleteDisabled
    : selectedIsActive
      ? messages.profiles.activeProfileDeleteDisabled
      : !selectedProfile
        ? messages.profiles.selectProfileToDelete
        : null;

  const editDisabledReason = !selectedProfile
    ? messages.profiles.selectProfileToEdit
    : !selectedIsEditable
      ? messages.profiles.lockedProfileEditDisabled
      : null;

  const isProfileScopedPage = useMemo(
    () =>
      PROFILE_SCOPED_PREFIXES.some(
        (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
      ),
    [location.pathname]
  );

  const switcherState = useProfileSwitcherState({
    profiles,
    selectedProfileId,
    selectProfile,
  });

  const dialogState = useProfileDialogState({
    activateProfile,
    canCreateProfile,
    closeProfileSwitcher: switcherState.closeProfileSwitcher,
    createProfile,
    deleteProfile,
    hasMismatch,
    selectProfile,
    selectedIsActive,
    selectedIsDefault,
    selectedProfile,
    updateProfile,
  });

  const setSidebarOpen = (open: boolean) => {
    if (open) {
      switcherState.closeProfileSwitcher();
    }
    setSidebarOpenState(open);
  };

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed((current) => !current);
  };

  const handleManageProfiles = () => {
    switcherState.closeProfileSwitcher();
    navigate("/settings");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.shell.logoutFailed);
    }
  };

  return {
    activeProfileName,
    authEnabled,
    canCreateProfile,
    desktopSidebarCollapsed,
    deleteDisabledReason,
    editDisabledReason,
    handleLogout,
    handleManageProfiles,
    hasMismatch,
    isProfileScopedPage,
    selectedIsActive,
    selectedProfile,
    selectedProfileId,
    selectedProfileName,
    setSidebarOpen,
    sidebarOpen,
    toggleDesktopSidebar,
    username,
    ...switcherState,
    ...dialogState,
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import {
  Menu,
  X,
  Zap,
  AlertTriangle,
  Loader2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileContext } from "@/context/ProfileContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS, PROFILE_SCOPED_PREFIXES, MAX_PROFILES, VERSION_LABEL } from "./app-layout/navigationProfileConfig";
import { parseConflictMessage } from "./app-layout/profileConflictMessageParser";
import { ProfileSwitcherPopover } from "./app-layout/ProfileSwitcherPopover";
import { ProfileDialogs } from "./app-layout/ProfileDialogs";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authEnabled, username, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [profileSwitcherOpen, setProfileSwitcherOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [profileQuery, setProfileQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedProfileButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileSearchInputRef = useRef<HTMLInputElement | null>(null);

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

  const canCreateProfile = profiles.length < MAX_PROFILES;
  const hasProfiles = profiles.length > 0;
  const selectedIsActive =
    selectedProfile !== null && activeProfile !== null && selectedProfile.id === activeProfile.id;
  const hasMismatch = selectedProfile !== null && activeProfile !== null && !selectedIsActive;
  const selectedIsDefault = selectedProfile?.is_default ?? false;
  const selectedIsEditable = selectedProfile?.is_editable ?? true;
  const selectedProfileName = selectedProfile?.name ?? "Unavailable";
  const activeProfileName = activeProfile?.name ?? "Unavailable";
  const deleteDisabledReason = selectedIsDefault
    ? "Default profile cannot be deleted."
    : selectedIsActive
      ? "Active runtime profile cannot be deleted."
      : !selectedProfile
        ? "Select a profile to delete."
        : null;

  const editDisabledReason = !selectedProfile
    ? "Select a profile to edit."
    : !selectedIsEditable
      ? "Default profile is locked and cannot be edited."
      : null;
  const deleteConfirmTarget = useMemo(
    () => `delete ${selectedProfile?.name ?? ""}`.trim().toLowerCase(),
    [selectedProfile?.name]
  );
  const isDeleteConfirmMatch = deleteConfirmInput.trim().toLowerCase() === deleteConfirmTarget;

  const isProfileScopedPage = useMemo(
    () =>
      PROFILE_SCOPED_PREFIXES.some(
        (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
      ),
    [location.pathname]
  );

  const filteredProfiles = useMemo(() => {
    const query = profileQuery.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) => {
      const nameMatch = profile.name.toLowerCase().includes(query);
      const descriptionMatch = (profile.description ?? "").toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    });
  }, [profileQuery, profiles]);
  const hasNoProfiles = !hasProfiles;
  const hasNoMatches = hasProfiles && filteredProfiles.length === 0;

  useEffect(() => {
    if (!editOpen || !selectedProfile) return;
    setNameInput(selectedProfile.name);
    setDescriptionInput(selectedProfile.description ?? "");
  }, [editOpen, selectedProfile]);

  useEffect(() => {
    if (!profileSwitcherOpen) {
      setProfileQuery("");
    }
  }, [profileSwitcherOpen]);

  useEffect(() => {
    if (!activateOpen) return;
    if (!hasMismatch) {
      setActivateOpen(false);
    }
  }, [activateOpen, hasMismatch]);

  useEffect(() => {
    if (!profileSwitcherOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      const selectedButton = selectedProfileButtonRef.current;
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: "nearest" });
        selectedButton.focus({ preventScroll: true });
        return;
      }
      profileSearchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [profileSwitcherOpen, selectedProfileId]);

  const resetFormFields = () => {
    setNameInput("");
    setDescriptionInput("");
  };

  const applySelectedProfile = (profileId: number) => {
    selectProfile(profileId);
    setProfileSwitcherOpen(false);
  };

  const openCreateDialog = () => {
    resetFormFields();
    setProfileSwitcherOpen(false);
    setCreateOpen(true);
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
      applySelectedProfile(created.id);
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
    if (!selectedProfile) return;
    if (selectedIsActive) return;

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
    if (!selectedProfile) return;
    if (!isDeleteConfirmMatch) return;
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

  const handleManageProfiles = () => {
    setProfileSwitcherOpen(false);
    navigate("/settings");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out");
    }
  };

  const handleSelectProfile = (profileId: number) => {
    if (selectedProfileId === profileId) {
      setProfileSwitcherOpen(false);
      return;
    }
    applySelectedProfile(profileId);
  };

  const openEditDialog = () => {
    if (!selectedProfile) return;
    setProfileSwitcherOpen(false);
    setEditOpen(true);
  };

  const openDeleteDialog = () => {
    if (!selectedProfile || selectedIsActive || selectedIsDefault) return;
    setProfileSwitcherOpen(false);
    setDeleteConfirmInput("");
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const openActivateDialog = () => {
    if (!hasMismatch) return;
    setProfileSwitcherOpen(false);
    setActivateOpen(true);
  };

  return (
    <>
      <div className="flex h-screen w-full bg-background text-foreground">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-full w-[min(88vw,320px)] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:w-[320px]",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70">
              <Zap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Prism</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </button>
          </div>

          <div className="border-b border-sidebar-border px-3 py-3">
            <div className="rounded-lg border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
                  Profile runtime
                </p>
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    hasMismatch
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200"
                      : selectedProfile && activeProfile
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                        : "border-sidebar-border/80 bg-sidebar-accent/50 text-sidebar-foreground/65"
                  )}
                >
                  {hasMismatch ? "Mismatch" : selectedProfile && activeProfile ? "Aligned" : "Unavailable"}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-sidebar-foreground/60">Viewing</dt>
                <dd className="truncate font-medium text-sidebar-foreground/95">{selectedProfileName}</dd>
                <dt className="text-sidebar-foreground/60">Runtime</dt>
                <dd className="truncate font-medium text-sidebar-foreground/95">{activeProfileName}</dd>
              </dl>
            </div>
            </div>

          <nav className="flex-1 space-y-0.5 px-2 py-3">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-sidebar-border px-3 py-2.5">
            <span className="text-[11px] font-medium text-sidebar-foreground/35">{VERSION_LABEL}</span>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:ml-[320px]">
          <header className="shell-header sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open sidebar</span>
                </button>
                {isProfileScopedPage && hasMismatch ? (
                  <Badge
                    variant="secondary"
                    className="hidden h-6 max-w-[220px] items-center px-2 text-[11px] font-normal text-muted-foreground sm:inline-flex"
                    title={`Active runtime: ${activeProfileName}`}
                  >
                    <span className="truncate">Active runtime: {activeProfileName}</span>
                  </Badge>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {hasMismatch ? (
                  <div className="max-w-[300px] rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-800 dark:text-amber-200">
                    <p className="inline-flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        You&apos;re viewing <strong>{selectedProfileName}</strong>, but runtime traffic is
                        served by <strong>{activeProfileName}</strong>.
                      </span>
                    </p>
                  </div>
                ) : null}

                <ProfileSwitcherPopover
                  open={profileSwitcherOpen}
                  onOpenChange={setProfileSwitcherOpen}
                  isActivating={isActivating}
                  selectedProfileName={selectedProfileName}
                  activeProfileName={activeProfileName}
                  hasNoProfiles={hasNoProfiles}
                  selectedIsActive={selectedIsActive}
                  profileQuery={profileQuery}
                  setProfileQuery={setProfileQuery}
                  selectedProfileId={selectedProfileId}
                  filteredProfiles={filteredProfiles}
                  hasNoMatches={hasNoMatches}
                  canCreateProfile={canCreateProfile}
                  editDisabledReason={editDisabledReason}
                  deleteDisabledReason={deleteDisabledReason}
                  selectedProfileButtonRef={selectedProfileButtonRef}
                  profileSearchInputRef={profileSearchInputRef}
                  onSelectProfile={handleSelectProfile}
                  onOpenEditDialog={openEditDialog}
                  onOpenDeleteDialog={openDeleteDialog}
                  onOpenCreateDialog={openCreateDialog}
                  onManageProfiles={handleManageProfiles}
                />

                {hasMismatch ? (
                  <Button className="h-9 px-3" onClick={openActivateDialog} disabled={isActivating}>
                    {isActivating ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">Activate</span>
                        <span className="hidden sm:inline">Activate profile</span>
                      </>
                    )}
                  </Button>
                ) : null}
                {authEnabled ? (
                  <Button variant="outline" className="h-9 px-3" onClick={() => void handleLogout()}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{username || "Sign out"}</span>
                    <span className="sm:hidden">Out</span>
                  </Button>
                ) : null}
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="shell-page mx-auto max-w-screen-xl">
              <Outlet />
            </div>
          </main>
      </div>
      </div>

      <ProfileDialogs
        activateOpen={activateOpen}
        setActivateOpen={setActivateOpen}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        selectedProfileName={selectedProfile?.name ?? "profile"}
        activeProfileName={activeProfileName}
        hasMismatch={hasMismatch}
        isActivating={isActivating}
        onActivate={handleActivateProfile}
        nameInput={nameInput}
        setNameInput={setNameInput}
        descriptionInput={descriptionInput}
        setDescriptionInput={setDescriptionInput}
        isSaving={isSaving}
        canCreateProfile={canCreateProfile}
        hasSelectedProfile={Boolean(selectedProfile)}
        onCreate={handleCreateProfile}
        onEdit={handleEditProfile}
        deleteError={deleteError}
        deleteConfirmTarget={deleteConfirmTarget}
        deleteConfirmInput={deleteConfirmInput}
        setDeleteConfirmInput={setDeleteConfirmInput}
        isDeleteConfirmMatch={isDeleteConfirmMatch}
        isDeleting={isDeleting}
        onDelete={handleDeleteProfile}
        clearDeleteError={() => setDeleteError(null)}
      />
    </>
  );
}

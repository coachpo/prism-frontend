import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProfileContext } from "@/context/ProfileContext";
import {
  LayoutDashboard,
  Server,
  BarChart3,
  FileSearch,
  Settings,
  Menu,
  X,
  Zap,
  Plug,
  Logs,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/models", icon: Server, label: "Models" },
  { to: "/endpoints", icon: Plug, label: "Endpoints" },
  { to: "/statistics", icon: BarChart3, label: "Statistics" },
  { to: "/request-logs", icon: Logs, label: "Request Logs" },
  { to: "/audit", icon: FileSearch, label: "Audit" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const PROFILE_SCOPED_PREFIXES = ["/models", "/endpoints", "/statistics", "/request-logs", "/audit"];
const MAX_PROFILES = 10;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

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
  const selectedProfileName = selectedProfile?.name ?? (hasProfiles ? "Select profile" : "No profiles");
  const activeProfileName = activeProfile?.name ?? "none";
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

  const parseConflictMessage = (error: unknown): string | null => {
    if (!(error instanceof Error)) return null;
    if (error.message.includes("Maximum 10 profiles reached")) {
      return "Maximum 10 profiles reached. Delete a profile to create a new one.";
    }
    if (error.message.includes("409") || error.message.toLowerCase().includes("conflict")) {
      return error.message;
    }
    return null;
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
                <dd className="truncate font-medium text-sidebar-foreground/95">
                  {selectedProfileName}
                </dd>
                <dt className="text-sidebar-foreground/60">Runtime</dt>
                <dd className="truncate font-medium text-sidebar-foreground/95">
                  {activeProfileName}
                </dd>
              </dl>
            </div>
            </div>

          <nav className="flex-1 space-y-0.5 px-2 py-3">
            {navLinks.map(({ to, icon: Icon, label }) => (
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
            <span className="text-[11px] font-medium text-sidebar-foreground/35">v1.0</span>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:ml-[320px]">
          <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
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
                <Popover
                  open={profileSwitcherOpen}
                  onOpenChange={setProfileSwitcherOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-[min(76vw,320px)] justify-between gap-2 px-2.5 sm:w-[320px]"
                      disabled={isActivating}
                      role="combobox"
                      aria-expanded={profileSwitcherOpen}
                      title={`Selected profile: ${selectedProfileName}. Active runtime: ${activeProfileName}.`}
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate text-sm">
                        {hasNoProfiles ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500/80" />
                        ) : null}
                        <span className="text-muted-foreground">Profile:</span>
                        <span className="truncate font-medium">{selectedProfileName}</span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        {selectedIsActive ? (
                          <Badge className="h-5 px-1.5 text-[10px]">Active</Badge>
                        ) : null}
                        <ChevronsUpDown className="h-4 w-4 opacity-60" />
                      </span>
                    </Button>
                  </PopoverTrigger>

                    <PopoverContent
                      align="end"
                      collisionPadding={8}
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      className="z-[60] flex h-[min(82vh,34rem)] w-[var(--radix-popover-trigger-width)] max-w-[94vw] flex-col overflow-hidden p-0"
                    >
                    <div className="shrink-0 border-b px-3 py-3">
                      <p className="text-sm font-semibold">Select profile</p>
                      <Input
                        ref={profileSearchInputRef}
                        className="mt-2"
                        value={profileQuery}
                        onChange={(event) => setProfileQuery(event.target.value)}
                        placeholder="Search profiles..."
                      />
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        Active: {activeProfileName}
                      </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                      {hasNoProfiles ? (
                        <div className="flex h-full items-center justify-center p-1">
                          <div className="w-full rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center">
                            <p className="text-sm font-medium">No profiles yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Create a profile to start routing traffic or running tests.
                            </p>
                            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={openCreateDialog}
                                disabled={!canCreateProfile}
                              >
                                Create new profile
                              </Button>
                              <Button
                                size="sm"
                                variant="link"
                                className="h-8 px-2 text-xs"
                                onClick={handleManageProfiles}
                              >
                                Learn more
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : hasNoMatches ? (
                        <div className="flex h-full items-center justify-center p-1">
                          <div className="w-full rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center">
                            <p className="text-sm font-medium">No matches</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Try a different search term.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 h-8"
                              onClick={() => setProfileQuery("")}
                            >
                              Clear search
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredProfiles.map((profile) => {
                            const isSelected = selectedProfileId === profile.id;
                            const isActive = activeProfile?.id === profile.id;

                            return (
                              <button
                                key={profile.id}
                                type="button"
                                ref={isSelected ? selectedProfileButtonRef : null}
                                onClick={() => handleSelectProfile(profile.id)}
                                className={cn(
                                  "relative flex w-full items-start gap-3 rounded-md border border-transparent pl-3 pr-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                                  isSelected ? "bg-accent/80" : "hover:bg-accent/55"
                                )}
                              >
                                {isSelected ? (
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary"
                                  />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{profile.name}</p>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {profile.description?.trim() || "No description"}
                                  </p>
                                </div>
                                <div className="ml-2 flex min-w-[132px] shrink-0 items-center justify-end gap-2">
                                  {isActive ? (
                                    <Badge
                                      variant="outline"
                                      className="h-5 shrink-0 border-emerald-500/40 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-200"
                                    >
                                      Active
                                    </Badge>
                                  ) : null}
                                  {profile.is_default ? (
                                    <Badge
                                      variant="outline"
                                      className="h-5 shrink-0 border-sky-500/40 bg-sky-500/10 px-1.5 text-[10px] text-sky-700 dark:text-sky-200"
                                    >
                                      Default
                                    </Badge>
                                  ) : null}
                                  {!profile.is_editable ? (
                                    <Badge
                                      variant="outline"
                                      className="h-5 shrink-0 border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] text-amber-700 dark:text-amber-200"
                                    >
                                      Locked
                                    </Badge>
                                  ) : null}
                                  <Check
                                    className={cn(
                                      "h-4 w-4 shrink-0 text-primary transition-opacity",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 border-t">
                      <div className="space-y-2 px-3 py-3">
                        {hasProfiles ? (
                          <>
                            <Button
                              variant="secondary"
                              className="h-8 w-full justify-start"
                              onClick={openEditDialog}
                              disabled={Boolean(editDisabledReason)}
                              title={editDisabledReason ?? undefined}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit selected
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-full justify-start text-destructive/75 hover:text-destructive"
                              onClick={openDeleteDialog}
                              disabled={Boolean(deleteDisabledReason)}
                              title={deleteDisabledReason ?? undefined}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete selected
                            </Button>
                            <div className="my-1 border-t" />
                          </>
                        ) : null}

                        <Button
                          variant="ghost"
                          className="h-8 w-full justify-start"
                          onClick={handleManageProfiles}
                        >
                          Manage profiles
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-full justify-start"
                          onClick={openCreateDialog}
                          disabled={!canCreateProfile}
                        >
                          Create new profile
                        </Button>

                        {!canCreateProfile ? (
                          <p className="px-1 text-xs text-amber-700 dark:text-amber-200">
                            You&apos;ve reached the limit (10). Delete an inactive profile to create a new one.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    </PopoverContent>
                </Popover>

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

                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate &quot;{selectedProfile?.name ?? "profile"}&quot; for runtime traffic?</DialogTitle>
            <DialogDescription>
              This will switch the active runtime profile. Existing traffic will route using the newly
              active profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <p>
              Current active: <strong>{activeProfileName}</strong>
            </p>
            <p>
              New active: <strong>{selectedProfileName}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActivateProfile} disabled={isActivating || !hasMismatch}>
              {isActivating ? "Activating..." : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Profile</DialogTitle>
            <DialogDescription>
              Create a new management scope profile. Runtime traffic is unaffected until activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="profile-create-name">Name</Label>
              <Input
                id="profile-create-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-create-description">Description (Optional)</Label>
              <Input
                id="profile-create-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={isSaving || !canCreateProfile}>
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update selected profile metadata. This does not activate runtime traffic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="profile-edit-name">Name</Label>
              <Input
                id="profile-edit-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-edit-description">Description (Optional)</Label>
              <Input
                id="profile-edit-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProfile} disabled={isSaving || !selectedProfile}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Delete selected profile <strong>{selectedProfile?.name ?? ""}</strong>. This action is
              irreversible.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="profile-delete-confirm">
              Type <code>{deleteConfirmTarget}</code> to confirm
            </Label>
            <Input
              id="profile-delete-confirm"
              value={deleteConfirmInput}
              onChange={(event) => {
                setDeleteConfirmInput(event.target.value);
                if (deleteError) setDeleteError(null);
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting || !selectedProfile || !isDeleteConfirmMatch}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

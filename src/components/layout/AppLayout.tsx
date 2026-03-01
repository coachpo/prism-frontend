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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [profileQuery, setProfileQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectingProfile, setIsSelectingProfile] = useState(false);
  const profileSelectionTimerRef = useRef<number | null>(null);

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
  const selectedIsActive =
    selectedProfile !== null && activeProfile !== null && selectedProfile.id === activeProfile.id;
  const hasMismatch = selectedProfile !== null && activeProfile !== null && !selectedIsActive;
  const selectedProfileName = selectedProfile?.name ?? "No profile selected";
  const activeProfileName = activeProfile?.name ?? "No active profile";
  const isProfilePillBusy = isSelectingProfile || isActivating;
  const deleteDisabledReason = selectedIsActive
    ? "Active runtime profile cannot be deleted."
    : !selectedProfile
      ? "Select a profile to delete."
      : null;
  const deleteConfirmTarget = useMemo(
    () => `delete ${selectedProfile?.name ?? ""}`.trim().toLowerCase(),
    [selectedProfile?.name]
  );

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
    return () => {
      if (profileSelectionTimerRef.current !== null) {
        window.clearTimeout(profileSelectionTimerRef.current);
      }
    };
  }, []);

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
    if (profileSelectionTimerRef.current !== null) {
      window.clearTimeout(profileSelectionTimerRef.current);
    }
    setIsSelectingProfile(true);
    selectProfile(profileId);
    setProfileSwitcherOpen(false);
    profileSelectionTimerRef.current = window.setTimeout(() => {
      setIsSelectingProfile(false);
      profileSelectionTimerRef.current = null;
    }, 250);
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
    if (selectedIsActive) {
      toast.error("Active profile cannot be deleted");
      return;
    }
    if (deleteConfirmInput.trim().toLowerCase() !== deleteConfirmTarget) {
      toast.error(`Type "${deleteConfirmTarget}" to confirm deletion`);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile(selectedProfile.id);
      toast.success(`Deleted profile ${selectedProfile.name}`);
      setDeleteOpen(false);
      setDeleteConfirmInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete profile");
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
    if (!selectedProfile || selectedIsActive) return;
    setProfileSwitcherOpen(false);
    setDeleteConfirmInput("");
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
            "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out",
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

          <div className="border-b border-sidebar-border px-3 py-3 text-[11px]">
            <p className="mb-2 font-medium uppercase tracking-wide text-sidebar-foreground/45">
              Profile status
            </p>
            <p className="text-sidebar-foreground/90">Selected: {selectedProfileName}</p>
            <p className="mt-1 text-sidebar-foreground/65">Active runtime: {activeProfileName}</p>
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

        <div className="flex flex-1 flex-col lg:ml-[280px]">
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

              <div className="flex shrink-0 items-center gap-2">
                <Popover
                  open={profileSwitcherOpen}
                  onOpenChange={(open) => {
                    if (isProfilePillBusy) return;
                    setProfileSwitcherOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-[min(76vw,320px)] justify-between gap-2 px-2.5 sm:w-[320px]"
                      disabled={isProfilePillBusy}
                      title={`Selected profile: ${selectedProfileName}. Active runtime: ${activeProfileName}.`}
>
                      <span className="min-w-0 truncate text-sm">
                        <span className="text-muted-foreground">Profile:</span>{" "}
                        <span className="font-medium">{selectedProfileName}</span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        {isProfilePillBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : selectedIsActive ? (
                          <Badge className="h-5 px-1.5 text-[10px]">Active</Badge>
                        ) : (
                          <>
                            <Badge
                              variant="outline"
                              className="h-5 border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] text-amber-700 dark:text-amber-200"
                            >
                              Not Active
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="hidden h-5 max-w-[130px] px-1.5 text-[10px] text-muted-foreground md:inline-flex"
                              title={`Active runtime: ${activeProfileName}`}
>
                              <span className="truncate">Active: {activeProfileName}</span>
                            </Badge>
                          </>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-60" />
                      </span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent align="end" className="w-[380px] max-w-[94vw] overflow-hidden p-0">
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-medium">Select profile</p>
                      <Input
                        className="mt-2"
                        value={profileQuery}
                        onChange={(event) => setProfileQuery(event.target.value)}
                        placeholder="Search profiles..."
                      />
                    </div>

                    <ScrollArea className="max-h-64">
                      <div className="space-y-1 p-2">
                        {filteredProfiles.length === 0 ? (
                          <p className="rounded-md border px-3 py-6 text-center text-sm text-muted-foreground">
                            No profiles found.
                          </p>
                        ) : (
                          filteredProfiles.map((profile) => {
                            const isSelected = selectedProfileId === profile.id;
                            const isActive = activeProfile?.id === profile.id;

                            return (
                              <button
                                key={profile.id}
                                type="button"
                                onClick={() => handleSelectProfile(profile.id)}
                                className={cn(
                                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors",
                                  isSelected
                                    ? "border-primary/50 bg-primary/5"
                                    : "border-transparent hover:bg-accent"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium">{profile.name}</span>
                                    {isActive ? (
                                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                        ACTIVE
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {profile.description ? (
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                      {profile.description}
                                    </p>
                                  ) : null}
                                </div>
                                <Check
                                  className={cn(
                                    "mt-0.5 h-4 w-4 text-primary transition-opacity",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {hasMismatch ? (
                      <div className="border-t px-3 py-2">
                        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-800 dark:text-amber-200">
                          <p className="inline-flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                            <span>
                              You're viewing <strong>{selectedProfileName}</strong>, but runtime traffic is
                              served by <strong>{activeProfileName}</strong>.
                            </span>
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              onClick={openActivateDialog}
                              disabled={isActivating}
                            >
                              Activate Selected
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={handleManageProfiles}
                            >
                              Learn more
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="border-t p-2">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-full justify-start"
                          onClick={openEditDialog}
                          disabled={!selectedProfile}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit selected
                        </Button>

                        {deleteDisabledReason ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block">
                                <Button
                                  variant="ghost"
                                  className="h-8 w-full justify-start text-destructive hover:text-destructive"
                                  disabled
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete selected
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">{deleteDisabledReason}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-8 w-full justify-start text-destructive hover:text-destructive"
                            onClick={openDeleteDialog}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete selected
                          </Button>
                        )}

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
                      </div>

                      {!canCreateProfile ? (
                        <p className="mt-2 px-2 text-xs text-amber-700 dark:text-amber-200">
                          You've reached the limit (10). Delete an inactive profile to create a new one.
                        </p>
                      ) : null}
                    </div>
                  </PopoverContent>
                </Popover>

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
              <Label htmlFor="profile-create-description">Description</Label>
              <Input
                id="profile-create-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional description"
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
              <Label htmlFor="profile-edit-description">Description</Label>
              <Input
                id="profile-edit-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional description"
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
          {selectedIsActive ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Active profile cannot be deleted. Activate a different profile first.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="profile-delete-confirm">
              Type <code>{deleteConfirmTarget}</code> to confirm
            </Label>
            <Input
              id="profile-delete-confirm"
              value={deleteConfirmInput}
              onChange={(event) => setDeleteConfirmInput(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting || selectedIsActive || !selectedProfile}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

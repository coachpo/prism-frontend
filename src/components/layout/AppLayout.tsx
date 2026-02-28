import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
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
  CheckCircle2,
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const navLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/models", icon: Server, label: "Models" },
  { to: "/endpoints", icon: Plug, label: "Endpoints" },
  { to: "/statistics", icon: BarChart3, label: "Statistics" },
  { to: "/request-logs", icon: Logs, label: "Request Logs" },
  { to: "/audit", icon: FileSearch, label: "Audit" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const MAX_PROFILES = 10;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const deleteConfirmTarget = useMemo(
    () => `delete ${selectedProfile?.name ?? ""}`.trim().toLowerCase(),
    [selectedProfile?.name]
  );

  useEffect(() => {
    if (!editOpen || !selectedProfile) return;
    setNameInput(selectedProfile.name);
    setDescriptionInput(selectedProfile.description ?? "");
  }, [editOpen, selectedProfile]);

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
    if (!selectedProfile) return;
    if (selectedIsActive) return;

    setIsActivating(true);
    try {
      await activateProfile(selectedProfile.id);
      toast.success(`Activated ${selectedProfile.name} for runtime traffic`);
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

  const profileControls = (isMobile: boolean) => (
    <div className={cn("space-y-2", isMobile ? "w-full" : "px-2 pb-3")}>
      <div className="flex items-center gap-2">
        <Select
          value={selectedProfileId !== null ? String(selectedProfileId) : undefined}
          onValueChange={(value) => selectProfile(Number.parseInt(value, 10))}
        >
          <SelectTrigger className={cn("h-8", isMobile ? "flex-1" : "w-full")}>
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={String(profile.id)}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isMobile ? (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={!canCreateProfile}
            onClick={() => {
              resetFormFields();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={selectedIsActive ? "default" : "secondary"} className="text-[11px]">
          Active: {activeProfile?.name ?? "-"}
        </Badge>
        {selectedProfile ? (
          <Badge variant="outline" className="text-[11px]">
            Selected: {selectedProfile.name}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {!selectedIsActive && selectedProfile ? (
          <Button
            size="sm"
            className="h-8"
            disabled={isActivating}
            onClick={handleActivateProfile}
          >
            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
            {isActivating ? "Activating..." : "Activate selected"}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!selectedProfile}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!selectedProfile || selectedIsActive}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </Button>
        {isMobile ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!canCreateProfile}
            onClick={() => {
              resetFormFields();
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Create
          </Button>
        ) : null}
      </div>

      {!canCreateProfile ? (
        <p className="text-xs text-amber-600">
          Maximum 10 profiles reached. Delete a profile to create a new one.
        </p>
      ) : null}

      {selectedIsActive ? (
        <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selected profile is currently active for runtime traffic.
        </div>
      ) : null}
    </div>
  );

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

          <div className="border-b border-sidebar-border pt-3">{profileControls(false)}</div>

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

          <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2.5">
            <span className="text-[11px] font-medium text-sidebar-foreground/35">v1.0</span>
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:ml-[280px]">
          <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
            <div className="flex h-8 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                  <Zap className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold tracking-tight">Prism</span>
              </div>
            </div>
            <div className="mt-3">{profileControls(true)}</div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

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
